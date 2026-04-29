import { getEmailProvider } from "@raunk-butik/email";
import { env } from "@raunk-butik/env/server";
import { render } from "@react-email/components";
import { AdminOrderNotificationEmail } from "../emails/admin-order-notification";
import { AdminRequestEmail } from "../emails/admin-request";
import { OrderCancelledEmail } from "../emails/order-cancelled";
import { OrderConfirmationEmail } from "../emails/order-confirmation";
import { OrderShippedEmail } from "../emails/order-shipped";
import { StockAlertEmail } from "../emails/stock-alert";

const isDev = env.NODE_ENV === "development";
const FROM_EMAIL = env.EMAIL_FROM || "Raunk Butik <noreply@eken24.de>";
const ADMIN_EMAIL = "raunkboutique@gmail.com";

export async function sendOrderConfirmation(params: {
	to: string;
	customerName: string;
	orderNumber: string;
	orderDate: string;
	totalAmount: string;
	shippingAddress: string;
	items: {
		name: string;
		quantity: number;
		price: number;
		size?: string;
		color?: string;
	}[];
}) {
	if (isDev) {
		console.log(
			`[EMAIL] Order Confirmation (dev mode - not sent):\n  to: ${params.to}\n  order: #${params.orderNumber}\n  total: ${params.totalAmount}`,
		);
		return { success: false, error: "Dev mode" };
	}

	try {
		const html = await render(
			OrderConfirmationEmail({
				customerName: params.customerName,
				orderNumber: params.orderNumber,
				orderDate: params.orderDate,
				totalAmount: params.totalAmount,
				shippingAddress: params.shippingAddress,
				items: params.items,
			}),
		);

		return await getEmailProvider().send({
			from: FROM_EMAIL,
			to: params.to,
			subject: `Siparişiniz Onaylandı #${params.orderNumber}`,
			html,
		});
	} catch (error) {
		console.error("Failed to send order confirmation email:", error);
		return { success: false, error };
	}
}

export async function sendAdminOrderNotification(params: {
	customerName: string;
	customerEmail: string;
	orderNumber: string;
	orderDate: string;
	totalAmount: string;
	shippingAddress: string;
	items: {
		name: string;
		quantity: number;
		price: number;
		size?: string;
		color?: string;
	}[];
	orderId: string;
	customerPhone?: string;
}) {
	if (isDev) {
		console.log(
			`[EMAIL] Admin Order Notification (dev mode - not sent):\n  order: #${params.orderNumber}\n  total: ${params.totalAmount}`,
		);
		return { success: false, error: "Dev mode" };
	}

	try {
		const html = await render(
			AdminOrderNotificationEmail({
				customerName: params.customerName,
				customerEmail: params.customerEmail,
				orderNumber: params.orderNumber,
				orderDate: params.orderDate,
				totalAmount: params.totalAmount,
				shippingAddress: params.shippingAddress,
				items: params.items,
				orderId: params.orderId,
				customerPhone: params.customerPhone,
			}),
		);

		return await getEmailProvider().send({
			from: FROM_EMAIL,
			to: ADMIN_EMAIL,
			subject: `Yeni Sipariş Alındı! #${params.orderNumber}`,
			html,
		});
	} catch (error) {
		console.error("Failed to send admin order notification email:", error);
		return { success: false, error };
	}
}

export async function sendOrderShipped(params: {
	to: string;
	customerName: string;
	orderNumber: string;
	shippingCompany: string;
	trackingNumber: string;
	trackingUrl?: string;
}) {
	if (isDev) {
		console.log(
			`[EMAIL] Order Shipped (dev mode - not sent):\n  to: ${params.to}\n  order: #${params.orderNumber}\n  tracking: ${params.trackingNumber}`,
		);
		return { success: false, error: "Dev mode" };
	}

	try {
		const html = await render(
			OrderShippedEmail({
				customerName: params.customerName,
				orderNumber: params.orderNumber,
				shippingCompany: params.shippingCompany,
				trackingNumber: params.trackingNumber,
				trackingUrl: params.trackingUrl,
			}),
		);

		return await getEmailProvider().send({
			from: FROM_EMAIL,
			to: params.to,
			subject: `Siparişiniz Kargoya Verildi #${params.orderNumber}`,
			html,
		});
	} catch (error) {
		console.error("Failed to send order shipped email:", error);
		return { success: false, error };
	}
}

export async function sendStockAlert(params: {
	orderNumber: string;
	customerEmail: string;
	customerName: string;
	failedProduct: string;
	requestedQuantity: number;
	availableStock: number;
	refundStatus: string;
}) {
	const subject = "URGENT: Stok Yetersiz - İade Gerekli";

	if (isDev) {
		console.log(
			`[EMAIL] Stock Alert (dev mode - not sent):\n  order: #${params.orderNumber}\n  product: ${params.failedProduct}\n  refund: ${params.refundStatus}`,
		);
		return { success: false, error: "Dev mode" };
	}

	try {
		const html = await render(
			StockAlertEmail({
				orderNumber: params.orderNumber,
				customerEmail: params.customerEmail,
				customerName: params.customerName,
				failedProduct: params.failedProduct,
				requestedQuantity: params.requestedQuantity,
				availableStock: params.availableStock,
				refundStatus: params.refundStatus,
			}),
		);

		return await getEmailProvider().send({
			from: FROM_EMAIL,
			to: ADMIN_EMAIL,
			subject,
			html,
		});
	} catch (error) {
		console.error("Failed to send stock alert email:", error);
		return { success: false, error };
	}
}

export async function sendAdminRequestNotification(params: {
	customerName: string;
	customerEmail: string;
	orderNumber: string;
	requestType: "cancel" | "return";
	reason: string;
	orderId: string;
	customerPhone?: string;
}) {
	const subject = `Yeni ${params.requestType === "cancel" ? "İptal" : "İade"} Talebi #${params.orderNumber}`;

	if (isDev) {
		console.log(
			`[EMAIL] Admin Request (dev mode - not sent):\n  order: #${params.orderNumber}\n  type: ${params.requestType}\n  reason: ${params.reason}`,
		);
		return { success: false, error: "Dev mode" };
	}

	try {
		const html = await render(
			AdminRequestEmail({
				customerName: params.customerName,
				customerEmail: params.customerEmail,
				orderNumber: params.orderNumber,
				requestType: params.requestType,
				reason: params.reason,
				orderId: params.orderId,
				customerPhone: params.customerPhone,
			}),
		);

		return await getEmailProvider().send({
			from: FROM_EMAIL,
			to: ADMIN_EMAIL,
			subject,
			html,
		});
	} catch (error) {
		console.error("Failed to send admin request notification email:", error);
		return { success: false, error };
	}
}

export async function sendOrderCancelled(params: {
	to: string;
	customerName: string;
	orderNumber: string;
}) {
	if (isDev) {
		console.log(
			`[EMAIL] Order Cancelled (dev mode - not sent):\n  to: ${params.to}\n  order: #${params.orderNumber}`,
		);
		return { success: false, error: "Dev mode" };
	}

	try {
		const html = await render(
			OrderCancelledEmail({
				customerName: params.customerName,
				orderNumber: params.orderNumber,
			}),
		);

		return await getEmailProvider().send({
			from: FROM_EMAIL,
			to: params.to,
			subject: `Siparişiniz İptal Edildi ve İade Yapıldı #${params.orderNumber}`,
			html,
		});
	} catch (error) {
		console.error("Failed to send order cancelled email:", error);
		return { success: false, error };
	}
}
