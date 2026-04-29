import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface AdminRequestEmailProps {
	customerName: string;
	customerEmail: string;
	orderNumber: string;
	requestType: "cancel" | "return";
	reason: string;
	orderId: string;
	customerPhone?: string;
}

export const AdminRequestEmail = ({
	customerName,
	customerEmail,
	orderNumber,
	requestType,
	reason,
	orderId,
	customerPhone,
}: AdminRequestEmailProps) => {
	const typeLabel = requestType === "cancel" ? "İptal" : "İade";
	const adminUrl = `https://raunkbutik.com/admin/orders/${orderId}`;

	return (
		<Html>
			<Head />
			<Preview>
				Yeni {typeLabel} Talebi - #{orderNumber}
			</Preview>
			<Tailwind>
				<Body className="bg-white font-sans text-slate-900">
					<Container className="mx-auto px-4 py-10">
						<Heading className="mb-6 text-center font-bold text-2xl">
							Yeni {typeLabel} Talebi Alındı
						</Heading>

						<Section className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
							<Text className="mb-2 font-semibold text-slate-500 text-sm uppercase tracking-wider">
								Talep Detayları
							</Text>
							<Text className="m-0 mb-1">
								<strong>Müşteri:</strong> {customerName} ({customerEmail})
								{customerPhone && ` [Tel: ${customerPhone}]`}
							</Text>
							<Text className="m-0 mb-1">
								<strong>Sipariş No:</strong> #{orderNumber}
							</Text>
							<Text className="m-0 mb-4">
								<strong>Talep Türü:</strong> {typeLabel} Talebi
							</Text>

							<Hr className="my-4 border-slate-200" />

							<Text className="mb-2 font-semibold text-slate-500 text-sm uppercase tracking-wider">
								Müşteri Notu / Sebep
							</Text>
							<Text className="rounded border border-slate-200 bg-white p-4 italic">
								"{reason}"
							</Text>
						</Section>

						<Section className="text-center">
							<Button
								className="rounded-md bg-black px-6 py-3 font-bold text-sm text-white"
								href={adminUrl}
							>
								Talebi Yönet (Admin Paneli)
							</Button>
						</Section>

						<Hr className="mt-10 mb-6 border-slate-200" />

						<Text className="text-center text-slate-400 text-xs">
							Bu e-posta Raunk Butik sistemi tarafından otomatik olarak
							oluşturulmuştur.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default AdminRequestEmail;
