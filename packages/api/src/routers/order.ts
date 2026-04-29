import { ORPCError } from "@orpc/server";
import { coupons } from "@raunk-butik/db/schema/coupon";
import {
	orders,
	products,
	productVariants,
	returnRequests,
} from "@raunk-butik/db/schema/index";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure } from "../index";

export const orderRouter = {
	getMyOrders: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;

		const userOrders = await context.db.query.orders.findMany({
			where: and(
				eq(orders.userId, userId),
				sql`${orders.status} NOT IN ('pending', 'failed')`,
			),
			with: {
				items: {
					with: {
						product: true,
					},
				},
				returnRequests: true,
			},
			orderBy: [desc(orders.createdAt)],
		});

		return userOrders;
	}),

	getOrder: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const order = await context.db.query.orders.findFirst({
				where: and(eq(orders.id, input.id), eq(orders.userId, userId)),
				with: {
					items: {
						with: {
							product: true,
						},
					},
					returnRequests: true,
				},
			});

			return order;
		}),

	trackGuestOrder: publicProcedure
		.input(z.object({ orderId: z.string(), email: z.string().email() }))
		.handler(async ({ context, input }) => {
			const order = await context.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
				with: {
					user: true,
					items: {
						with: {
							product: true,
						},
					},
				},
			});

			if (!order) {
				throw new ORPCError("NOT_FOUND", { message: "Sipariş bulunamadı" });
			}

			const guestEmail = order.shippingAddress.email || order.user?.email;
			if (guestEmail !== input.email) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Sipariş numarası ile e-posta adresi eşleşmiyor",
				});
			}

			return order;
		}),

	admin_getOrders: adminProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				cursor: z.number().default(0),
				includePending: z.boolean().default(false),
			}),
		)
		.handler(async ({ context, input }) => {
			const limit = input.limit;
			const offset = input.cursor || 0;

			const allOrders = await context.db.query.orders.findMany({
				limit: limit + 1,
				offset: offset,
				where: input.includePending
					? undefined
					: sql`${orders.status} NOT IN ('pending', 'cancelled', 'failed')`,
				with: {
					user: true,
					items: {
						with: {
							product: true,
						},
					},
				},
				orderBy: [desc(orders.createdAt)],
			});

			let nextCursor: typeof offset | undefined;
			if (allOrders.length > limit) {
				allOrders.pop();
				nextCursor = offset + limit;
			}

			return {
				items: allOrders,
				nextCursor,
			};
		}),

	admin_updateOrder: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum([
					"pending",
					"paid",
					"shipped",
					"delivered",
					"cancelled",
					"failed",
				]),
				trackingNumber: z.string().optional(),
			}),
		)
		.handler(async ({ context, input }) => {
			const order = await context.db.query.orders.findFirst({
				where: eq(orders.id, input.id),
				with: {
					items: true,
					user: true,
				},
			});

			if (!order) {
				throw new ORPCError("NOT_FOUND", { message: "Sipariş bulunamadı" });
			}

			// Handle Cancellation Logic
			if (input.status === "cancelled" && order.status !== "cancelled") {
				// Safety Check: If order is paid but has no paymentId, block automatic cancellation
				if (order.status === "paid" && !order.paymentId) {
					throw new ORPCError("BAD_REQUEST", {
						message:
							"Bu siparişin ödeme ID'si bulunamadı (elle düzeltilmiş veya eski sipariş). Otomatik iade işlemi yapılamaz. Lütfen ödeme sağlayıcı paneli üzerinden manuel iptal gerçekleştirin.",
					});
				}

				// 1. Payment Transaction (Cancel or Refund)
				if (order.paymentId) {
					try {
						const { getPaymentProvider } = await import("../lib/payment/index");
						const refundResult = await getPaymentProvider().handleFullRefund({
							paymentId: order.paymentId,
							conversationId: `admin-update-${order.id}`,
						});

						if (refundResult.status !== "success") {
							throw new Error(refundResult.message || "Ödeme iade hatası");
						}
					} catch (e: unknown) {
						const errorMessage =
							e instanceof Error ? e.message : "Bilinmeyen bir hata oluştu";
						console.error("Payment cancellation/refund failed:", e);
						throw new ORPCError("BAD_REQUEST", {
							message: `Ödeme iade edilemedi: ${errorMessage}. Lütfen ödeme panelinden kontrol edin.`,
						});
					}
				}

				// 2. Database transaction for state reversion
				await context.db.transaction(async (tx) => {
					// Revert Stock
					for (const item of order.items) {
						// 1. Revert Variant Stock if applicable
						if (item.size || item.color) {
							await tx
								.update(productVariants)
								.set({
									stock: sql`${productVariants.stock} + ${item.quantity}`,
									updatedAt: new Date(),
								})
								.where(
									and(
										eq(productVariants.productId, item.productId),
										item.size
											? eq(productVariants.size, item.size)
											: isNull(productVariants.size),
										item.color
											? eq(productVariants.color, item.color)
											: isNull(productVariants.color),
									),
								);
						}

						// 2. Revert Product Global Stock
						await tx
							.update(products)
							.set({
								stock: sql`${products.stock} + ${item.quantity}`,
								updatedAt: new Date(),
							})
							.where(eq(products.id, item.productId));
					}

					// Revert Coupon
					if (order.couponId) {
						await tx
							.update(coupons)
							.set({ usedCount: sql`${coupons.usedCount} - 1` })
							.where(
								and(
									eq(coupons.id, order.couponId),
									sql`${coupons.usedCount} > 0`,
								),
							);
					}

					// Update Order
					await tx
						.update(orders)
						.set({
							status: "cancelled",
							updatedAt: new Date(),
						})
						.where(eq(orders.id, input.id));
				});

				// 3. Send Cancellation Email
				if (order.user?.email) {
					try {
						const { sendOrderCancelled } = await import("../utils/email");
						await sendOrderCancelled({
							to: order.shippingAddress.email || order.user?.email || "",
							customerName:
								order.shippingAddress.name && order.shippingAddress.surname
									? `${order.shippingAddress.name} ${order.shippingAddress.surname}`
									: order.user?.name || "Müşterimiz",
							orderNumber: order.id.substring(0, 8).toUpperCase(),
						});
					} catch (e) {
						console.error("İptal e-postası gönderilemedi:", e);
					}
				}

				return {
					success: true,
					message: "Sipariş iptal edildi ve ödeme iade süreci başlatıldı.",
				};
			}

			// Regular Update (Status or Tracking)
			const [updatedOrder] = await context.db
				.update(orders)
				.set({
					status: input.status,
					trackingNumber: input.trackingNumber,
					updatedAt: new Date(),
				})
				.where(eq(orders.id, input.id))
				.returning();

			// Handle Shipping Notification
			if (updatedOrder && input.status === "shipped") {
				const shippingCompany =
					updatedOrder.shippingAddress &&
					typeof updatedOrder.shippingAddress === "object" &&
					"shippingCompany" in updatedOrder.shippingAddress
						? (updatedOrder.shippingAddress.shippingCompany as string)
						: "Kargo Firması";

				if (order.user?.email && input.trackingNumber) {
					try {
						const { sendOrderShipped } = await import("../utils/email");
						await sendOrderShipped({
							to: order.shippingAddress.email || order.user?.email || "",
							customerName:
								order.shippingAddress.name && order.shippingAddress.surname
									? `${order.shippingAddress.name} ${order.shippingAddress.surname}`
									: order.user?.name || "Müşterimiz",
							orderNumber: updatedOrder.id.substring(0, 8).toUpperCase(),
							shippingCompany: shippingCompany,
							trackingNumber: input.trackingNumber,
						});
					} catch (e) {
						console.error("Kargo e-postası gönderilirken hata oluştu:", e);
					}
				}
			}

			return { success: true };
		}),

	cancelOrder: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const order = await context.db.query.orders.findFirst({
				where: and(eq(orders.id, input.id), eq(orders.userId, userId)),
				with: { items: true },
			});

			if (!order) {
				throw new ORPCError("NOT_FOUND", { message: "Sipariş bulunamadı" });
			}

			// ONLY allow direct cancellation for UNPAID (pending) orders
			if (order.status !== "pending") {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"Ödenmiş veya kargoya verilmiş siparişler doğrudan iptal edilemez. Lütfen iptal talebi oluşturun.",
				});
			}

			await context.db.transaction(async (tx) => {
				if (order.status === "paid") {
					for (const item of order.items) {
						// 1. Revert Variant Stock if applicable
						if (item.size || item.color) {
							await tx
								.update(productVariants)
								.set({
									stock: sql`${productVariants.stock} + ${item.quantity}`,
									updatedAt: new Date(),
								})
								.where(
									and(
										eq(productVariants.productId, item.productId),
										item.size
											? eq(productVariants.size, item.size)
											: isNull(productVariants.size),
										item.color
											? eq(productVariants.color, item.color)
											: isNull(productVariants.color),
									),
								);
						}

						// 2. Revert Product Global Stock
						await tx
							.update(products)
							.set({
								stock: sql`${products.stock} + ${item.quantity}`,
								updatedAt: new Date(),
							})
							.where(eq(products.id, item.productId));
					}
				}

				if (order.couponId) {
					await tx
						.update(coupons)
						.set({ usedCount: sql`${coupons.usedCount} - 1` })
						.where(
							and(
								eq(coupons.id, order.couponId),
								sql`${coupons.usedCount} > 0`,
							),
						);
				}

				await tx
					.update(orders)
					.set({ status: "cancelled" })
					.where(eq(orders.id, input.id));
			});

			return { success: true };
		}),

	createReturnRequest: protectedProcedure
		.input(
			z.object({
				orderId: z.string(),
				type: z.enum(["cancel", "return"]),
				reason: z.string().min(1),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const order = await context.db.query.orders.findFirst({
				where: and(eq(orders.id, input.orderId), eq(orders.userId, userId)),
				with: {
					user: true,
				},
			});

			if (!order) {
				throw new ORPCError("NOT_FOUND", { message: "Sipariş bulunamadı" });
			}

			if (
				input.type === "cancel" &&
				order.status !== "pending" &&
				order.status !== "paid"
			) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"Kargoya verilmiş siparişler iptal edilemez. İade talebi oluşturabilirsiniz.",
				});
			}

			if (input.type === "return" && order.status !== "delivered") {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"Sadece teslim edilmiş siparişler için iade talebi oluşturabilirsiniz.",
				});
			}

			// Check if a request already exists for this order
			const existingRequest = await context.db.query.returnRequests.findFirst({
				where: and(
					eq(returnRequests.orderId, input.orderId),
					sql`${returnRequests.status} IN ('pending', 'approved')`,
				),
			});

			if (existingRequest) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Bu sipariş için zaten aktif bir talebiniz bulunmaktadır.",
				});
			}

			await context.db.insert(returnRequests).values({
				orderId: input.orderId,
				userId: userId,
				type: input.type,
				reason: input.reason,
			});

			// Admin bildirimi gönder
			try {
				const { sendAdminRequestNotification } = await import("../utils/email");
				await sendAdminRequestNotification({
					customerName:
						order.shippingAddress.name && order.shippingAddress.surname
							? `${order.shippingAddress.name} ${order.shippingAddress.surname}`
							: order.user?.name || "Müşteri",
					customerEmail: order.shippingAddress.email || order.user?.email || "",
					customerPhone: order.shippingAddress.gsmNumber,
					orderNumber: order.id.substring(0, 8).toUpperCase(),
					requestType: input.type,
					reason: input.reason,
					orderId: order.id,
				});
			} catch (e) {
				console.error("Admin bildirim e-postası gönderilemedi:", e);
			}

			return { success: true };
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
				throw new ORPCError("NOT_FOUND", {
					message: "Geçersiz indirim kuponu",
				});
			}

			const now = new Date();
			if (coupon.startDate && coupon.startDate > now) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Bu kupon henüz aktif değil",
				});
			}
			if (coupon.endDate && coupon.endDate < now) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Bu kuponun süresi dolmuş",
				});
			}

			if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Kupon kullanım limiti dolmuş",
				});
			}

			if (input.orderAmount < coupon.minOrderAmount) {
				throw new ORPCError("BAD_REQUEST", {
					message: `Bu kuponu kullanabilmek için en az ${coupon.minOrderAmount} TL tutarında sipariş vermelisiniz`,
				});
			}

			return coupon;
		}),
};
