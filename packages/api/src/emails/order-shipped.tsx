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

interface OrderShippedEmailProps {
	customerName: string;
	orderNumber: string;
	shippingCompany: string;
	trackingNumber: string;
	trackingUrl?: string;
}

export const OrderShippedEmail = ({
	customerName,
	orderNumber,
	shippingCompany,
	trackingNumber,
	trackingUrl,
}: OrderShippedEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>Siparişiniz Kargoya Verildi! - Raunk Butik</Preview>
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
							Harika haber! <strong>#{orderNumber}</strong> numaralı siparişiniz
							kargoya teslim edildi. Siparişinizin kargo hareketlerini aşağıdaki
							bilgilerle takip edebilirsiniz.
						</Text>

						<Section className="mt-[32px] rounded-md border border-border border-solid bg-subtle p-[24px]">
							<Text className="m-0 font-semibold text-[#666] text-[14px] uppercase tracking-wider">
								Kargo Bilgileri
							</Text>
							<Hr className="my-[12px] border-border border-t border-solid" />

							<Row className="mb-[8px]">
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">
										Kargo Firması:
									</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-medium text-[15px] text-brand">
										{shippingCompany}
									</Text>
								</Column>
							</Row>
							<Row>
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">
										Takip Numarası:
									</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-bold text-[15px] text-brand tracking-wider">
										{trackingNumber}
									</Text>
								</Column>
							</Row>
						</Section>

						{trackingUrl && (
							<Section className="mt-[32px] text-center">
								<Button
									href={trackingUrl}
									className="box-border rounded bg-brand px-[24px] py-[14px] text-center font-semibold text-[16px] text-white no-underline"
								>
									Kargomu Takip Et
								</Button>
							</Section>
						)}

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

export default OrderShippedEmail;
