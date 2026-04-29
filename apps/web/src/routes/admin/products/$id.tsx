import type { InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "@raunk-butik/api";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useBlocker,
	useNavigate,
} from "@tanstack/react-router";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUploadWithCrop } from "@/components/image-upload-crop";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

const productSchema = z.object({
	name: z.string().min(1, "İsim gereklidir"),
	slug: z.string().min(1, "Slug gereklidir"),
	description: z.string().min(1, "Açıklama gereklidir"),
	price: z.number().positive("Fiyat 0'dan büyük olmalıdır"),
	stock: z.number().int().nonnegative("Stok negatif olamaz"),
	images: z.array(z.string()).min(1, "En az bir görsel gereklidir"),
	brand: z.string().nullable(),
	categoryId: z.string().nullable(),
	sizes: z.array(z.string()).nullable(),
	colors: z.array(z.string()).nullable(),
	isActive: z.boolean(),
	variants: z.array(
		z.object({
			id: z.string().optional(),
			size: z.string().nullable(),
			color: z.string().nullable(),
			stock: z.number().int().nonnegative(),
		}),
	),
});

type AdminProduct = InferRouterOutputs<AppRouter>["admin"]["getProduct"];
type AdminCategories = InferRouterOutputs<AppRouter>["admin"]["getCategories"];

export const Route = createFileRoute("/admin/products/$id")({
	component: ProductEditorPage,
});

function ProductEditorPage() {
	const { id } = Route.useParams();
	const isNew = id === "new";

	const { data: product, isLoading: isLoadingProduct } = useQuery(
		orpc.admin.getProduct.queryOptions({
			input: { id },
			enabled: !isNew,
		}),
	);

	const { data: categories } = useQuery(
		orpc.admin.getCategories.queryOptions({ input: {} }),
	);

	if (isLoadingProduct && !isNew) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<ProductEditorForm
			product={product}
			id={id}
			isNew={isNew}
			categories={categories}
		/>
	);
}

function ProductEditorForm({
	product,
	id,
	isNew,
	categories,
}: {
	product: AdminProduct | undefined;
	id: string;
	isNew: boolean;
	categories: AdminCategories | undefined;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const saveMutation = useMutation(
		orpc.admin.saveProduct.mutationOptions({
			onSuccess: (data) => {
				toast.success(isNew ? "Ürün oluşturuldu" : "Ürün güncellendi");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getProducts.queryKey({ input: {} }),
				});
				if (!isNew) {
					queryClient.invalidateQueries({
						queryKey: orpc.admin.getProduct.queryKey({ input: { id } }),
					});
				}
				form.reset(form.state.values);
				if (isNew && data?.id) {
					navigate({ to: "/admin/products/$id", params: { id: data.id } });
				}
			},
			onError: (error) =>
				toast.error(error.message || "Kaydetme sırasında bir hata oluştu"),
		}),
	);

	const form = useForm({
		defaultValues: {
			name: product?.name ?? "",
			slug: product?.slug ?? "",
			description: product?.description ?? "",
			price: product?.price ?? 0,
			stock: product?.stock ?? 0,
			images: (product?.images as string[]) ?? [],
			brand: (product?.brand as string | null) ?? null,
			categoryId: (product?.categoryId as string | null) ?? null,
			sizes: (product?.sizes as string[] | null) ?? null,
			colors: (product?.colors as string[] | null) ?? null,
			isActive: product?.isActive ?? true,
			variants:
				(product?.variants?.map((v) => ({
					id: v.id,
					size: v.size ?? null,
					color: v.color ?? null,
					stock: v.stock ?? 0,
				})) as {
					id?: string;
					size: string | null;
					color: string | null;
					stock: number;
				}[]) ?? [],
		},
		validators: {
			onChange: productSchema,
		},
		onSubmit: async ({ value }) => {
			saveMutation.mutate({
				id: isNew ? undefined : id,
				...value,
				brand: value.brand || null,
				categoryId: value.categoryId || null,
			});
		},
	});

	const formIsDirty = useStore(form.store, (s) => s.isDirty);

	const {
		proceed,
		reset,
		status: blockerStatus,
	} = useBlocker({
		shouldBlockFn: () => {
			if (!formIsDirty || saveMutation.isSuccess) return false;
			return true;
		},
		enableBeforeUnload: formIsDirty && !saveMutation.isSuccess,
		withResolver: true,
	});

	const syncVariants = (
		updatedSizes?: string[] | null,
		updatedColors?: string[] | null,
	) => {
		const sizes =
			updatedSizes !== undefined
				? updatedSizes || []
				: form.getFieldValue("sizes") || [];
		const colors =
			updatedColors !== undefined
				? updatedColors || []
				: form.getFieldValue("colors") || [];
		const currentVariants = form.getFieldValue("variants") || [];

		const combinations: { size: string | null; color: string | null }[] = [];
		if (sizes.length === 0 && colors.length === 0) {
			combinations.push({ size: null, color: null });
		} else if (sizes.length > 0 && colors.length === 0) {
			for (const s of sizes) combinations.push({ size: s, color: null });
		} else if (sizes.length === 0 && colors.length > 0) {
			for (const c of colors) combinations.push({ size: null, color: c });
		} else {
			for (const s of sizes) {
				for (const c of colors) {
					combinations.push({ size: s, color: c });
				}
			}
		}

		const newVariants = combinations.map((combo) => {
			const existing = currentVariants.find(
				(v) => v.size === combo.size && v.color === combo.color,
			);
			return (
				existing || {
					size: combo.size,
					color: combo.color,
					stock: 0,
				}
			);
		});

		form.setFieldValue("variants", newVariants);
		const total = newVariants.reduce((acc, curr) => acc + curr.stock, 0);
		form.setFieldValue("stock", total);
	};

	const slugify = (text: string) => {
		return text
			.toString()
			.toLowerCase()
			.trim()
			.replace(/\s+/g, "-")
			.replace(/[^\w-]+/g, "")
			.replace(/--+/g, "-");
	};

	return (
		<div className="space-y-6 p-6 lg:p-8">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 rounded-full"
						onClick={() => navigate({ to: "/admin/products" })}
					>
						<ChevronLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							{isNew ? "Yeni Ürün" : "Ürünü Düzenle"}
						</h1>
						<p className="text-muted-foreground">
							{isNew
								? "Envanterinize yeni bir ürün ekleyin."
								: "Ürün detaylarını ve stok durumunu güncelleyin."}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => navigate({ to: "/admin/products" })}
						className="h-10 px-5"
					>
						Vazgeç
					</Button>
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
						{isNew ? "Kaydet" : "Güncelle"}
					</Button>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="grid gap-6 lg:grid-cols-3"
			>
				<div className="space-y-6 lg:col-span-2">
					<Card className="border-none shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg">Genel Bilgiler</CardTitle>
							<CardDescription>
								Ürünün adı, açıklaması ve kategorisi.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<form.Field name="name">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Ürün Adı
										</FieldLabel>
										<Input
											placeholder="Örn: Siyah Dantelli Elbise"
											value={field.state.value}
											onChange={(e) => {
												field.handleChange(e.target.value);
												if (isNew) {
													form.setFieldValue("slug", slugify(e.target.value));
												}
											}}
										/>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<form.Field name="description">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Açıklama
										</FieldLabel>
										<Textarea
											rows={6}
											placeholder="Ürün detaylarını buraya yazın..."
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							<div className="grid gap-4 md:grid-cols-2">
								<form.Field name="categoryId">
									{(field) => (
										<div className="grid gap-2">
											<FieldLabel className="font-medium text-sm">
												Kategori
											</FieldLabel>
											<Select
												value={field.state.value || ""}
												onValueChange={(val) => field.handleChange(val || null)}
											>
												<SelectTrigger className="h-10">
													<SelectValue placeholder="Seçiniz" />
												</SelectTrigger>
												<SelectContent>
													{categories?.map((cat) => (
														<SelectItem key={cat.id} value={cat.id}>
															{cat.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
								</form.Field>
								<form.Field name="brand">
									{(field) => (
										<div className="grid gap-2">
											<FieldLabel className="font-medium text-sm">
												Marka
											</FieldLabel>
											<Input
												placeholder="Örn: Raunk"
												value={field.state.value || ""}
												onChange={(e) =>
													field.handleChange(e.target.value || null)
												}
											/>
										</div>
									)}
								</form.Field>
							</div>
						</CardContent>
					</Card>

					<Card className="border-none shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg">Varyasyonlar</CardTitle>
							<CardDescription>Beden ve renk seçenekleri.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<form.Field name="sizes">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Bedenler
										</FieldLabel>
										<TagInput
											value={field.state.value}
											onChange={(val) => {
												field.handleChange(val);
												syncVariants(val, undefined);
											}}
											placeholder="S, M, L..."
										/>
									</div>
								)}
							</form.Field>
							<form.Field name="colors">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Renkler
										</FieldLabel>
										<TagInput
											value={field.state.value}
											onChange={(val) => {
												field.handleChange(val);
												syncVariants(undefined, val);
											}}
											placeholder="Siyah, Beyaz..."
										/>
									</div>
								)}
							</form.Field>
						</CardContent>
					</Card>

					<Card className="border-none shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg">
								Stok Yönetimi (Beden/Renk)
							</CardTitle>
							<CardDescription>
								Her beden ve renk kombinasyonu için stok miktarını belirleyin.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form.Field name="variants">
								{(field) => {
									const sizes = form.getFieldValue("sizes") || [];
									const colors = form.getFieldValue("colors") || [];
									const variants = field.state.value || [];

									const combinations: {
										size: string | null;
										color: string | null;
									}[] = [];
									if (sizes.length === 0 && colors.length === 0) {
										combinations.push({ size: null, color: null });
									} else if (sizes.length > 0 && colors.length === 0) {
										for (const s of sizes)
											combinations.push({ size: s, color: null });
									} else if (sizes.length === 0 && colors.length > 0) {
										for (const c of colors)
											combinations.push({ size: null, color: c });
									} else {
										for (const s of sizes) {
											for (const c of colors) {
												combinations.push({ size: s, color: c });
											}
										}
									}

									return (
										<div className="space-y-4">
											<div className="overflow-hidden rounded-md border text-left">
												<table className="w-full text-sm">
													<thead className="bg-muted text-muted-foreground text-xs uppercase">
														<tr>
															<th className="px-4 py-3 font-medium">Beden</th>
															<th className="px-4 py-3 font-medium">Renk</th>
															<th className="px-4 py-3 font-medium">Stok</th>
														</tr>
													</thead>
													<tbody className="divide-y">
														{combinations.map((combo) => {
															const existing = variants.find(
																(v) =>
																	v.size === combo.size &&
																	v.color === combo.color,
															);
															const stockValue = existing ? existing.stock : 0;

															return (
																<tr key={`${combo.size}-${combo.color}`}>
																	<td className="px-4 py-3 font-medium">
																		{combo.size || "-"}
																	</td>
																	<td className="px-4 py-3">
																		{combo.color || "-"}
																	</td>
																	<td className="px-4 py-3">
																		<Input
																			type="number"
																			className="h-8 w-24"
																			value={stockValue}
																			onChange={(e) => {
																				const val = Number.parseInt(
																					e.target.value,
																					10,
																				);
																				const newStock = Number.isNaN(val)
																					? 0
																					: val;

																				let newVariants = [...variants];
																				if (existing) {
																					newVariants = newVariants.map((v) =>
																						v.size === combo.size &&
																						v.color === combo.color
																							? { ...v, stock: newStock }
																							: v,
																					);
																				} else {
																					newVariants.push({
																						size: combo.size,
																						color: combo.color,
																						stock: newStock,
																					});
																				}
																				field.handleChange(newVariants);
																				const total = newVariants.reduce(
																					(acc, curr) => acc + curr.stock,
																					0,
																				);
																				form.setFieldValue("stock", total);
																			}}
																		/>
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>
											{combinations.length === 0 && (
												<p className="py-4 text-center text-muted-foreground text-sm">
													Lütfen yukarıdan beden veya renk seçiniz.
												</p>
											)}
										</div>
									);
								}}
							</form.Field>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="border-none shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg">Durum ve Görünürlük</CardTitle>
						</CardHeader>
						<CardContent>
							<form.Field name="isActive">
								{(field) => (
									<div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
										<div className="space-y-0.5">
											<Label htmlFor="isActive" className="text-base">
												Ürün Aktif
											</Label>
											<p className="text-muted-foreground text-sm">
												Ürün mağazada müşterilere gösterilsin mi?
											</p>
										</div>
										<Switch
											id="isActive"
											checked={field.state.value}
											onCheckedChange={field.handleChange}
										/>
									</div>
								)}
							</form.Field>
						</CardContent>
					</Card>

					<Card className="border-none shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg">Fiyat ve Stok</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<form.Field name="price">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Fiyat (TL)
										</FieldLabel>
										<Input
											type="number"
											step="0.01"
											className="h-10 font-bold"
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(Number.parseFloat(e.target.value))
											}
										/>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
							<form.Field name="stock">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Toplam Stok Adedi
										</FieldLabel>
										<Input
											type="number"
											readOnly
											className="h-10 cursor-not-allowed bg-muted opacity-80"
											value={field.state.value}
										/>
										<p className="text-[10px] text-muted-foreground">
											Toplam stok, varyasyon stoklarının toplamıdır.
										</p>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</CardContent>
					</Card>

					<Card className="border-none shadow-sm">
						<CardHeader>
							<CardTitle className="text-lg">Ürün Görselleri</CardTitle>
							<CardDescription>
								En az 1 fotoğraf gereklidir (3:4 önerilir).
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form.Field name="images">
								{(field) => (
									<div className="space-y-2">
										<ImageUploadWithCrop
											aspect={3 / 4}
											value={field.state.value}
											onChange={(urls) => field.handleChange(urls)}
										/>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>
						</CardContent>
					</Card>
				</div>
			</form>

			<AlertDialog
				open={blockerStatus === "blocked"}
				onOpenChange={(open) => {
					if (!open) reset?.();
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Kaydedilmemiş Değişiklikler</AlertDialogTitle>
						<AlertDialogDescription>
							Yaptığınız değişiklikler kaydedilmedi. Ayrılmak istediğinizden
							emin misiniz?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => reset?.()}>
							Vazgeç
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => proceed?.()}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Ayrıl
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
