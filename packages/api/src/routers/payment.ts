import { ORPCError } from "@orpc/server";
import {
	cartItems,
	coupons,
	orderItems,
	orders,
	type products,
	productVariants,
} from "@raunk-butik/db/schema/index";
import { and, eq, type InferSelectModel, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { getPaymentProvider } from "../lib/payment/index";
import { Iyzipay } from "../lib/payment/providers/iyzico";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface IyzicoBaseResponse {
	status: string;
	errorCode?: string;
	errorMessage?: string;
	errorGroup?: string;
}

type SelectOrder = InferSelectModel<typeof orders>;
type SelectOrderItems = InferSelectModel<typeof orderItems>;
type SelectCartItems = InferSelectModel<typeof cartItems>;
type SelectProduct = InferSelectModel<typeof products>;

type CheckoutItem =
	| (SelectOrderItems & { product: SelectProduct })
	| (SelectCartItems & { product: SelectProduct });

type CheckoutOrder = Omit<SelectOrder, "shippingAddress"> & {
	shippingAddress: {
		name: string;
		surname: string;
		email: string;
		gsmNumber: string;
		province: string;
		district: string;
		neighborhood: string;
		addressDetail: string;
		zipCode: string;
		shippingCompany?: "DHL" | "ARAS";
	};
};

// ─── Input schemas ──────────────────────────────────────────────────────────

const buyerSchema = z.object({
	id: z.string(),
	name: z.string(),
	surname: z.string(),
	gsmNumber: z.string(),
	email: z.string(),
	identityNumber: z.string(),
	lastLoginDate: z.string(),
	registrationDate: z.string(),
	registrationAddress: z.string(),
	ip: z.string().optional(),
	city: z.string(),
	country: z.string(),
	zipCode: z.string(),
});

const raunkAddressSchema = z.object({
	name: z.string(),
	surname: z.string(),
	email: z.string(),
	gsmNumber: z.string(),
	province: z.string(),
	district: z.string(),
	neighborhood: z.string(),
	addressDetail: z.string(),
	zipCode: z.string(),
});

// ─── Shared checkout session builder ───────────────────────────────────────

async function createPaymentSession(params: {
	order: CheckoutOrder;
	items: CheckoutItem[];
	buyer: z.infer<typeof buyerSchema>;
	callbackUrl: string;
	clientIp: string;
}) {
	const { order, items, buyer, callbackUrl, clientIp } = params;

	const basketItems = items.map((item) => {
		const unitPrice = "price" in item ? item.price : item.product.price;
		return {
			id: item.id,
			name: item.product.name,
			category1: "General",
			itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
			price: (unitPrice * item.quantity).toFixed(2),
		};
	});

	if (order.shippingFee > 0) {
		basketItems.push({
			id: `shipping-${order.id}`,
			name: `Kargo Ücreti (${order.shippingAddress.shippingCompany || "DHL"})`,
			category1: "Shipping",
			itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
			price: order.shippingFee.toFixed(2),
		});
	}

	const totalAmount = order.totalAmount;
	const paidAmount = Math.max(
		0.1,
		totalAmount + order.shippingFee - (order.discountAmount || 0),
	);

	const contactName = `${order.shippingAddress.name} ${order.shippingAddress.surname}`;
	const fullAddress = `${order.shippingAddress.neighborhood} ${order.shippingAddress.addressDetail} ${order.shippingAddress.district} ${order.shippingAddress.province}`;

	return getPaymentProvider().createCheckoutSession({
		orderId: order.id,
		basketId: `${order.id}|${order.shippingAddress.shippingCompany || "DHL"}`,
		items: basketItems,
		totalAmount,
		paidAmount,
		shippingFee: order.shippingFee,
		currency: "TRY",
		callbackUrl,
		buyer: {
			...buyer,
			ip: clientIp || "127.0.0.1",
		},
		shippingAddress: {
			contactName,
			city: order.shippingAddress.province,
			country: "Turkey",
			address: fullAddress,
			zipCode: order.shippingAddress.zipCode,
		},
		billingAddress: {
			contactName,
			city: order.shippingAddress.province,
			country: "Turkey",
			address: fullAddress,
			zipCode: order.shippingAddress.zipCode,
		},
		enabledInstallments: [2, 3, 6, 9],
	});
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const paymentRouter = {
	createCheckoutSession: protectedProcedure
		.input(
			z.object({
				buyer: buyerSchema,
				shippingAddress: raunkAddressSchema,
				callbackUrl: z.string(),
				shippingCompany: z.enum(["DHL"]),
				couponCode: z.string().optional(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			// Eski pending siparişleri temizle
			const oldPendingOrders = await context.db.query.orders.findMany({
				where: and(eq(orders.userId, userId), eq(orders.status, "pending")),
			});
			if (oldPendingOrders.length > 0) {
				const oldOrderIds = oldPendingOrders.map((o) => o.id);
				console.log(
					`Cleaning up ${oldOrderIds.length} pending orders for user ${userId}`,
				);
				await context.db
					.delete(orderItems)
					.where(
						sql`${orderItems.orderId} IN ${oldOrderIds.map((id) => sql`${id}`)}`,
					);
				await context.db
					.delete(orders)
					.where(and(eq(orders.userId, userId), eq(orders.status, "pending")));
			}

			const items = await context.db.query.cartItems.findMany({
				where: eq(cartItems.userId, userId),
				with: { product: true },
			});

			if (items.length === 0) {
				throw new ORPCError("BAD_REQUEST", { message: "Cart is empty" });
			}

			// Stok kontrolü
			for (const item of items) {
				if (item.size || item.color) {
					const variant = await context.db.query.productVariants.findFirst({
						where: and(
							eq(productVariants.productId, item.productId),
							item.size
								? eq(productVariants.size, item.size)
								: isNull(productVariants.size),
							item.color
								? eq(productVariants.color, item.color)
								: isNull(productVariants.color),
						),
					});

					if (!variant || variant.stock < item.quantity) {
						throw new ORPCError("BAD_REQUEST", {
							message: `${item.product.name} (${item.size || ""}${item.size && item.color ? "/" : ""}${item.color || ""}) için yeterli stok yok`,
						});
					}
				} else if (item.product.stock < item.quantity) {
					throw new ORPCError("BAD_REQUEST", {
						message: `${item.product.name} için yeterli stok yok`,
					});
				}
			}

			const rawTotalPrice = items.reduce(
				(acc, item) => acc + item.product.price * item.quantity,
				0,
			);

			// Kargo ücreti
			const settings = await context.db.query.siteSettings.findMany();
			const settingsMap = settings.reduce(
				(acc, curr) => {
					acc[curr.key] = curr.value;
					return acc;
				},
				{} as Record<string, string>,
			);

			const thresholdStr = settingsMap["freeShippingThreshold"] || "500";
			const shippingThreshold = Number.parseFloat(thresholdStr);

			let shippingFee = 0;
			if (rawTotalPrice < shippingThreshold) {
				const feeKey = `shipping_fee_${input.shippingCompany.toLowerCase()}`;
				const feeStr = settingsMap[feeKey] || "49.9";
				shippingFee = Number.parseFloat(feeStr);
			}

			// Kupon
			let couponId: string | undefined;
			let discountAmount = 0;

			if (input.couponCode) {
				const coupon = await context.db.query.coupons.findFirst({
					where: and(
						eq(coupons.code, input.couponCode.toUpperCase()),
						eq(coupons.isActive, true),
					),
				});

				if (coupon) {
					const now = new Date();
					const isValid =
						(!coupon.startDate || coupon.startDate <= now) &&
						(!coupon.endDate || coupon.endDate >= now) &&
						(!coupon.usageLimit ||
							(coupon.usedCount || 0) < coupon.usageLimit) &&
						rawTotalPrice >= coupon.minOrderAmount;

					if (isValid) {
						couponId = coupon.id;
						if (coupon.discountType === "percentage") {
							discountAmount = (rawTotalPrice * coupon.discountAmount) / 100;
						} else {
							discountAmount = coupon.discountAmount;
						}
						discountAmount = Math.min(discountAmount, rawTotalPrice);
					}
				}
			}

			// Sipariş oluştur
			const { newOrder } = await context.db.transaction(async (tx) => {
				const [order] = await tx
					.insert(orders)
					.values([
						{
							userId,
							status: "pending",
							totalAmount: rawTotalPrice,
							shippingFee,
							discountAmount,
							couponId,
							shippingAddress: {
								...input.shippingAddress,
								shippingCompany: input.shippingCompany,
							},
						},
					])
					.returning();

				if (!order) {
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Sipariş oluşturulamadı",
					});
				}

				for (const item of items) {
					await tx.insert(orderItems).values({
						orderId: order.id,
						productId: item.productId,
						quantity: item.quantity,
						price: item.product.price,
						size: item.size,
						color: item.color,
					});
				}

				return { newOrder: order };
			});

			// Ödeme oturumu başlat
			const result = await createPaymentSession({
				order: newOrder,
				items,
				buyer: input.buyer,
				callbackUrl: input.callbackUrl,
				clientIp: context.clientIp,
			});

			if (result.status === "failure") {
				console.error("Payment Session Initialization Failed:", result.errorMessage);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: `Ödeme oturumu başlatılamadı: ${result.errorMessage}`,
				});
			}

			// Return paymentUrl + hem yeni hem eski alan adları (frontend backward compat)
			return {
				status: result.status,
				paymentUrl: result.paymentUrl,
				// Iyzico frontend backward compat aliases
				payWithIyzicoPageUrl: result.paymentUrl,
				paymentPageUrl: result.paymentUrl,
				errorMessage: result.errorMessage,
				// Raw provider response (token vs.)
				...result.raw,
			};
		}),

	getCheckoutResult: protectedProcedure
		.input(z.object({ token: z.string() }))
		.handler(async ({ input }) => {
			return getPaymentProvider().verifyPayment(input.token);
		}),

	validateCoupon: protectedProcedure
		.input(
			z.object({
				code: z.string().min(1),
				orderAmount: z.number().nonnegative(),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const coupon = await db.query.coupons.findFirst({
				where: and(
					eq(coupons.code, input.code.toUpperCase()),
					eq(coupons.isActive, true),
				),
			});

			if (!coupon) {
				throw new ORPCError("NOT_FOUND", { message: "Geçersiz indirim kuponu" });
			}

			const now = new Date();
			if (coupon.startDate && coupon.startDate > now) {
				throw new ORPCError("BAD_REQUEST", { message: "Bu kupon henüz aktif değil" });
			}
			if (coupon.endDate && coupon.endDate < now) {
				throw new ORPCError("BAD_REQUEST", { message: "Bu kuponun süresi dolmuş" });
			}
			if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
				throw new ORPCError("BAD_REQUEST", { message: "Kupon kullanım limiti dolmuş" });
			}
			if (input.orderAmount < coupon.minOrderAmount) {
				throw new ORPCError("BAD_REQUEST", {
					message: `Bu kuponu kullanabilmek için en az ${coupon.minOrderAmount} TL tutarında sipariş vermelisiniz`,
				});
			}

			return coupon;
		}),
};
