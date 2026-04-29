import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/settings")({
	component: SettingsPage,
});

const DEFAULT_SETTINGS = [
	{
		key: "freeShippingThreshold",
		label: "Ücretsiz Kargo Barajı (TL)",
		type: "number",
		group: "general",
		description: "Bu tutarın üzerindeki siparişlerde kargo ücretsiz olur.",
	},
	{
		key: "shipping_fee_dhl",
		label: "DHL Kargo Ücreti (TL)",
		type: "number",
		group: "general",
		description: "Ücretsiz kargo barajı altındaki DHL gönderimleri için ücret.",
	},
	{
		key: "contactEmail",
		label: "İletişim E-posta Adresi",
		type: "email",
		group: "contact",
		description: "Müşterilerin size ulaşabileceği ana e-posta adresi.",
	},
	{
		key: "contactPhone",
		label: "Müşteri Hizmetleri Telefonu",
		type: "text",
		group: "contact",
		description: "Sitede gösterilecek iletişim numarası.",
	},
	{
		key: "instagramUrl",
		label: "Instagram Profil Bağlantısı",
		type: "url",
		group: "contact",
		description: "Instagram ikonuna tıklandığında gidilecek adres.",
	},
	{
		key: "whatsappNumber",
		label: "WhatsApp Numaranız",
		type: "text",
		group: "contact",
		description: "Uluslararası formatta, örn: +905551234567",
	},
	{
		key: "homepage_categories_title",
		label: "Kategoriler Bölümü Başlığı",
		type: "text",
		group: "homepage",
		description: "Ana sayfadaki kategoriler kısmının başlığı.",
	},
	{
		key: "homepage_products_title",
		label: "Ürünler Bölümü Başlığı",
		type: "text",
		group: "homepage",
		description: "Öne çıkan ürünler kısmının ana başlığı.",
	},
	{
		key: "homepage_products_subtitle",
		label: "Ürünler Bölümü Alt Başlığı",
		type: "text",
		group: "homepage",
		description: "Öne çıkan ürünler kısmının altındaki küçük yazı.",
	},
	{
		key: "homepage_testimonials_title",
		label: "Yorumlar Bölümü Başlığı",
		type: "text",
		group: "homepage",
		description: "Müşteri yorumları kısmının başlığı.",
	},
	{
		key: "mersisNo",
		label: "MERSİS Numarası",
		type: "text",
		group: "legal",
		description: "Mesafeli Satış Sözleşmesinde görünecek MERSİS numarası.",
	},
	{
		key: "taxOffice",
		label: "Vergi Dairesi",
		type: "text",
		group: "legal",
		description: "Sözleşmede görünecek vergi dairesi.",
	},
	{
		key: "taxNumber",
		label: "Vergi Numarası",
		type: "text",
		group: "legal",
		description: "Sözleşmede görünecek vergi numarası.",
	},
] as const;

function SettingsPage() {
	const queryClient = useQueryClient();
	const { data: currentSettings, isLoading } = useQuery(
		orpc.admin.getSettings.queryOptions(),
	);

	const saveMutation = useMutation(
		orpc.admin.saveSettings.mutationOptions({
			onSuccess: () => {
				toast.success("Ayarlar başarıyla kaydedildi.");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getSettings.queryKey(),
				});
				// Also invalidate public settings to immediately reflect changes on frontend
				queryClient.invalidateQueries({
					queryKey: orpc.settings.getPublicSettings.queryKey(),
				});
			},
			onError: (error) => {
				toast.error(error.message || "Ayarlar kaydedilirken bir hata oluştu.");
			},
		}),
	);

	const form = useForm({
		defaultValues: Object.fromEntries(
			DEFAULT_SETTINGS.map((setting) => [setting.key, ""]),
		) as Record<string, string>,
		onSubmit: async ({ value }) => {
			const settingsToSave = DEFAULT_SETTINGS.map((setting) => ({
				key: setting.key,
				value: value[setting.key].toString(),
				description: setting.description,
			}));
			saveMutation.mutate(settingsToSave);
		},
	});

	useEffect(() => {
		if (currentSettings) {
			currentSettings.forEach((setting) => {
				form.setFieldValue(setting.key, setting.value);
			});
		}
	}, [currentSettings, form]);

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 lg:p-8">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Site Ayarları</h1>
					<p className="mt-1 text-muted-foreground">
						Sitenin genel çalışma kurallarını ve iletişim bilgilerini yönetin.
					</p>
				</div>
				<Button
					onClick={() => form.handleSubmit()}
					disabled={saveMutation.isPending}
					className="h-10 gap-2 px-5"
				>
					{saveMutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Save className="h-4 w-4" />
					)}
					Kaydet
				</Button>
			</div>

			<div className="grid gap-8 lg:grid-cols-2">
				<div className="space-y-8">
					<Card>
						<CardHeader>
							<CardTitle>Genel Kurallar</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{DEFAULT_SETTINGS.filter((s) => s.group === "general").map(
								(setting) => (
									<form.Field key={setting.key} name={setting.key}>
										{(field) => (
											<Field>
												<FieldLabel className="font-bold">
													{setting.label}
												</FieldLabel>
												<Input
													type={setting.type}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													className="h-12 text-lg"
												/>
												<p className="mt-1 font-medium text-muted-foreground text-sm">
													{setting.description}
												</p>
											</Field>
										)}
									</form.Field>
								),
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>İletişim & Sosyal Medya</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{DEFAULT_SETTINGS.filter((s) => s.group === "contact").map(
								(setting) => (
									<form.Field key={setting.key} name={setting.key}>
										{(field) => (
											<Field>
												<FieldLabel className="font-bold">
													{setting.label}
												</FieldLabel>
												<Input
													type={setting.type}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													className="h-12"
												/>
												<p className="mt-1 font-medium text-muted-foreground text-sm">
													{setting.description}
												</p>
											</Field>
										)}
									</form.Field>
								),
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-8">
					<Card>
						<CardHeader>
							<CardTitle>Ana Sayfa İçerikleri</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{DEFAULT_SETTINGS.filter((s) => s.group === "homepage").map(
								(setting) => (
									<form.Field key={setting.key} name={setting.key}>
										{(field) => (
											<Field>
												<FieldLabel className="font-bold">
													{setting.label}
												</FieldLabel>
												{setting.key.includes("_desc") ? (
													<textarea
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													/>
												) : (
													<Input
														type={setting.type}
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														className="h-12"
													/>
												)}
												<p className="mt-1 font-medium text-muted-foreground text-sm">
													{setting.description}
												</p>
											</Field>
										)}
									</form.Field>
								),
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Yasal Bilgiler</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{DEFAULT_SETTINGS.filter((s) => s.group === "legal").map(
								(setting) => (
									<form.Field key={setting.key} name={setting.key}>
										{(field) => (
											<Field>
												<FieldLabel className="font-bold">
													{setting.label}
												</FieldLabel>
												<Input
													type={setting.type}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													className="h-12"
												/>
												<p className="mt-1 font-medium text-muted-foreground text-sm">
													{setting.description}
												</p>
											</Field>
										)}
									</form.Field>
								),
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
