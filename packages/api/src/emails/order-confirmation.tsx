import {
	Body,
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

interface OrderConfirmationEmailProps {
	customerName: string;
	orderNumber: string;
	orderDate: string;
	totalAmount: string;
	shippingAddress: string;
	items: OrderItem[];
}

const formatter = new Intl.NumberFormat("tr-TR", {
	style: "currency",
	currency: "TRY",
});

export const OrderConfirmationEmail = ({
	customerName,
	orderNumber,
	orderDate,
	totalAmount,
	shippingAddress,
	items,
}: OrderConfirmationEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>Siparişiniz Başarıyla Alındı - Raunk Butik</Preview>
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
							RAUNK.
						</Heading>

						<Text className="text-[#333] text-[16px] leading-[26px]">
							Merhaba {customerName},
						</Text>

						<Text className="text-[#333] text-[16px] leading-[26px]">
							Siparişiniz başarıyla alındı ve onaylandı. Bizi tercih ettiğiniz
							için teşekkür ederiz. Siparişiniz kargoya verildiğinde size
							e-posta ile tekrar bilgilendirme yapacağız.
						</Text>

						<Section className="mt-[32px] rounded-md border border-border border-solid bg-subtle p-[24px]">
							<Text className="m-0 font-semibold text-[#666] text-[14px] uppercase tracking-wider">
								Sipariş Özeti
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
								Sipariş Edilen Ürünler
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

						<Hr className="my-[32px] border-border border-t border-solid" />

						<Text className="text-center text-[#666] text-[13px] leading-[24px]">
							Bu e-posta otomatik olarak gönderilmiştir. Sorularınız için
							<a
								href="mailto:destek@raunkbutik.com"
								className="ml-1 text-[#000] underline"
							>
								destek@raunkbutik.com
							</a>{" "}
							adresinden bize ulaşabilirsiniz.
							<br />© {new Date().getFullYear()} Raunk Butik. Tüm hakları
							saklıdır.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default OrderConfirmationEmail;
