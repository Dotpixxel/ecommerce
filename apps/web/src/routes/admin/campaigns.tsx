import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Megaphone, Pen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUploadWithCrop } from "@/components/image-upload-crop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

interface Campaign {
	id: string;
	title: string;
	description: string | null;
	imageUrl: string | null;
	linkUrl: string | null;
	priority: number;
	isActive: boolean;
	startDate: Date | null;
	endDate: Date | null;
	showTitle: boolean;
	showDescription: boolean;
	showButton: boolean;
	showBanner: boolean;
}

export const Route = createFileRoute("/admin/campaigns")({
	component: CampaignsPage,
});

function CampaignsPage() {
	const [isOpen, setIsOpen] = useState(false);
	const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

	const queryClient = useQueryClient();

	const { data: campaigns, isLoading } = useQuery(
		orpc.admin.getCampaigns.queryOptions(),
	);

	const saveMutation = useMutation(
		orpc.admin.saveCampaign.mutationOptions({
			onSuccess: () => {
				toast.success(
					editingCampaign ? "Kampanya güncellendi" : "Kampanya oluşturuldu",
				);
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getCampaigns.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getDashboardStats.queryKey({}),
				});
				setIsOpen(false);
				form.reset();
			},
			onError: (error) => toast.error(error.message || "İşlem başarısız"),
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.deleteCampaign.mutationOptions({
			onSuccess: () => {
				toast.success("Kampanya silindi");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getCampaigns.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getDashboardStats.queryKey({}),
				});
			},
			onError: (error) =>
				toast.error(error.message || "Silme işlemi başarısız"),
		}),
	);

	const form = useForm({
		defaultValues: {
			title: "",
			description: "" as string | null,
			imageUrl: null as string | null,
			linkUrl: "" as string | null,
			startDate: null as Date | null,
			endDate: null as Date | null,
			priority: 0,
			isActive: true,
			showTitle: true,
			showDescription: true,
			showButton: true,
			showBanner: true,
		},
		onSubmit: async ({ value }) => {
			saveMutation.mutate({
				id: editingCampaign?.id,
				...value,
			});
		},
	});

	const handleEdit = (campaign: Campaign) => {
		setEditingCampaign(campaign);
		form.setFieldValue("title", campaign.title);
		form.setFieldValue("description", campaign.description);
		form.setFieldValue("imageUrl", campaign.imageUrl);
		form.setFieldValue("linkUrl", campaign.linkUrl);
		form.setFieldValue("priority", campaign.priority);
		form.setFieldValue("showTitle", campaign.showTitle);
		form.setFieldValue("showDescription", campaign.showDescription);
		form.setFieldValue("showButton", campaign.showButton);
		form.setFieldValue("showBanner", campaign.showBanner);
		setIsOpen(true);
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 lg:p-8">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Kampanyalar</h1>
					<p className="mt-1 text-muted-foreground">
						Sitenizdeki duyuru ve kampanya bannerlarını yönetin.
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingCampaign(null);
						form.reset();
						setIsOpen(true);
					}}
					className="h-10 gap-2 px-5"
				>
					<Plus className="h-4 w-4" /> Yeni Kampanya
				</Button>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="font-semibold text-lg">
						Aktif Kampanyalar
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50 hover:bg-muted/50">
								<TableHead className="pl-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Görsel
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Başlık
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Bağlantı
								</TableHead>
								<TableHead className="pr-6 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
									İşlemler
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{(campaigns as Campaign[])?.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-32 text-center text-muted-foreground text-sm"
									>
										Henüz kampanya oluşturulmamış.
									</TableCell>
								</TableRow>
							) : (
								(campaigns as Campaign[])?.map((campaign) => (
									<TableRow
										key={campaign.id}
										className="transition-colors hover:bg-muted/30"
									>
										<TableCell className="pl-6">
											{campaign.imageUrl ? (
												<div className="h-10 w-20 overflow-hidden rounded-md border bg-muted">
													<img
														src={campaign.imageUrl}
														alt={campaign.title}
														className="h-full w-full object-cover"
													/>
												</div>
											) : (
												<div className="flex h-10 w-20 items-center justify-center rounded-md border bg-muted/50">
													<Megaphone className="h-4 w-4 text-muted-foreground/30" />
												</div>
											)}
										</TableCell>
										<TableCell>
											<span className="font-semibold text-sm">
												{campaign.title}
											</span>
										</TableCell>
										<TableCell>
											<span className="text-muted-foreground text-xs italic">
												{campaign.linkUrl || "Bağlantı yok"}
											</span>
										</TableCell>
										<TableCell className="pr-6 text-right">
											<div className="flex justify-end gap-1">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 text-muted-foreground"
													onClick={() => handleEdit(campaign)}
												>
													<Pen className="h-3.5 w-3.5" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 text-muted-foreground hover:text-destructive"
													onClick={() => {
														if (
															confirm(
																"Bu kampanyayı silmek istediğinize emin misiniz?",
															)
														) {
															deleteMutation.mutate({ id: campaign.id });
														}
													}}
													disabled={deleteMutation.isPending}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					setIsOpen(open);
					if (!open) {
						setEditingCampaign(null);
						form.reset();
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<DialogHeader>
							<DialogTitle>
								{editingCampaign ? "Kampanyayı Düzenle" : "Yeni Kampanya"}
							</DialogTitle>
							<DialogDescription>
								Kampanya banner detaylarını girin.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<form.Field name="title">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Kampanya Başlığı
										</FieldLabel>
										<Input
											className="h-10"
											placeholder="Örn: 1000 TL Üzeri Kargo Bedava"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>
							<form.Field name="linkUrl">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Bağlantı Linki
										</FieldLabel>
										<Input
											className="h-10"
											placeholder="Örn: /products?categoryId=123"
											value={field.state.value || ""}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>
							<form.Field name="imageUrl">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Banner Görseli (16:9)
										</FieldLabel>
										<ImageUploadWithCrop
											aspect={16 / 9}
											maxFiles={1}
											value={field.state.value ? [field.state.value] : []}
											onChange={(urls) => field.handleChange(urls[0] || null)}
											label="Görsel Seç veya Sürükle"
										/>
									</div>
								)}
							</form.Field>
							<div className="grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2">
								<form.Field name="showTitle">
									{(field) => (
										<div className="flex items-center gap-2">
											<Checkbox
												id="showTitle"
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(!!checked)
												}
											/>
											<label
												htmlFor="showTitle"
												className="cursor-pointer text-sm"
											>
												Başlığı Göster
											</label>
										</div>
									)}
								</form.Field>
								<form.Field name="showDescription">
									{(field) => (
										<div className="flex items-center gap-2">
											<Checkbox
												id="showDescription"
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(!!checked)
												}
											/>
											<label
												htmlFor="showDescription"
												className="cursor-pointer text-sm"
											>
												Açıklamayı Göster
											</label>
										</div>
									)}
								</form.Field>
								<form.Field name="showButton">
									{(field) => (
										<div className="flex items-center gap-2 md:col-span-2">
											<Checkbox
												id="showButton"
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(!!checked)
												}
											/>
											<label
												htmlFor="showButton"
												className="cursor-pointer text-sm"
											>
												Butonu Göster
											</label>
										</div>
									)}
								</form.Field>
								<form.Field name="showBanner">
									{(field) => (
										<div className="flex items-center gap-2 md:col-span-2">
											<Checkbox
												id="showBanner"
												checked={field.state.value}
												onCheckedChange={(checked) =>
													field.handleChange(!!checked)
												}
											/>
											<label
												htmlFor="showBanner"
												className="cursor-pointer text-sm"
											>
												Üst Banner'ı Göster (Kırmızı Banner)
											</label>
										</div>
									)}
								</form.Field>
							</div>
						</div>
						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
							>
								Vazgeç
							</Button>
							<Button type="submit" disabled={saveMutation.isPending}>
								{saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
