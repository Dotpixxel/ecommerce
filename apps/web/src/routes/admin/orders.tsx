import type { InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "@raunk-butik/api";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
	Edit2,
	Loader2,
	MapPin,
	Package,
	Phone,
	Search,
	Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

type AdminOrder =
	InferRouterOutputs<AppRouter>["order"]["admin_getOrders"]["items"][number];

export const Route = createFileRoute("/admin/orders")({
	component: AdminOrdersPage,
});

const statusConfig: Record<string, { label: string; className: string }> = {
	pending: {
		label: "Bekliyor",
		className: "bg-amber-500/15 text-amber-700 border-amber-500/25",
	},
	paid: {
		label: "Ödendi",
		className: "bg-blue-500/15 text-blue-700 border-blue-500/25",
	},
	shipped: {
		label: "Kargoda",
		className: "bg-violet-500/15 text-violet-700 border-violet-500/25",
	},
	delivered: {
		label: "Teslim Edildi",
		className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
	},
	cancelled: {
		label: "İptal Edildi",
		className: "bg-red-500/15 text-red-700 border-red-500/25",
	},
	failed: {
		label: "Ödeme Hatası",
		className: "bg-orange-500/15 text-orange-700 border-orange-500/25",
	},
};

function AdminOrdersPage() {
	const queryClient = useQueryClient();
	const { ref, inView } = useInView();

	const {
		data: ordersData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		orpc.order.admin_getOrders.infiniteOptions({
			input: (pageParam) => ({ limit: 20, cursor: pageParam as number }),
			getNextPageParam: (lastPage: { nextCursor?: number }) =>
				lastPage.nextCursor,
			initialPageParam: 0,
		}),
	);

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const allOrders =
		ordersData?.pages.flatMap((p: { items: AdminOrder[] }) => p.items) || [];
	const updateMutation = useMutation(
		orpc.order.admin_updateOrder.mutationOptions({
			onSuccess: (data: { message?: string }) => {
				toast.success(data.message || "Sipariş başarıyla güncellendi");
				queryClient.invalidateQueries({
					queryKey: orpc.order.admin_getOrders.infiniteKey({
						input: () => ({ limit: 20 }),
						initialPageParam: 0,
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getDashboardStats.queryKey({}),
				});
				setEditingOrder(null);
			},
			onError: () => toast.error("Güncelleme sırasında bir hata oluştu"),
		}),
	);

	type OrderStatus =
		| "pending"
		| "paid"
		| "shipped"
		| "delivered"
		| "cancelled"
		| "failed";

	const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
	const [status, setStatus] = useState<OrderStatus>("pending");
	const [trackingNumber, setTrackingNumber] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState("");
	const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

	// Handle search params for deep linking from dashboard
	const search = Route.useSearch() as { q?: string };
	useEffect(() => {
		if (search.q) {
			setSearchTerm(search.q);
		}
	}, [search.q]);

	const handleEdit = (order: AdminOrder) => {
		setEditingOrder(order);
		setStatus(order.status);
		setTrackingNumber(order.trackingNumber || "");
	};

	const handleSave = () => {
		if (!editingOrder) return;

		// If status is changed to cancelled, show confirmation first
		if (status === "cancelled" && editingOrder.status !== "cancelled") {
			setShowCancelConfirmation(true);
			return;
		}

		executeSave();
	};

	const executeSave = () => {
		if (!editingOrder) return;
		updateMutation.mutate({
			id: editingOrder.id,
			status: status,
			trackingNumber: trackingNumber || undefined,
		});
		setShowCancelConfirmation(false);
	};

	const filteredOrders = allOrders.filter((o: AdminOrder) => {
		const customerName =
			o.shippingAddress.name && o.shippingAddress.surname
				? `${o.shippingAddress.name} ${o.shippingAddress.surname}`
				: o.user.name;
		const customerEmail = o.shippingAddress.email || o.user.email;

		return (
			o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
			customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

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
					<h1 className="font-bold text-3xl tracking-tight">Siparişler</h1>
					<p className="mt-1 text-muted-foreground">
						Müşterilerinizin verdiği siparişleri yönetin.
					</p>
				</div>
				<div className="relative w-72">
					<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="İsim, e-posta veya sipariş no..."
						className="h-10 pl-9"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			{/* Order List */}
			<div className="space-y-3">
				{filteredOrders?.map((order: AdminOrder) => {
					const st = statusConfig[order.status] || statusConfig.pending;

					return (
						<Card
							key={order.id}
							className="border-none shadow-sm transition-colors hover:bg-muted/20"
						>
							<CardContent className="p-0">
								<div className="flex flex-col md:flex-row md:items-center">
									<div className="flex flex-1 items-center gap-5 p-5">
										{/* Product Thumbnails */}
										<div className="flex -space-x-3 overflow-hidden">
											{order.items.slice(0, 3).map((item, idx) => (
												<Link
													key={item.id}
													to="/products/$slug"
													params={{ slug: item.product?.slug || "" }}
													className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md border-2 border-background bg-muted shadow-sm transition-transform hover:scale-105"
													style={{ zIndex: 3 - idx }}
												>
													{item.product?.images?.[0] ? (
														<img
															src={item.product.images[0]}
															alt={item.product.name}
															className="h-full w-full object-cover"
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center bg-muted">
															<Package className="h-4 w-4 text-muted-foreground/40" />
														</div>
													)}
													{item.quantity > 1 && (
														<Badge className="absolute right-0 bottom-0 h-4 min-w-[16px] rounded-sm px-0.5 text-[9px]">
															{item.quantity}
														</Badge>
													)}
												</Link>
											))}
											{order.items.length > 3 && (
												<div className="flex h-24 w-20 items-center justify-center rounded-md border-2 border-background bg-muted font-bold text-[10px] text-muted-foreground shadow-sm">
													+{order.items.length - 3}
												</div>
											)}
										</div>

										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<div className="flex items-center gap-2.5">
													<span className="font-mono text-muted-foreground text-xs">
														#{order.id.slice(0, 8).toUpperCase()}
													</span>
													<Badge
														variant="outline"
														className={cn(
															"rounded-md px-2 py-0.5 font-medium text-[11px]",
															st.className,
														)}
													>
														{st.label}
													</Badge>
												</div>
												<div className="flex flex-wrap gap-1.5 border-l pl-2.5">
													{order.items.map((item) => (
														<Badge
															key={item.id}
															variant="secondary"
															className="h-5 px-1.5 font-mono text-[9px] text-muted-foreground"
														>
															{item.product?.slug || "isimsiz"}
														</Badge>
													))}
												</div>
											</div>

											{/* Contact and Address Details */}
											<div className="mt-2 grid gap-3 text-xs md:grid-cols-2 lg:grid-cols-3">
												{/* Contact info */}
												<div className="space-y-1.5 rounded-lg border bg-muted/30 p-2.5">
													<div className="flex items-center gap-2 font-medium text-foreground">
														<span>👤</span>
														<span className="truncate">
															{order.shippingAddress.name &&
															order.shippingAddress.surname
																? `${order.shippingAddress.name} ${order.shippingAddress.surname}`
																: order.user.name || "İsimsiz Müşteri"}
														</span>
													</div>
													<div className="flex items-center gap-2 text-muted-foreground">
														<span className="shrink-0 text-amber-600">📧</span>
														<span className="truncate">
															{order.shippingAddress.email ||
																order.user.email ||
																"E-posta yok"}
														</span>
													</div>
													{order.shippingAddress.gsmNumber && (
														<div className="flex items-center gap-2 font-bold text-primary">
															<Phone className="h-3.5 w-3.5 shrink-0 text-blue-600" />
															<span>{order.shippingAddress.gsmNumber}</span>
														</div>
													)}
												</div>

												{/* Address info */}
												<div className="space-y-1.5 rounded-lg border bg-muted/30 p-2.5 lg:col-span-2">
													<div className="flex items-start gap-2">
														<MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
														<div className="space-y-0.5">
															<p className="font-medium text-foreground leading-snug">
																{order.shippingAddress.addressDetail}
															</p>
															<p className="text-muted-foreground">
																{order.shippingAddress.neighborhood},{" "}
																{order.shippingAddress.district} /{" "}
																<span className="uppercase">
																	{order.shippingAddress.province}
																</span>
															</p>
														</div>
													</div>
												</div>
											</div>

											{/* Order Date */}
											<div className="mt-2 flex items-center gap-2 text-[10px] opacity-60">
												<span>
													{format(
														new Date(order.createdAt),
														"d MMM yyyy HH:mm",
														{
															locale: tr,
														},
													)}
												</span>
											</div>
										</div>

										{/* Pricing */}
										<div className="hidden shrink-0 text-right md:block">
											<p className="font-bold text-lg tabular-nums">
												{(
													order.totalAmount +
													order.shippingFee -
													order.discountAmount
												).toLocaleString("tr-TR", {
													style: "currency",
													currency: order.currency,
												})}
											</p>
											<p className="text-[10px] text-muted-foreground uppercase">
												{order.totalAmount.toLocaleString("tr-TR", {
													style: "currency",
													currency: order.currency,
												})}{" "}
												+{" "}
												{order.shippingFee.toLocaleString("tr-TR", {
													style: "currency",
													currency: order.currency,
												})}{" "}
												{order.discountAmount > 0 && (
													<span className="text-emerald-600">
														-{" "}
														{order.discountAmount.toLocaleString("tr-TR", {
															style: "currency",
															currency: order.currency,
														})}
													</span>
												)}
											</p>
										</div>
									</div>

									{/* Actions */}
									<div className="flex items-center gap-3 border-t p-4 md:border-t-0 md:border-l md:px-5">
										{order.trackingNumber ? (
											<div className="flex items-center gap-1.5 text-primary text-xs">
												<Truck className="h-3.5 w-3.5" />
												<span className="max-w-[100px] truncate font-medium">
													{order.trackingNumber}
												</span>
											</div>
										) : (
											<span className="text-muted-foreground text-xs italic">
												Takip no yok
											</span>
										)}
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEdit(order)}
											className="h-9 gap-1.5 text-muted-foreground"
										>
											<Edit2 className="h-3.5 w-3.5" />
											Düzenle
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}

				{filteredOrders?.length === 0 && (
					<div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center">
						<Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
						<h3 className="font-medium">Sipariş bulunamadı</h3>
						<p className="mt-1 text-muted-foreground text-sm">
							Arama kriterlerinize uygun sipariş yok.
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
					) : allOrders.length > 0 ? (
						<p className="text-muted-foreground text-sm">
							Tüm siparişler yüklendi
						</p>
					) : null}
				</div>
			</div>

			{/* Edit Dialog */}
			<Dialog
				open={!!editingOrder}
				onOpenChange={(open) => !open && setEditingOrder(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Siparişi Güncelle</DialogTitle>
						<DialogDescription>
							Siparişin durumunu ve kargo bilgilerini güncelleyin.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="status" className="font-medium text-sm">
								Durum
							</Label>
							<Select
								value={status}
								onValueChange={(val) => setStatus(val as OrderStatus)}
							>
								<SelectTrigger id="status" className="h-10">
									<SelectValue placeholder="Durum seçiniz" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">Bekliyor</SelectItem>
									<SelectItem value="paid">Ödendi - Hazırlanıyor</SelectItem>
									<SelectItem value="shipped">Kargoya Verildi</SelectItem>
									<SelectItem value="delivered">Teslim Edildi</SelectItem>
									<SelectItem value="cancelled">İptal Edildi</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label className="font-medium text-sm">Ürünler ve Ücretler</Label>
							<div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
								{editingOrder?.items.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between gap-3"
									>
										<div className="flex min-w-0 items-center gap-2">
											<Link
												to="/products/$slug"
												params={{ slug: item.product?.slug || "" }}
												className="h-20 w-16 shrink-0 overflow-hidden rounded bg-muted transition-transform hover:scale-105"
											>
												{item.product?.images?.[0] ? (
													<img
														src={item.product.images[0]}
														alt={item.product.name}
														className="h-full w-full object-cover"
													/>
												) : (
													<div className="flex h-full w-full items-center justify-center">
														<Package className="h-4 w-4 text-muted-foreground/30" />
													</div>
												)}
											</Link>
											<div className="flex min-w-0 flex-col gap-0.5">
												<span className="truncate">
													{item.quantity}x {item.product?.name || "Ürün"}{" "}
													{item.size ? `(${item.size})` : ""}
												</span>
												<span className="font-mono text-[10px] text-muted-foreground">
													{item.product?.slug}
												</span>
											</div>
										</div>
										<span className="whitespace-nowrap font-mono">
											{(item.price * item.quantity).toLocaleString("tr-TR", {
												style: "currency",
												currency: editingOrder.currency,
											})}
										</span>
									</div>
								))}
								<div className="mt-2 space-y-1 border-t pt-2">
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Ara Toplam</span>
										<span>
											{editingOrder?.totalAmount.toLocaleString("tr-TR", {
												style: "currency",
												currency: editingOrder.currency,
											})}
										</span>
									</div>
									<div className="flex items-center justify-between text-muted-foreground">
										<span>Kargo Ücreti</span>
										<span>
											{editingOrder?.shippingFee.toLocaleString("tr-TR", {
												style: "currency",
												currency: editingOrder?.currency || "TRY",
											})}
										</span>
									</div>
									{editingOrder?.discountAmount ? (
										<div className="flex items-center justify-between text-emerald-600">
											<span>İndirim</span>
											<span>
												-
												{editingOrder.discountAmount.toLocaleString("tr-TR", {
													style: "currency",
													currency: editingOrder.currency,
												})}
											</span>
										</div>
									) : null}
									<div className="mt-1 flex items-center justify-between border-t pt-1 font-bold text-foreground">
										<span>Genel Toplam</span>
										<span>
											{(
												(editingOrder?.totalAmount || 0) +
												(editingOrder?.shippingFee || 0) -
												(editingOrder?.discountAmount || 0)
											).toLocaleString("tr-TR", {
												style: "currency",
												currency: editingOrder?.currency || "TRY",
											})}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="tracking" className="font-medium text-sm">
								Kargo Takip No
							</Label>
							<Input
								id="tracking"
								className="h-10"
								value={trackingNumber}
								onChange={(e) => setTrackingNumber(e.target.value)}
								placeholder="Örn: 5123456789"
							/>
						</div>
					</div>
					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={() => setEditingOrder(null)}>
							Vazgeç
						</Button>
						<Button onClick={handleSave} disabled={updateMutation.isPending}>
							{updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Cancel Confirmation Dialog */}
			<Dialog
				open={showCancelConfirmation}
				onOpenChange={(open) => !open && setShowCancelConfirmation(false)}
			>
				<DialogContent className="sm:max-w-[400px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<Package className="h-5 w-5" />
							Siparişi İptal Et?
						</DialogTitle>
						<DialogDescription className="pt-2">
							Bu işlem{" "}
							<strong>#{editingOrder?.id.slice(0, 8).toUpperCase()}</strong>{" "}
							numaralı siparişi iptal edecek ve
							<span className="mt-2 block font-medium text-foreground">
								• Iyzico üzerinden ödeme iadesi yapılacak
								<br />• Ürün stokları geri yüklenecek
								<br />• Varsa indirim kuponu iade edilecek
								<br />• Müşteriye bilgilendirme e-postası gönderilecek
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className="mt-2 rounded-md border border-red-100 bg-red-50 p-3 text-red-800 text-xs">
						<strong>Dikkat:</strong> Bu işlem geri alınamaz ve otomatik olarak
						finansal süreçleri tetikler.
					</div>
					<DialogFooter className="mt-4 gap-2">
						<Button
							variant="outline"
							onClick={() => setShowCancelConfirmation(false)}
						>
							Vazgeç
						</Button>
						<Button
							variant="destructive"
							onClick={executeSave}
							disabled={updateMutation.isPending}
						>
							{updateMutation.isPending ? "İşleniyor..." : "Onayla ve İptal Et"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
