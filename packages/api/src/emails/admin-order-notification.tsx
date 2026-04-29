import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	pixelBasedPreset,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface OrderItem {
	name: string;
	quantity: number;
	price: number;
	size?: string;
	color?: string;
}

interface AdminOrderNotificationEmailProps {
	customerName: string;
	customerEmail: string;
	orderNumber: string;
	orderDate: string;
	totalAmount: string;
	shippingAddress: string;
	items: OrderItem[];
	orderId: string;
	customerPhone?: string;
}

const formatter = new Intl.NumberFormat("tr-TR", {
	style: "currency",
	currency: "TRY",
});

export const AdminOrderNotificationEmail = ({
	customerName,
	customerEmail,
	orderNumber,
	orderDate,
	totalAmount,
	shippingAddress,
	items,
	orderId,
	customerPhone,
}: AdminOrderNotificationEmailProps) => {
	const adminUrl = `https://raunkbutik.com/admin/orders/${orderId}`;

	return (
		<Html>
			<Head />
			<Preview>Yeni Sipariş Alındı! #{orderNumber}</Preview>
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
					theme: {
						extend: {
							colors: {
								brand: "#000000",
								subtle: "#f6f9fc",
								border: "#e6ebf1",
							},
						},
					},
				}}
			>
				<Body className="m-0 bg-subtle p-0 font-sans">
					<Container className="mx-auto my-[40px] max-w-[600px] rounded-lg border border-border border-solid bg-white p-[32px] shadow-sm">
						<Heading className="mx-0 my-[20px] p-0 text-center font-bold font-serif text-[32px] text-brand">
							Yeni Sipariş!
						</Heading>

						<Text className="text-[#333] text-[16px] leading-[26px]">
							Harika haber! <strong>{customerName}</strong> ({customerEmail})
							{customerPhone && ` [Tel: ${customerPhone}]`} tarafında yeni bir
							sipariş verildi.
						</Text>

						<Section className="mt-[32px] rounded-md border border-border border-solid bg-subtle p-[24px]">
							<Text className="m-0 font-semibold text-[#666] text-[14px] uppercase tracking-wider">
								Sipariş Bilgileri
							</Text>
							<Hr className="my-[12px] border-border border-t border-solid" />

							<Row className="mb-[8px]">
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">
										Sipariş No:
									</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-medium text-[14px] text-brand">
										#{orderNumber}
									</Text>
								</Column>
							</Row>
							<Row className="mb-[8px]">
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">Tarih:</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-medium text-[14px] text-brand">
										{orderDate}
									</Text>
								</Column>
							</Row>
							<Row>
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">
										Toplam Tutar:
									</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-medium text-[14px] text-brand">
										{totalAmount}
									</Text>
								</Column>
							</Row>
						</Section>

						<Section className="mt-[32px]">
							<Text className="m-0 mb-[16px] font-semibold text-[18px] text-brand">
								Ürünler
							</Text>

							{items.map((item, index) => (
								<Row
									key={`${item.name}-${index}`}
									className="mb-[16px] border-border border-b border-solid pb-[16px]"
								>
									<Column>
										<Text className="m-0 font-medium text-[16px] text-brand">
											{item.name}
										</Text>
										<Text className="m-0 mt-[4px] text-[#666] text-[14px]">
											Adet: {item.quantity}
											{item.size ? ` | Beden: ${item.size}` : ""}
											{item.color ? ` | Renk: ${item.color}` : ""}
										</Text>
									</Column>
									<Column className="text-right align-top">
										<Text className="m-0 font-medium text-[16px] text-brand">
											{formatter.format(item.price * item.quantity)}
										</Text>
									</Column>
								</Row>
							))}
						</Section>

						<Section className="mt-[32px]">
							<Text className="m-0 mb-[12px] font-semibold text-[18px] text-brand">
								Teslimat Adresi
							</Text>
							<Text className="m-0 text-[#666] text-[15px] leading-[24px]">
								{shippingAddress}
							</Text>
						</Section>

						<Section className="mt-[32px] text-center">
							<Button
								className="rounded-md bg-black px-8 py-4 font-bold text-sm text-white"
								href={adminUrl}
							>
								Siparişi Görüntüle (Admin)
							</Button>
						</Section>

						<Hr className="my-[32px] border-border border-t border-solid" />

						<Text className="text-center text-[#666] text-[13px] leading-[24px]">
							Bu bildirim Raunk Butik sistemi tarafından otomatik olarak
							oluşturulmuştur.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default AdminOrderNotificationEmail;
