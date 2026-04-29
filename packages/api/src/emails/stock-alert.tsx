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

interface StockAlertEmailProps {
	orderNumber: string;
	customerEmail: string;
	customerName: string;
	failedProduct: string;
	requestedQuantity: number;
	availableStock: number;
	refundStatus?: string;
}

export const StockAlertEmail = ({
	orderNumber,
	customerEmail,
	customerName,
	failedProduct,
	requestedQuantity,
	availableStock,
	refundStatus,
}: StockAlertEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>URGENT: Stok Yetersiz - İade Gerekli</Preview>
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
					theme: {
						extend: {
							colors: {
								brand: "#dc2626",
								subtle: "#fef2f2",
								border: "#fecaca",
							},
						},
					},
				}}
			>
				<Body className="m-0 bg-subtle p-0 font-sans">
					<Container className="mx-auto my-[40px] max-w-[600px] rounded-lg border border-border border-solid bg-white p-[32px] shadow-sm">
						<Heading className="mx-0 my-[20px] p-0 text-center font-bold font-serif text-[32px] text-brand">
							⚠️ STOK UYARISI
						</Heading>

						<Text className="text-[#333] text-[16px] leading-[26px]">
							Merhaba Admin,
						</Text>

						<Text className="text-[#333] text-[16px] leading-[26px]">
							Sipariş ödemesi alındı ancak <strong>stok yetersizliği</strong>{" "}
							nedeniyle işlem tamamlanamadı. Müşteriye iade yapılması
							gerekmektedir.
						</Text>

						<Section className="mt-[32px] rounded-md border border-border border-solid bg-subtle p-[24px]">
							<Text className="m-0 font-semibold text-[14px] text-brand uppercase tracking-wider">
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
									<Text className="m-0 text-[#666] text-[14px]">
										Müşteri Email:
									</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-medium text-[14px]">
										{customerEmail}
									</Text>
								</Column>
							</Row>
							<Row>
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">
										Müşteri Adı:
									</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-medium text-[14px]">
										{customerName}
									</Text>
								</Column>
							</Row>
							{refundStatus && (
								<Row className="mt-[8px]">
									<Column>
										<Text className="m-0 text-[#666] text-[14px]">
											İade Durumu:
										</Text>
									</Column>
									<Column className="text-right">
										<Text className="m-0 font-bold text-[14px] text-brand">
											{refundStatus}
										</Text>
									</Column>
								</Row>
							)}
						</Section>

						<Section className="mt-[32px] rounded-md border border-brand border-solid bg-subtle p-[24px]">
							<Text className="m-0 font-semibold text-[14px] text-brand uppercase tracking-wider">
								Stok Yetersiz Ürün
							</Text>
							<Hr className="my-[12px] border-brand border-t border-solid" />

							<Row className="mb-[8px]">
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">Ürün:</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-bold text-[14px] text-brand">
										{failedProduct}
									</Text>
								</Column>
							</Row>
							<Row className="mb-[8px]">
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">
										Talep Edilen:
									</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-medium text-[14px]">
										{requestedQuantity} adet
									</Text>
								</Column>
							</Row>
							<Row>
								<Column>
									<Text className="m-0 text-[#666] text-[14px]">
										Mevcut Stok:
									</Text>
								</Column>
								<Column className="text-right">
									<Text className="m-0 font-bold text-[14px] text-brand">
										{availableStock} adet
									</Text>
								</Column>
							</Row>
						</Section>

						<Section className="mt-[32px] rounded-md border border-yellow-500 border-solid bg-yellow-50 p-[24px]">
							<Text className="m-0 font-semibold text-[16px] text-yellow-800">
								📋 Yapılması Gereken:
							</Text>
							<Text className="mt-[12px] text-[14px] text-yellow-700">
								1. Müşteriye tam iade yapın
								<br />
								2. Ürün stoğunu güncelleyin
								<br />
								3. Müşteriyi bilgilendirin
							</Text>
						</Section>

						<Hr className="my-[32px] border-border border-t border-solid" />

						<Text className="text-center text-[#666] text-[13px] leading-[24px]">
							Raunk Butik Yönetim Paneli
							<br />© {new Date().getFullYear()} Raunk Butik. Tüm hakları
							saklıdır.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default StockAlertEmail;
