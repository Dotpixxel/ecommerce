import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	pixelBasedPreset,
	Tailwind,
	Text,
} from "@react-email/components";

interface OrderCancelledEmailProps {
	customerName: string;
	orderNumber: string;
}

export const OrderCancelledEmail = ({
	customerName,
	orderNumber,
}: OrderCancelledEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>Siparişiniz İptal Edildi ve İade Yapıldı - Raunk Butik</Preview>
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
							<strong>#{orderNumber}</strong> numaralı siparişiniz isteğiniz
							üzerine veya operasyonel nedenlerle iptal edilmiştir.
						</Text>

						<Text className="text-[#333] text-[16px] leading-[26px]">
							Ödemeniz iade edilmiştir. İadenin banka hesabınıza yansıması,
							bankanızın süreçlerine bağlı olarak 3-10 iş günü sürebilir.
						</Text>

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

export default OrderCancelledEmail;
