import { getPaymentProvider } from "@raunk-butik/api/lib/payment/index";
import { createDb } from "@raunk-butik/db";
import {
	cartItems,
	coupons,
	orders,
	products,
	productVariants,
} from "@raunk-butik/db/schema/index";
import { createFileRoute } from "@tanstack/react-router";
import { and, eq, isNull, sql } from "drizzle-orm";

export const Route = createFileRoute("/api/iyzico-callback")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const db = createDb();
				const formData = await request.formData();
				const token = formData.get("token") as string;

				if (!token) {
					return new Response(
						`<html><body><script>window.top.location.href = "/checkout?error=Token+not+found";</script></body></html>`,
						{ headers: { "Content-Type": "text/html" } },
					);
				}

				// Ödemeyi doğrula — provider agnostic
				const verification = await getPaymentProvider().verifyPayment(token);

				const basketData = verification.basketId ?? "";
				const separatorIndex = basketData.lastIndexOf("|");
				const orderId =
					separatorIndex !== -1
						? basketData.substring(0, separatorIndex)
						: basketData;

				if (verification.status !== "success") {
					const errorMessage =
						verification.errorMessage ?? "Ödeme başarısız";

					if (orderId) {
						await db
							.delete(orders)
							.where(eq(orders.id, orderId))
							.catch((e) => console.error("Failed to delete order:", e));
					}

					return new Response(
						`<html><body><script>window.top.location.href = "/checkout?error=${encodeURIComponent(errorMessage)}";</script></body></html>`,
						{ headers: { "Content-Type": "text/html" } },
					);
				}

				const paymentId = verification.paymentId ?? "";

				try {
					const finalizedOrderId = await db.transaction(async (tx) => {
						const order = await tx.query.orders.findFirst({
							where: eq(orders.id, orderId),
							with: { items: { with: { product: true } } },
						});

						if (!order) {
							throw new Error("Sipariş bulunamadı");
						}

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

								if (cancelResult.status === "success") {
									refundStatus =
										"ÖDEME BAŞARIYLA İPTAL EDİLDİ (Ekstreye yansımaz)";
								} else {
									refundStatus = `İPTAL HATASI: ${cancelResult.message}`;
								}
							} catch (re) {
								refundStatus = "OTOMATİK İPTAL SİSTEM HATASI";
								console.error("Cancel system error:", re);
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
									await handleStockFailure(
										tx,
										order,
										item,
										variant?.stock || 0,
									);
									throw new Error(
										`Stok yetersiz variant: ${item.product?.name}`,
									);
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

					const order = await db.query.orders.findFirst({
						where: eq(orders.id, finalizedOrderId),
						with: { items: { with: { product: true } } },
					});

					if (order) {
						const formatter = new Intl.NumberFormat("tr-TR", {
							style: "currency",
							currency: "TRY",
						});

						try {
							const { sendOrderConfirmation, sendAdminOrderNotification } =
								await import("@raunk-butik/api/utils/email");

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
						} catch (err) {
							console.error("Failed to trigger email notifications:", err);
						}
					}

					return new Response(
						`<html><body><script>window.top.location.href = "/checkout/success?orderId=${finalizedOrderId}";</script></body></html>`,
						{ headers: { "Content-Type": "text/html" } },
					);
				} catch (dbError) {
					console.error("Order processing failed:", dbError);
					return new Response(
						`<html><body><script>window.top.location.href = "/checkout?error=${encodeURIComponent(dbError instanceof Error ? dbError.message : "Sipariş işlenemedi")}";</script></body></html>`,
						{ headers: { "Content-Type": "text/html" } },
					);
				}
			},
		},
	},
});
