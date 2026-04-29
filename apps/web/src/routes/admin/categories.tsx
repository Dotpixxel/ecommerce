import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon, Loader2, Pen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface Category {
	id: string;
	name: string;
	slug: string;
	parentId: string | null;
	imageUrl: string | null;
	order: number;
	isActive: boolean;
}

export const Route = createFileRoute("/admin/categories")({
	component: CategoriesPage,
});

function CategoriesPage() {
	const [isOpen, setIsOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);

	const queryClient = useQueryClient();

	const { data: categories, isLoading } = useQuery(
		orpc.admin.getCategories.queryOptions(),
	);

	const saveMutation = useMutation(
		orpc.admin.saveCategory.mutationOptions({
			onSuccess: () => {
				toast.success(
					editingCategory ? "Kategori güncellendi" : "Kategori oluşturuldu",
				);
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getCategories.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.product.getCategories.queryKey({}),
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
		orpc.admin.deleteCategory.mutationOptions({
			onSuccess: () => {
				toast.success("Kategori silindi");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getCategories.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.product.getCategories.queryKey({}),
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
			name: "",
			slug: "",
			parentId: null as string | null,
			imageUrl: null as string | null,
			order: 0,
			isActive: true,
		},
		onSubmit: async ({ value }) => {
			if (!value.slug) {
				toast.error("Kategori slug'ı boş olamaz");
				return;
			}
			saveMutation.mutate({
				id: editingCategory?.id,
				...value,
			});
		},
	});

	const handleEdit = (category: Category) => {
		setEditingCategory(category);
		form.setFieldValue("name", category.name);
		form.setFieldValue("slug", category.slug);
		form.setFieldValue("parentId", category.parentId);
		form.setFieldValue("imageUrl", category.imageUrl);
		form.setFieldValue("order", category.order);
		form.setFieldValue("isActive", category.isActive);
		setIsOpen(true);
	};

	const slugify = (text: string) => {
		const trMap: Record<string, string> = {
			ç: "c",
			Ç: "C",
			ğ: "g",
			Ğ: "G",
			ı: "i",
			İ: "I",
			ö: "o",
			Ö: "O",
			ş: "s",
			Ş: "S",
			ü: "u",
			Ü: "U",
		};

		let slug = text;
		for (const key in trMap) {
			slug = slug.replace(new RegExp(key, "g"), trMap[key]);
		}

		return slug
			.toString()
			.toLowerCase()
			.trim()
			.replace(/\s+/g, "-")
			.replace(/[^\w-]+/g, "")
			.replace(/--+/g, "-")
			.replace(/^-+/, "")
			.replace(/-+$/, "");
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
					<h1 className="font-bold text-3xl tracking-tight">Kategoriler</h1>
					<p className="mt-1 text-muted-foreground">
						Ürünlerinizi gruplamak için kullanılan kategorileri yönetin.
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingCategory(null);
						form.reset();
						setIsOpen(true);
					}}
					className="h-10 gap-2 px-5"
				>
					<Plus className="h-4 w-4" /> Yeni Kategori
				</Button>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="font-semibold text-lg">
						Hiyerarşik Liste
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
									Kategori Adı
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Tür
								</TableHead>
								<TableHead className="pr-6 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
									İşlemler
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{(categories as Category[])?.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-32 text-center text-muted-foreground text-sm"
									>
										Henüz kategori oluşturulmamış.
									</TableCell>
								</TableRow>
							) : (
								(categories as Category[])?.map((category) => (
									<TableRow
										key={category.id}
										className="transition-colors hover:bg-muted/30"
									>
										<TableCell className="pl-6">
											{category.imageUrl ? (
												<div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
													<img
														src={category.imageUrl}
														alt={category.name}
														className="h-full w-full object-cover"
													/>
												</div>
											) : (
												<div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/50">
													<ImageIcon className="h-4 w-4 text-muted-foreground/30" />
												</div>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												{category.parentId && (
													<span className="font-bold text-muted-foreground/40">
														↳
													</span>
												)}
												<span
													className={cn(
														"text-sm",
														category.parentId
															? "font-medium"
															: "font-bold text-base tracking-tight",
													)}
												>
													{category.name}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={cn(
													"rounded-md px-2 py-0.5 font-medium text-[11px]",
													category.parentId
														? "border-violet-500/25 bg-violet-500/15 text-violet-700"
														: "border-primary/25 bg-primary/15 text-primary",
												)}
											>
												{category.parentId ? "Alt Kategori" : "Ana Bölüm"}
											</Badge>
										</TableCell>
										<TableCell className="pr-6 text-right">
											<div className="flex justify-end gap-1">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 text-muted-foreground"
													onClick={() => handleEdit(category)}
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
																"Bu kategoriyi silmek istediğinize emin misiniz?",
															)
														) {
															deleteMutation.mutate({ id: category.id });
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
						setEditingCategory(null);
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
								{editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori"}
							</DialogTitle>
							<DialogDescription>Kategori bilgilerini girin.</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<form.Field name="name">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Kategori Adı
										</FieldLabel>
										<Input
											className="h-10"
											placeholder="Örn: Kadın Elbise"
											value={field.state.value}
											onChange={(e) => {
												field.handleChange(e.target.value);
												form.setFieldValue("slug", slugify(e.target.value));
											}}
										/>
									</div>
								)}
							</form.Field>
							<form.Field name="parentId">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Üst Kategori
										</FieldLabel>
										<Select
											value={field.state.value || "none"}
											onValueChange={(val) =>
												field.handleChange(val === "none" ? null : val)
											}
										>
											<SelectTrigger className="h-10">
												<SelectValue placeholder="Seçiniz" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">Yok (Ana Kategori)</SelectItem>
												{categories
													?.filter((c) => c.id !== editingCategory?.id)
													.map((c) => (
														<SelectItem key={c.id} value={c.id}>
															{c.name}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>
							<form.Field name="imageUrl">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Kategori Görseli
										</FieldLabel>
										<ImageUpload
											value={field.state.value ? [field.state.value] : []}
											onChange={(urls) => field.handleChange(urls[0] || null)}
											maxFiles={1}
										/>
									</div>
								)}
							</form.Field>
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
