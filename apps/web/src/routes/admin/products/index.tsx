import type { InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "@raunk-butik/api";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit2, Loader2, Package, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

type AdminProduct =
	InferRouterOutputs<AppRouter>["admin"]["getProducts"]["items"][number];

export const Route = createFileRoute("/admin/products/")({
	component: AdminProductsPage,
});

function AdminProductsPage() {
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const { ref, inView } = useInView();

	const {
		data: productsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		orpc.admin.getProducts.infiniteOptions({
			input: (pageParam) => ({
				cursor: pageParam as number,
			}),
			getNextPageParam: (lastPage: { nextCursor?: number }) => {
				if (lastPage.nextCursor == null) return undefined;
				return lastPage.nextCursor;
			},
			initialPageParam: 0,
		}),
	);

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const allProducts =
		productsData?.pages.flatMap(
			(page: { items: AdminProduct[] }) => page.items,
		) || [];

	const deleteMutation = useMutation(
		orpc.admin.deleteProduct.mutationOptions({
			onSuccess: () => {
				toast.success("Ürün başarıyla silindi");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getProducts.infiniteKey({
						input: (pageParam) => ({
							cursor: pageParam as number,
						}),
						initialPageParam: 0,
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getDashboardStats.queryKey({}),
				});
			},
			onError: () => toast.error("Silme işlemi sırasında bir hata oluştu"),
		}),
	);

	const filteredProducts = allProducts.filter(
		(p) =>
			p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p.brand?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleDelete = (id: string) => {
		setDeleteId(id);
	};

	const confirmDelete = () => {
		if (deleteId) {
			deleteMutation.mutate({ id: deleteId });
			setDeleteId(null);
		}
	};

	if (isLoading)
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);

	return (
		<div className="space-y-6 p-6 lg:p-8">
			{/* Header */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Ürün Yönetimi</h1>
					<p className="mt-1 text-muted-foreground">
						Mağazanızdaki ürünleri yönetin.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="relative w-72">
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Ürün veya marka ara..."
							className="h-10 pl-9"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<Link
						to="/admin/products/$id"
						params={{ id: "new" }}
						className={cn(
							buttonVariants({ variant: "default" }),
							"h-10 gap-2 px-5",
						)}
					>
						<Plus className="h-4 w-4" />
						Yeni Ürün
					</Link>
				</div>
			</div>

			{/* Product List */}
			<div className="space-y-3">
				{filteredProducts?.map((product) => (
					<Card
						key={product.id}
						className="border-none shadow-sm transition-colors hover:bg-muted/20"
					>
						<CardContent className="p-0">
							<div className="flex flex-col md:flex-row md:items-center">
								<div className="flex flex-1 items-center gap-5 p-5">
									<div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
										{product.images?.[0] ? (
											<img
												src={product.images[0]}
												alt={product.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<Package className="h-6 w-6 text-muted-foreground/50" />
										)}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-3">
											<span className="truncate font-semibold text-base">
												{product.name}
											</span>
											{product.stock <= 5 && (
												<Badge
													variant="destructive"
													className="shrink-0 text-[10px]"
												>
													Stok: {product.stock}
												</Badge>
											)}
											{product.isActive ? (
												<Badge
													variant="outline"
													className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-600"
												>
													Aktif
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="shrink-0 border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-600"
												>
													Pasif
												</Badge>
											)}
											{product.deletedAt && (
												<Badge
													variant="destructive"
													className="shrink-0 text-[10px]"
												>
													Silindi
												</Badge>
											)}
										</div>
										<div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
											<span className="font-medium text-primary">
												{product.brand || "Markasız"}
											</span>
											<span className="text-muted-foreground/30">•</span>
											<Badge
												variant="secondary"
												className="font-normal text-xs"
											>
												{product.category?.name || "Kategorisiz"}
											</Badge>
											<span className="text-muted-foreground/30">•</span>
											<span className="text-muted-foreground">
												Stok: {product.stock}
											</span>
										</div>
									</div>
									<div className="hidden text-right md:block">
										<p className="font-bold font-montserrat text-lg tabular-nums">
											{product.price.toLocaleString("tr-TR", {
												style: "currency",
												currency: "TRY",
											})}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 border-t p-4 md:border-t-0 md:border-l md:px-5">
									<Link
										to="/admin/products/$id"
										params={{ id: product.id }}
										className={cn(
											buttonVariants({ variant: "ghost", size: "sm" }),
											"h-9 gap-1.5 text-muted-foreground",
										)}
									>
										<Edit2 className="h-3.5 w-3.5" />
										Düzenle
									</Link>
									<Button
										variant="ghost"
										size="sm"
										className="h-9 w-9 text-muted-foreground hover:text-destructive"
										onClick={() => handleDelete(product.id)}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				))}

				{filteredProducts?.length === 0 && (
					<div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center">
						<Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
						<h3 className="font-medium">Ürün bulunamadı</h3>
						<p className="mt-1 text-muted-foreground text-sm">
							Arama kriterlerinize uygun ürün bulunmamaktadır.
						</p>
					</div>
				)}

				<div ref={ref} className="flex justify-center py-8">
					{isFetchingNextPage ? (
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					) : hasNextPage ? (
						<Button
							variant="outline"
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
						>
							Daha Fazla Yükle
						</Button>
					) : allProducts.length > 0 ? (
						<p className="text-muted-foreground text-sm">
							Tüm ürünler yüklendi
						</p>
					) : null}
				</div>
			</div>

			<AlertDialog
				open={!!deleteId}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Bu ürünü silmek istediğinize emin misiniz?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Ürün mağazadan tamamen kaldırılacaktır.
							<br />
							<br />
							<span className="font-semibold text-primary">Not:</span> Eğer bu
							ürün daha önce sipariş edildiyse, sipariş geçmişini korumak için
							veritabanından tamamen silinmez, sadece "Pasif" ve "Silindi"
							olarak işaretlenir. Eğer hiç sipariş edilmediyse tamamen
							temizlenecektir.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Vazgeç</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Evet, Sil (Pasif Yap)
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
