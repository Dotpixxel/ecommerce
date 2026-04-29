import { getPaymentProvider } from "@raunk-butik/api/lib/payment/index";
import { createDb } from "@raunk-butik/db";
import {
	cartItems,
	coupons,
	orders,
	products,
	productVariants,
} from "@raunk-butik/db/schema/index";
import { env } from "@raunk-butik/env/server";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq, isNull, sql } from "drizzle-orm";
import Stripe from "stripe";

export const Route = createFileRoute("/api/stripe-webhook" as never)({
	server: {
		handlers: {
			POST: async ({ request }) => {
				if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
					console.error("[Stripe Webhook] Keys not configured");
					return new Response("Stripe not configured", { status: 500 });
				}

				const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
					apiVersion: "2025-02-24.acacia",
				});

				// Stripe imza doğrulaması için raw body gerekli
				const rawBody = await request.text();
				const sig = request.headers.get("stripe-signature");

				if (!sig) {
					return new Response("Missing stripe-signature header", { status: 400 });
				}

				let event: Stripe.Event;
				try {
					event = stripe.webhooks.constructEvent(
						rawBody,
						sig,
						env.STRIPE_WEBHOOK_SECRET,
					);
				} catch (err) {
					console.error("[Stripe Webhook] Signature verification failed:", err);
					return new Response(
						`Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown"}`,
						{ status: 400 },
					);
				}

				// Sadece checkout.session.completed event'ini işle
				if (event.type !== "checkout.session.completed") {
					return new Response("Event type not handled", { status: 200 });
				}

				const session = event.data.object as Stripe.Checkout.Session;

				if (session.payment_status !== "paid") {
					console.log(
						`[Stripe Webhook] Session ${session.id} not paid yet: ${session.payment_status}`,
					);
					return new Response("Not paid", { status: 200 });
				}

				const orderId = session.metadata?.orderId;
				const paymentId = session.payment_intent as string;

				if (!orderId) {
					console.error("[Stripe Webhook] No orderId in session metadata");
					return new Response("No orderId in metadata", { status: 400 });
				}

				const db = createDb();

				try {
					const finalizedOrderId = await db.transaction(async (tx) => {
						const order = await tx.query.orders.findFirst({
							where: eq(orders.id, orderId),
							with: { items: { with: { product: true } } },
						});

						if (!order) {
							throw new Error("Sipariş bulunamadı");
						}

						// Idempotency — zaten işlenmiş olabilir
						if (order.status !== "pending") {
							return orderId;
						}

						// Helper: stok yetersizse ödemeyi iade et ve siparişi sil
						const handleStockFailure = async (
							transaction: typeof tx,
							currentOrder: typeof order,
							item: (typeof order.items)[number],
							availableStock: number,
						) => {
							let refundStatus = "OTOMATİK İPTAL BAŞLATILDI";

							try {
								const cancelResult = await getPaymentProvider().cancelPayment({
									paymentId,
									conversationId: crypto.randomUUID(),
								});

								refundStatus =
									cancelResult.status === "success"
										? "ÖDEME BAŞARIYLA İADE EDİLDİ"
										: `İPTAL HATASI: ${cancelResult.message}`;
							} catch (re) {
								refundStatus = "OTOMATİK İPTAL SİSTEM HATASI";
								console.error("[Stripe Webhook] Cancel error:", re);
							}

							const { sendStockAlert } = await import(
								"@raunk-butik/api/utils/email"
							);

							await sendStockAlert({
								orderNumber: currentOrder.id.substring(0, 8).toUpperCase(),
								customerEmail: currentOrder.shippingAddress.email,
								customerName: `${currentOrder.shippingAddress.name} ${currentOrder.shippingAddress.surname}`,
								failedProduct: item.product?.name || "Bilinmeyen ürün",
								requestedQuantity: item.quantity,
								availableStock,
								refundStatus,
							});

							await transaction
								.delete(orders)
								.where(eq(orders.id, currentOrder.id));
						};

						// Stok kontrolü ve güncelleme
						for (const item of order.items) {
							if (item.size || item.color) {
								const variant = await tx.query.productVariants.findFirst({
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
									await handleStockFailure(tx, order, item, variant?.stock || 0);
									throw new Error(`Stok yetersiz variant: ${item.product?.name}`);
								}

								await tx
									.update(productVariants)
									.set({
										stock: sql`${productVariants.stock} - ${item.quantity}`,
										updatedAt: new Date(),
									})
									.where(eq(productVariants.id, variant.id));
							} else {
								const currentProduct = await tx.query.products.findFirst({
									where: eq(products.id, item.productId),
								});

								if (!currentProduct || currentProduct.stock < item.quantity) {
									await handleStockFailure(
										tx,
										order,
										item,
										currentProduct?.stock || 0,
									);
									throw new Error(
										`Stok yetersiz: ${item.product?.name || "ürün"}`,
									);
								}
							}

							await tx
								.update(products)
								.set({
									stock: sql`${products.stock} - ${item.quantity}`,
									updatedAt: new Date(),
								})
								.where(eq(products.id, item.productId));
						}

						// Kupon kullanımı
						if (order.couponId) {
							await tx
								.update(coupons)
								.set({ usedCount: sql`${coupons.usedCount} + 1` })
								.where(eq(coupons.id, order.couponId));
						}

						// Siparişi ödenmiş olarak işaretle
						await tx
							.update(orders)
							.set({ status: "paid", paymentId, updatedAt: new Date() })
							.where(eq(orders.id, orderId));

						// Sepeti temizle
						await tx
							.delete(cartItems)
							.where(eq(cartItems.userId, order.userId));

						return orderId;
					});

					// Email bildirimleri
					const order = await db.query.orders.findFirst({
						where: eq(orders.id, finalizedOrderId),
						with: { items: { with: { product: true } } },
					});

					if (order) {
						try {
							const { sendOrderConfirmation, sendAdminOrderNotification } =
								await import("@raunk-butik/api/utils/email");

							const formatter = new Intl.NumberFormat("tr-TR", {
								style: "currency",
								currency: "TRY",
							});

							const totalStr = formatter.format(
								order.totalAmount +
									order.shippingFee -
									(order.discountAmount || 0),
							);

							const emailItems = order.items.map((item) => ({
								name: item.product?.name || "Ürün",
								quantity: item.quantity,
								price: item.price,
								size: item.size || undefined,
								color: item.color || undefined,
							}));

							const commonParams = {
								orderNumber: order.id.substring(0, 8).toUpperCase(),
								orderDate: order.createdAt.toLocaleDateString("tr-TR"),
								totalAmount: totalStr,
								shippingAddress: `${order.shippingAddress.addressDetail}, ${order.shippingAddress.neighborhood}, ${order.shippingAddress.district}, ${order.shippingAddress.province} ${order.shippingAddress.zipCode}`,
								items: emailItems,
							};

							await sendOrderConfirmation({
								to: order.shippingAddress.email,
								customerName: `${order.shippingAddress.name} ${order.shippingAddress.surname}`,
								...commonParams,
							});

							await sendAdminOrderNotification({
								customerName: `${order.shippingAddress.name} ${order.shippingAddress.surname}`,
								customerEmail: order.shippingAddress.email,
								customerPhone: order.shippingAddress.gsmNumber,
								orderId: order.id,
								...commonParams,
							});
						} catch (emailErr) {
							console.error(
								"[Stripe Webhook] Failed to send email notifications:",
								emailErr,
							);
						}
					}

					return new Response("OK", { status: 200 });
				} catch (dbError) {
					console.error("[Stripe Webhook] Order processing failed:", dbError);
					// 500 döndürünce Stripe otomatik retry yapar
					return new Response(
						`Order processing failed: ${dbError instanceof Error ? dbError.message : "Unknown"}`,
						{ status: 500 },
					);
				}
			},
		},
	},
});
