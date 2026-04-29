import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	pixelBasedPreset,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface VerificationEmailProps {
	name: string;
	url?: string;
	otp?: string;
}

export const VerificationEmail = ({
	name,
	url,
	otp,
}: VerificationEmailProps) => {
	return (
		<Html>
			<Head />
			<Preview>Raunk Butik - Doğrulama Kodunuz</Preview>
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
					theme: {
						extend: {
							colors: {
								brand: "#000000",
							},
						},
					},
				}}
			>
				<Body className="bg-[#f6f9fc] font-sans">
					<Container className="mx-auto mb-[64px] rounded-md border border-[#e6ebf1] border-solid bg-white p-[20px] pt-[40px] pb-[48px] shadow-sm">
						<Heading className="mx-0 my-[30px] p-0 text-center font-bold text-[#484848] text-[24px] leading-[24px]">
							Raunk Butik
						</Heading>
						<Text className="text-[16px] text-black leading-[26px]">
							Merhaba {name},
						</Text>
						<Text className="text-[16px] text-black leading-[26px]">
							{otp
								? "Giriş yapmak veya e-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:"
								: "Alışverişe başlamak ve hesabınızı aktifleştirmek için e-posta adresinizi doğrulamanız gerekmektedir. Aşağıdaki butona tıklayarak doğrulama işlemini tamamlayabilirsiniz:"}
						</Text>

						{otp && (
							<Section className="mt-[32px] mb-[32px] text-center">
								<div className="inline-block rounded-md border border-[#e6ebf1] border-solid bg-[#f4f4f4] px-[24px] py-[12px] font-bold text-[36px] text-brand tracking-[10px]">
									{otp}
								</div>
							</Section>
						)}

						{url && (
							<Section className="mt-[32px] mb-[32px] text-center">
								<Button
									className="box-border rounded bg-brand px-8 py-4 text-center font-semibold text-[16px] text-white no-underline"
									href={url}
								>
									E-posta Adresini Doğrula
								</Button>
							</Section>
						)}

						{url && (
							<Text className="text-[16px] text-black leading-[26px]">
								Veya bu bağlantıyı tarayıcınıza kopyalayıp yapıştırabilirsiniz:
								<br />
								<a href={url} className="text-[#007ee6] no-underline">
									{url}
								</a>
							</Text>
						)}
						<Hr className="my-[26px] border-[#e6ebf1]" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							Eğer bu hesabı siz oluşturmadıysanız, lütfen bu e-postayı dikkate
							almayın.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

VerificationEmail.PreviewProps = {
	name: "Müşteri",
	url: "https://raunkbutik.com/api/auth/verify?token=123",
} as VerificationEmailProps;

export default VerificationEmail;
