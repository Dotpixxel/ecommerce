import { ORPCError } from "@orpc/server";
import { user } from "@raunk-butik/db/schema/auth";
import { campaigns } from "@raunk-butik/db/schema/campaign";
import { coupons } from "@raunk-butik/db/schema/coupon";
import {
	orderItems,
	orders,
	returnRequests,
} from "@raunk-butik/db/schema/order";
import {
	backInStockRequests,
	categories,
	products,
	productVariants,
	reviews,
} from "@raunk-butik/db/schema/product";
import { siteSettings } from "@raunk-butik/db/schema/settings";
import { and, asc, desc, eq, isNull, ne, notInArray, sql } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure } from "../index";

export const adminRouter = {
	getDashboardStats: adminProcedure.handler(async ({ context: { db } }) => {
		const [usersCount] = await db
			.select({ count: sql`count(*)`.mapWith(Number) })
			.from(user);

		const [ordersCount] = await db
			.select({ count: sql`count(*)`.mapWith(Number) })
			.from(orders)
			.where(sql`status != 'pending'`);

		const [revenue] = await db
			.select({
				total: sql`sum(total_amount + shipping_fee - discount_amount)`.mapWith(
					Number,
				),
			})
			.from(orders)
			.where(and(ne(orders.status, "cancelled"), ne(orders.status, "pending")));

		const [pendingOrdersCount] = await db
			.select({ count: sql`count(*)`.mapWith(Number) })
			.from(orders)
			.where(sql`status = 'pending'`);

		const [paidOrdersCount] = await db
			.select({ count: sql`count(*)`.mapWith(Number) })
			.from(orders)
			.where(sql`status = 'paid'`);

		const [pendingReturnRequestsCount] = await db
			.select({ count: sql`count(*)`.mapWith(Number) })
			.from(returnRequests)
			.where(sql`status = 'pending'`);

		const [pendingReviewsCount] = await db
			.select({ count: sql`count(*)`.mapWith(Number) })
			.from(reviews)
			.where(sql`status = 'pending'`);

		const recentOrders = await db.query.orders.findMany({
			where: ne(orders.status, "pending"),
			with: {
				user: true,
				items: true,
			},
			orderBy: [desc(orders.createdAt)],
			limit: 5,
		});

		return {
			usersCount: usersCount?.count || 0,
			ordersCount: ordersCount?.count || 0,
			totalRevenue: revenue?.total || 0,
			pendingOrders: pendingOrdersCount?.count || 0,
			paidOrdersCount: paidOrdersCount?.count || 0,
			pendingReturnRequestsCount: pendingReturnRequestsCount?.count || 0,
			pendingReviewsCount: pendingReviewsCount?.count || 0,
			recentOrders,
		};
	}),

	getProducts: adminProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				cursor: z.number().default(0),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const limit = input.limit;
			const offset = input.cursor;

			const items = await db.query.products.findMany({
				where: isNull(products.deletedAt),
				limit: limit + 1,
				offset: offset,
				with: {
					category: true,
				},
				orderBy: [desc(products.createdAt), desc(products.id)],
			});

			let nextCursor: typeof offset | undefined;
			if (items.length > limit) {
				items.pop();
				nextCursor = offset + limit;
			}

			const [total] = await db
				.select({ count: sql`count(*)`.mapWith(Number) })
				.from(products)
				.where(isNull(products.deletedAt));

			return {
				items,
				nextCursor,
				total: total?.count || 0,
			};
		}),

	getProduct: adminProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context: { db }, input }) => {
			return await db.query.products.findFirst({
				where: and(eq(products.id, input.id), isNull(products.deletedAt)),
				with: {
					category: true,
					variants: true,
				},
			});
		}),

	saveProduct: adminProcedure
		.input(
			z.object({
				id: z.string().optional(),
				name: z.string().min(1),
				slug: z.string().min(1),
				description: z.string(),
				price: z.number().positive(),
				stock: z.number().int().nonnegative(),
				images: z.array(z.string()),
				brand: z.string().nullable(),
				categoryId: z.string().nullable(),
				sizes: z.array(z.string()).nullable(),
				colors: z.array(z.string()).nullable(),
				isActive: z.boolean().default(true),
				variants: z
					.array(
						z.object({
							id: z.string().optional(),
							size: z.string().nullable(),
							color: z.string().nullable(),
							stock: z.number().int().nonnegative(),
						}),
					)
					.optional(),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const { id: productId, ...data } = input;

			let finalSlug = data.slug;
			const existingProduct = await db.query.products.findFirst({
				where: eq(products.slug, finalSlug),
			});

			// If a product with this slug exists, and it's not the one we are updating, make the slug unique
			if (existingProduct && existingProduct.id !== productId) {
				const randomSuffix = Math.random().toString(36).substring(2, 8);
				finalSlug = `${finalSlug}-${randomSuffix}`;
			}

			data.slug = finalSlug;

			if (productId) {
				const [updated] = await db
					.update(products)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(eq(products.id, productId))
					.returning();

				// Update variants
				if (input.variants) {
					const newVariantIds = input.variants
						.map((v) => v.id)
						.filter(Boolean) as string[];

					if (newVariantIds.length > 0) {
						await db
							.delete(productVariants)
							.where(
								and(
									eq(productVariants.productId, productId),
									notInArray(productVariants.id, newVariantIds),
								),
							);
					} else {
						await db
							.delete(productVariants)
							.where(eq(productVariants.productId, productId));
					}

					// Upsert variants
					for (const variant of input.variants) {
						if (variant.id) {
							await db
								.update(productVariants)
								.set({
									size: variant.size,
									color: variant.color,
									stock: variant.stock,
									updatedAt: new Date(),
								})
								.where(eq(productVariants.id, variant.id));
						} else {
							await db.insert(productVariants).values({
								id: crypto.randomUUID(),
								productId: productId,
								size: variant.size,
								color: variant.color,
								stock: variant.stock,
							});
						}
					}
				}

				return updated;
			}

			const [created] = await db.insert(products).values(data).returning();

			// Initial variants
			if (input.variants && created) {
				for (const variant of input.variants) {
					await db.insert(productVariants).values({
						id: crypto.randomUUID(),
						productId: created.id,
						size: variant.size,
						color: variant.color,
						stock: variant.stock,
					});
				}
			}

			return created;
		}),

	deleteProduct: adminProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context: { db }, input }) => {
			// Check if product has any orders
			const [existingOrderItem] = await db
				.select()
				.from(orderItems)
				.where(eq(orderItems.productId, input.id))
				.limit(1);

			if (existingOrderItem) {
				// Has orders, use soft delete
				await db
					.update(products)
					.set({ deletedAt: new Date(), isActive: false })
					.where(eq(products.id, input.id));
			} else {
				// No orders, hard delete
				await db.delete(products).where(eq(products.id, input.id));
			}

			return { success: true };
		}),

	// Categories
	getCategories: adminProcedure.handler(async ({ context: { db } }) => {
		return await db.query.categories.findMany({
			orderBy: [asc(categories.order)],
			with: {
				parent: true,
				children: true,
			},
		});
	}),

	saveCategory: adminProcedure
		.input(
			z.object({
				id: z.string().optional(),
				name: z.string().min(1),
				slug: z.string().min(1),
				parentId: z.string().nullable(),
				imageUrl: z.string().nullable(),
				order: z.number().int().default(0),
				isActive: z.boolean().default(true),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const { id: categoryId, ...data } = input;
			try {
				if (categoryId) {
					const [updated] = await db
						.update(categories)
						.set(data)
						.where(eq(categories.id, categoryId))
						.returning();
					return updated;
				}
				const [created] = await db.insert(categories).values(data).returning();
				return created;
			} catch (error) {
				console.error("Error saving category:", error);
				if (
					error instanceof Error &&
					error.message.includes("UNIQUE constraint failed")
				) {
					throw new ORPCError("BAD_REQUEST", {
						message:
							"Bu isimde veya slug'da bir kategori zaten mevcut. Lütfen farklı bir isim deneyin.",
					});
				}
				throw error;
			}
		}),

	deleteCategory: adminProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context: { db }, input }) => {
			try {
				// Detach products from this category before deleting it
				await db
					.update(products)
					.set({ categoryId: null })
					.where(eq(products.categoryId, input.id));

				await db.delete(categories).where(eq(categories.id, input.id));
				return { success: true };
			} catch (error) {
				console.error("Error deleting category:", error);
				if (
					error instanceof Error &&
					error.message.includes("FOREIGN KEY constraint failed")
				) {
					throw new ORPCError("BAD_REQUEST", {
						message:
							"Bu kategori silinemez çünkü hala bağlı veriler mevcut. Lütfen önce bu kategoriyi kullanan alt öğeleri kontrol edin.",
					});
				}
				throw error;
			}
		}),

	// Coupons
	getCoupons: adminProcedure.handler(async ({ context: { db } }) => {
		return await db.query.coupons.findMany({
			orderBy: [desc(coupons.createdAt)],
		});
	}),

	saveCoupon: adminProcedure
		.input(
			z.object({
				id: z.string().optional(),
				code: z.string().min(1),
				discountType: z.enum(["percentage", "fixed"]),
				discountAmount: z.number().positive(),
				minOrderAmount: z.number().nonnegative().default(0),
				startDate: z.date().nullable(),
				endDate: z.date().nullable(),
				usageLimit: z.number().int().nullable(),
				isActive: z.boolean().default(true),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const { id: couponId, ...data } = input;
			if (couponId) {
				const [updated] = await db
					.update(coupons)
					.set({ ...data, updatedAt: new Date() })
					.where(eq(coupons.id, couponId))
					.returning();
				return updated;
			}
			const [created] = await db.insert(coupons).values(data).returning();
			return created;
		}),

	deleteCoupon: adminProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context: { db }, input }) => {
			await db.delete(coupons).where(eq(coupons.id, input.id));
			return { success: true };
		}),

	// Campaigns
	getCampaigns: adminProcedure.handler(async ({ context: { db } }) => {
		return await db.query.campaigns.findMany({
			orderBy: [asc(campaigns.priority)],
		});
	}),

	saveCampaign: adminProcedure
		.input(
			z.object({
				id: z.string().optional(),
				title: z.string().min(1),
				description: z.string().nullable(),
				imageUrl: z.string().nullable(),
				linkUrl: z.string().nullable(),
				startDate: z.date().nullable(),
				endDate: z.date().nullable(),
				isActive: z.boolean().default(true),
				priority: z.number().int().default(0),
				showTitle: z.boolean().default(true),
				showDescription: z.boolean().default(true),
				showButton: z.boolean().default(true),
				showBanner: z.boolean().default(true),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const { id: campaignId, ...data } = input;
			if (campaignId) {
				const [updated] = await db
					.update(campaigns)
					.set({ ...data, updatedAt: new Date() })
					.where(eq(campaigns.id, campaignId))
					.returning();
				return updated;
			}
			const [created] = await db.insert(campaigns).values(data).returning();
			return created;
		}),

	deleteCampaign: adminProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context: { db }, input }) => {
			await db.delete(campaigns).where(eq(campaigns.id, input.id));
			return { success: true };
		}),

	// Back In Stock Requests
	getBackInStockRequests: adminProcedure
		.input(
			z.object({
				limit: z.number().default(20),
				cursor: z.number().default(0),
				status: z.enum(["pending", "notified"]).optional(),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const limit = input.limit;
			const offset = input.cursor;

			const conditions = input.status
				? eq(backInStockRequests.status, input.status)
				: undefined;

			const items = await db.query.backInStockRequests.findMany({
				limit: limit + 1,
				offset: offset,
				where: conditions,
				orderBy: [desc(backInStockRequests.createdAt)],
				with: {
					product: true,
				},
			});

			let nextCursor: typeof offset | undefined;
			if (items.length > limit) {
				items.pop();
				nextCursor = offset + limit;
			}

			const [total] = await db
				.select({ count: sql`count(*)`.mapWith(Number) })
				.from(backInStockRequests)
				.where(conditions);

			return { items, nextCursor, total: total?.count ?? 0 };
		}),

	updateBackInStockRequest: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["pending", "notified"]),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			await db
				.update(backInStockRequests)
				.set({ status: input.status })
				.where(eq(backInStockRequests.id, input.id));

			return { success: true };
		}),

	// Reviews
	getReviews: adminProcedure
		.input(
			z.object({
				limit: z.number().default(10),
				cursor: z.number().default(0),
				status: z.enum(["pending", "approved", "rejected"]).optional(),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const limit = input.limit;
			const offset = input.cursor;

			const conditions = [];
			if (input.status) {
				conditions.push(eq(reviews.status, input.status));
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			const items = await db.query.reviews.findMany({
				where: whereClause,
				limit: limit + 1,
				offset: offset,
				with: {
					product: true,
					user: true,
				},
				orderBy: [desc(reviews.createdAt)],
			});

			let nextCursor: typeof offset | undefined;
			if (items.length > limit) {
				items.pop();
				nextCursor = offset + limit;
			}

			const [total] = await db
				.select({ count: sql`count(*)`.mapWith(Number) })
				.from(reviews)
				.where(whereClause);

			return {
				items,
				nextCursor,
				total: total?.count || 0,
			};
		}),

	updateReviewStatus: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["approved", "rejected"]),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			await db
				.update(reviews)
				.set({ status: input.status })
				.where(eq(reviews.id, input.id));
			return { success: true };
		}),

	deleteReview: adminProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context: { db }, input }) => {
			await db.delete(reviews).where(eq(reviews.id, input.id));
			return { success: true };
		}),

	// Returns and Cancellations
	getReturnRequests: adminProcedure.handler(async ({ context: { db } }) => {
		return await db.query.returnRequests.findMany({
			with: {
				order: true,
				user: true,
			},
			orderBy: [desc(returnRequests.createdAt)],
		});
	}),

	updateReturnRequestStatus: adminProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["pending", "approved", "rejected"]),
				adminNote: z.string().optional(),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			const request = await db.query.returnRequests.findFirst({
				where: eq(returnRequests.id, input.id),
				with: {
					order: {
						with: {
							items: true,
							user: true,
						},
					},
				},
			});

			if (!request) {
				throw new ORPCError("NOT_FOUND", { message: "Talep bulunamadı" });
			}

			if (request.status !== "pending") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Bu talep zaten sonuçlandırılmış",
				});
			}

			if (input.status === "rejected") {
				const [updated] = await db
					.update(returnRequests)
					.set({
						status: "rejected",
						adminNote: input.adminNote,
						updatedAt: new Date(),
					})
					.where(eq(returnRequests.id, input.id))
					.returning();
				return updated;
			}

			// APPROVED CASE
			const order = request.order;
			let iyzicoMessage = "";

			// 1. Iyzico Cancellation/Refund
			// Safety Check: If order is paid but has no paymentId, block automatic cancellation
		if (order.status === "paid" && !order.paymentId) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"Bu siparişin ödeme ID'si bulunamadı (elle düzeltilmiş veya eski sipariş). Otomatik iade işlemi yapılamaz. Lütfen ödeme sağlayıcı paneli üzerinden manuel iptal gerçekleştirin.",
			});
		}

		if (order.paymentId) {
			try {
				const { getPaymentProvider } = await import("../lib/payment/index");
				const refundResult = await getPaymentProvider().handleFullRefund({
					paymentId: order.paymentId,
					conversationId: `admin-approval-${request.id}`,
				});

				if (refundResult.status !== "success") {
					throw new Error(refundResult.message || "Ödeme iade hatası");
				}
				iyzicoMessage = refundResult.message;
			} catch (e: unknown) {
				const errorMessage =
					e instanceof Error ? e.message : "Bilinmeyen bir hata oluştu";
				console.error("Automated refund failed:", e);
				throw new ORPCError("BAD_REQUEST", {
					message: `Otomatik ödeme iadesi başarısız: ${errorMessage}. Lütfen ödeme sağlayıcı panelinden manuel kontrol edin.`,
				});
			}
		}

			// 2. Database Updates (Order Status + Return Request Status + Stock/Coupon)
			const [finalRequest] = await db.transaction(async (tx) => {
				// Update Order to cancelled for both cancel and return requests
				await tx
					.update(orders)
					.set({
						status: "cancelled",
						updatedAt: new Date(),
					})
					.where(eq(orders.id, request.orderId));

				// Revert Stock and Coupon for both cancel and return types
				for (const item of order.items) {
					// 1. Update Product Total Stock
					await tx
						.update(products)
						.set({
							stock: sql`${products.stock} + ${item.quantity}`,
							updatedAt: new Date(),
						})
						.where(eq(products.id, item.productId));

					// 2. Update Variant Stock if size/color specified
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

				// Update Request Status Last
				return await tx
					.update(returnRequests)
					.set({
						status: "approved",
						adminNote: input.adminNote,
						updatedAt: new Date(),
					})
					.where(eq(returnRequests.id, input.id))
					.returning();
			});

			// 3. Send Notification Email
			if (order.shippingAddress?.email) {
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
					console.error("İptal/İade bildirim e-postası gönderilemedi:", e);
				}
			}

			return {
				...finalRequest,
				message: `Talep onaylandı. ${iyzicoMessage} Stok ve kupon iadeleri yapıldı.`,
			};
		}),

	// Settings
	getSettings: adminProcedure.handler(async ({ context: { db } }) => {
		return await db.query.siteSettings.findMany({});
	}),

	saveSettings: adminProcedure
		.input(
			z.array(
				z.object({
					key: z.string(),
					value: z.string(),
					description: z.string().optional(),
				}),
			),
		)
		.handler(async ({ context: { db }, input }) => {
			for (const setting of input) {
				await db
					.insert(siteSettings)
					.values({
						key: setting.key,
						value: setting.value,
						description: setting.description,
						updatedAt: new Date(),
					})
					.onConflictDoUpdate({
						target: siteSettings.key,
						set: {
							value: setting.value,
							description: setting.description,
							updatedAt: new Date(),
						},
					});
			}
			return { success: true };
		}),
};
