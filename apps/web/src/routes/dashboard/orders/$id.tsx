import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
	ArrowLeft,
	CheckCircle2,
	Clock,
	CreditCard,
	ExternalLink,
	FileText,
	Info,
	MapPin,
	Package,
	Phone,
	RefreshCw,
	Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/orders/$id")({
	component: OrderDetailPage,
});

function StatusBadge({ status }: { status: string }) {
	const config: Record<
		string,
		{
			label: string;
			icon: React.ComponentType<{ className?: string }>;
			variant: "secondary" | "outline" | "default" | "destructive";
			className?: string;
		}
	> = {
		pending: {
			label: "Bekliyor",
			icon: Clock,
			variant: "secondary",
			className: "text-amber-600 border-amber-200 bg-amber-500/10",
		},
		paid: {
			label: "Hazırlanıyor",
			icon: Package,
			variant: "secondary",
			className: "text-sky-600 border-sky-200 bg-sky-500/10",
		},
		shipped: {
			label: "Kargoya Verildi",
			icon: Truck,
			variant: "secondary",
			className: "text-indigo-600 border-indigo-200 bg-indigo-500/10",
		},
		delivered: {
			label: "Teslim Edildi",
			icon: CheckCircle2,
			variant: "secondary",
			className: "text-emerald-600 border-emerald-200 bg-emerald-500/10",
		},
		cancelled: {
			label: "İptal Edildi",
			icon: Info,
			variant: "outline",
			className: "text-muted-foreground bg-muted",
		},
		failed: {
			label: "Ödeme Hatası",
			icon: Info,
			variant: "destructive",
			className: "bg-destructive/10 text-destructive border-destructive/20",
		},
	};

	const {
		label,
		icon: Icon,
		variant,
		className,
	} = config[status] || config.pending;

	return (
		<Badge
			variant={variant}
			className={cn(
				"gap-1.5 px-3 py-1 font-semibold text-xs tracking-tight",
				className,
			)}
		>
			<Icon className="h-3.5 w-3.5" />
			{label}
		</Badge>
	);
}

function OrderDetailPage() {
	const { id } = Route.useParams();
	const queryClient = useQueryClient();
	const { data: order, isLoading } = useQuery(
		orpc.order.getOrder.queryOptions({
			input: { id },
		}),
	);
	const { addItem } = useCart();

	const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
	const [returnReason, setReturnReason] = useState("");

	const returnRequestMutation = useMutation(
		orpc.order.createReturnRequest.mutationOptions({
			onSuccess: () => {
				toast.success("Talebiniz başarıyla alındı.");
				queryClient.invalidateQueries({
					queryKey: orpc.order.getOrder.queryKey({ input: { id } }),
				});
				setIsReturnDialogOpen(false);
				setReturnReason("");
			},
			onError: (error) => {
				toast.error(error.message || "Talep oluşturulamadı");
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="container mx-auto animate-pulse space-y-8">
				<div className="flex flex-col gap-4">
					<div className="h-4 w-32 rounded bg-muted" />
					<div className="h-10 w-64 rounded bg-muted" />
				</div>
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<div className="space-y-6 lg:col-span-2">
						<div className="h-64 rounded-xl bg-muted/20" />
						<div className="h-96 rounded-xl bg-muted/20" />
					</div>
					<div className="space-y-6">
						<div className="h-48 rounded-xl bg-muted/20" />
						<div className="h-64 rounded-xl bg-muted/20" />
					</div>
				</div>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="container mx-auto px-4 py-20 text-center">
				<h2 className="font-bold text-3xl text-foreground">
					Sipariş Bulunamadı
				</h2>
				<p className="mt-3 text-muted-foreground">
					Aradığınız sipariş detaylarına ulaşılamadı.
				</p>
				<Link
					to="/dashboard/orders"
					className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
				>
					<ArrowLeft className="h-4 w-4" />
					Siparişlerime Geri Dön
				</Link>
			</div>
		);
	}

	const handleBuyAgain = () => {
		for (const item of order.items) {
			addItem({
				productId: item.productId,
				quantity: item.quantity,
				size: item.size || undefined,
				color: item.color || undefined,
			});
		}
		toast.success("Ürünler sepetinize eklendi");
	};

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="fade-in slide-in-from-bottom-2 animate-in space-y-8 pb-12 duration-500">
			{/* Header Navigation */}
			<div className="flex flex-col gap-6 print:hidden">
				<Link
					to="/dashboard/orders"
					className="group inline-flex items-center font-semibold text-muted-foreground text-sm transition-colors hover:text-primary"
				>
					<ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
					Siparişlerime Geri Dön
				</Link>

				<div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
					<div className="space-y-1.5">
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-3xl text-foreground tracking-tight md:text-4xl">
								Sipariş Detayı
							</h1>
							<StatusBadge status={order.status} />
						</div>
						<p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
							Sipariş No:{" "}
							<span className="font-bold text-foreground">
								#{order.id.toUpperCase()}
							</span>
						</p>
					</div>
					<div className="flex items-center gap-3 print:hidden">
						<Button
							variant="outline"
							size="sm"
							onClick={handlePrint}
							className="h-10 gap-2 font-bold shadow-sm"
						>
							<FileText className="h-4 w-4" /> Yazdır
						</Button>
					</div>
				</div>
			</div>

			<div className="grid gap-8 lg:grid-cols-3">
				<div className="space-y-8 lg:col-span-2">
					{/* Return/Cancel Requests */}
					{order.returnRequests && order.returnRequests.length > 0 && (
						<Card className="overflow-hidden border-primary/20 bg-primary/5 shadow-sm">
							<div className="flex items-center justify-between border-primary/10 border-b px-6 py-4">
								<div className="flex items-center gap-2.5">
									<RefreshCw className="h-5 w-5 animate-spin-slow text-primary" />
									<h3 className="font-bold text-lg">
										{order.returnRequests[0].type === "return"
											? "İade Talebi"
											: "İptal Talebi"}
									</h3>
								</div>
								<Badge
									className={cn(
										"px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider",
										order.returnRequests[0].status === "approved"
											? "border-emerald-200 bg-emerald-500/10 text-emerald-700"
											: order.returnRequests[0].status === "rejected"
												? "border-rose-200 bg-rose-500/10 text-rose-700"
												: "border-amber-200 bg-amber-500/10 text-amber-700",
									)}
									variant="outline"
								>
									{order.returnRequests[0].status === "approved"
										? "Onaylandı"
										: order.returnRequests[0].status === "rejected"
											? "Reddedildi"
											: "İnceleniyor"}
								</Badge>
							</div>
							<CardContent className="p-6">
								<div className="grid gap-6">
									<div className="flex flex-col gap-1">
										<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
											Başvuru Tarihi
										</span>
										<span className="font-semibold text-sm">
											{format(
												new Date(order.returnRequests[0].createdAt),
												"d MMMM yyyy, HH:mm",
												{ locale: tr },
											)}
										</span>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-1.5 rounded-xl border bg-card p-4 shadow-sm">
											<p className="flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
												<Info className="h-3 w-3" /> Talep Nedeni
											</p>
											<p className="text-muted-foreground text-sm italic leading-relaxed">
												"{order.returnRequests[0].reason}"
											</p>
										</div>
										{order.returnRequests[0].adminNote && (
											<div className="space-y-1.5 rounded-xl border border-primary/10 bg-primary/5 p-4 shadow-sm">
												<p className="font-bold text-[10px] text-primary uppercase tracking-widest">
													Mağaza Notu
												</p>
												<p className="font-medium text-foreground text-sm leading-relaxed">
													{order.returnRequests[0].adminNote}
												</p>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Order Items */}
					<Card className="overflow-hidden shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 p-6">
							<CardTitle className="font-bold text-xl">Ürünler</CardTitle>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 font-bold text-primary hover:bg-primary/5 print:hidden"
								onClick={handleBuyAgain}
							>
								<RefreshCw className="mr-2 h-3.5 w-3.5" /> Tekrar Satın Al
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y">
								{order.items.map((item) => (
									<div key={item.id} className="group flex gap-6 p-6">
										<div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted/20 shadow-sm">
											{item.product?.images?.[0] ? (
												<img
													src={item.product.images[0]}
													alt={item.product.name || "Ürün"}
													className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
												/>
											) : (
												<div className="flex h-full items-center justify-center">
													<Package className="h-8 w-8 text-muted-foreground/20" />
												</div>
											)}
										</div>
										<div className="flex flex-1 flex-col justify-center py-1">
											<div className="space-y-1">
												<h4 className="font-bold text-base leading-tight">
													{item.product?.name || "Silinmiş Ürün"}
												</h4>
												<div className="flex flex-wrap items-center gap-3">
													<Badge
														variant="secondary"
														className="border bg-secondary/50 px-2 py-0 font-bold text-[10px] uppercase shadow-none"
													>
														{item.quantity} ADET
													</Badge>
													<div className="flex gap-4">
														{item.size && (
															<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
																Beden:{" "}
																<span className="font-bold text-foreground tracking-normal">
																	{item.size}
																</span>
															</span>
														)}
														{item.color && (
															<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
																Renk:{" "}
																<span className="font-bold text-foreground tracking-normal">
																	{item.color}
																</span>
															</span>
														)}
													</div>
												</div>
											</div>
											<div className="mt-3 flex items-baseline gap-2">
												<p className="font-bold text-lg">
													{(item.price * item.quantity).toLocaleString(
														"tr-TR",
														{
															style: "currency",
															currency: order.currency,
														},
													)}
												</p>
												{item.quantity > 1 && (
													<span className="font-semibold text-[10px] text-muted-foreground uppercase">
														( Adet:{" "}
														{item.price.toLocaleString("tr-TR", {
															style: "currency",
															currency: order.currency,
														})}{" "}
														)
													</span>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Timeline */}
					<Card className="overflow-hidden shadow-sm">
						<CardHeader className="border-b bg-muted/5 p-6">
							<CardTitle className="font-bold text-xl">
								Sipariş Durumu
							</CardTitle>
						</CardHeader>
						<CardContent className="p-8">
							<div className="relative space-y-10 pl-10 before:absolute before:top-2 before:left-[17px] before:h-[calc(100%-16px)] before:w-[1.5px] before:bg-muted/80">
								{/* Step 1: Received */}
								<div className="relative">
									<div className="absolute top-1 -left-[35px] z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-primary shadow-sm" />
									<div className="space-y-0.5">
										<p className="font-bold text-base leading-tight">
											Sipariş Alındı
										</p>
										<p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
											{format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", {
												locale: tr,
											})}
										</p>
									</div>
								</div>

								{/* Step 2: Payment */}
								{order.status !== "pending" && (
									<div className="relative">
										<div className="absolute top-1 -left-[35px] z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-emerald-500 shadow-sm" />
										<div>
											<p className="font-bold text-base text-emerald-600 leading-tight">
												Ödeme Onaylandı
											</p>
										</div>
									</div>
								)}

								{/* Step 3: Shipping */}
								{order.status === "shipped" || order.status === "delivered" ? (
									<div className="relative">
										<div className="absolute top-1 -left-[35px] z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-indigo-500 shadow-sm" />
										<div className="space-y-4">
											<p className="font-bold text-base leading-tight">
												Kargoya Verildi
											</p>
											{order.trackingNumber && (
												<div className="mt-1 flex flex-col gap-2">
													<p className="flex items-center gap-2 font-bold font-mono text-sm">
														<span className="font-sans text-[10px] text-muted-foreground uppercase tracking-widest">
															Takip No
														</span>
														{order.trackingNumber}
													</p>
													<a
														href="https://shipnow.dhl.com/tr/tr"
														target="_blank"
														rel="noopener noreferrer"
														className="flex w-fit items-center gap-1.5 font-bold text-[11px] text-primary uppercase tracking-wider transition-opacity hover:opacity-80"
													>
														DHL Kargo Takibi{" "}
														<ExternalLink className="h-3 w-3" />
													</a>
												</div>
											)}
										</div>
									</div>
								) : (
									order.status === "paid" && (
										<div className="relative opacity-60">
											<div className="absolute top-1 -left-[35px] z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm" />
											<div>
												<p className="font-bold text-base text-muted-foreground leading-tight">
													Hazırlanıyor
												</p>
												<p className="mt-0.5 font-semibold text-[10px] text-muted-foreground uppercase">
													Kargo Hazırlık Aşamasında
												</p>
											</div>
										</div>
									)
								)}

								{/* Step 4: Final */}
								{order.status === "delivered" ? (
									<div className="relative">
										<div className="absolute top-1 -left-[35px] z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-emerald-500 shadow-sm" />
										<div className="space-y-0.5">
											<p className="font-bold text-base leading-tight">
												Teslim Edildi
											</p>
											<p className="font-medium text-[11px] text-muted-foreground uppercase tracking-tight">
												Paket başarıyla ulaştırıldı.
											</p>
										</div>
									</div>
								) : (
									order.status !== "cancelled" && (
										<div className="relative opacity-30">
											<div className="absolute top-1 -left-[35px] z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground" />
											<div>
												<p className="font-bold text-base">Teslimat</p>
											</div>
										</div>
									)
								)}

								{order.status === "cancelled" && (
									<div className="relative">
										<div className="absolute top-1 -left-[35px] z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-rose-500 shadow-sm" />
										<div>
											<p className="font-bold text-base text-rose-600 leading-tight">
												Sipariş İptal Edildi
											</p>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-8">
					{/* Summary */}
					<Card className="border-none shadow-md ring-1 ring-border">
						<CardHeader className="border-b bg-muted/5 p-6">
							<CardTitle className="font-bold text-lg uppercase tracking-tight">
								Sipariş Özeti
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 p-6">
							<div className="flex justify-between font-semibold text-muted-foreground text-sm">
								<span>Ara Toplam</span>
								<span className="text-foreground">
									{order.totalAmount.toLocaleString("tr-TR", {
										style: "currency",
										currency: order.currency,
									})}
								</span>
							</div>
							<div className="flex justify-between font-semibold text-muted-foreground text-sm">
								<span>Kargo</span>
								{order.shippingFee > 0 ? (
									<span className="text-foreground">
										{order.shippingFee.toLocaleString("tr-TR", {
											style: "currency",
											currency: order.currency,
										})}
									</span>
								) : (
									<span className="font-bold text-[10px] text-emerald-600 uppercase tracking-widest">
										Ücretsiz
									</span>
								)}
							</div>
							{order.discountAmount > 0 && (
								<div className="flex justify-between font-semibold text-muted-foreground text-sm">
									<span>İndirim</span>
									<span className="text-emerald-600">
										-
										{order.discountAmount.toLocaleString("tr-TR", {
											style: "currency",
											currency: order.currency,
										})}
									</span>
								</div>
							)}
							<Separator className="bg-muted-foreground/10" />
							<div className="flex flex-col gap-1 pt-2">
								<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
									Toplam Tutar
								</span>
								<span className="font-bold text-3xl text-primary tracking-tighter">
									{(
										order.totalAmount +
										order.shippingFee -
										order.discountAmount
									).toLocaleString("tr-TR", {
										style: "currency",
										currency: order.currency,
									})}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Information */}
					<Card className="border-none shadow-sm ring-1 ring-border">
						<CardHeader className="border-b bg-muted/5 p-6">
							<CardTitle className="font-bold text-lg uppercase tracking-tight">
								Bilgiler
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-8 p-6">
							<div className="flex gap-4">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<CreditCard className="h-5 w-5" />
								</div>
								<div className="flex flex-col">
									<h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
										Ödeme Yöntemi
									</h4>
									<p className="mt-0.5 font-bold text-sm">Banka/Kredi Kartı</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<MapPin className="h-5 w-5" />
								</div>
								<div className="flex-1 space-y-4">
									<div>
										<h4 className="mb-0.5 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
											Teslimat Adresi
										</h4>
										<p className="font-bold text-sm">
											{order.shippingAddress.name}{" "}
											{order.shippingAddress.surname}
										</p>
									</div>
									<div className="space-y-2 font-medium text-muted-foreground text-sm leading-relaxed">
										<p className="flex items-center gap-2 font-bold text-foreground">
											<Badge
												variant="secondary"
												className="h-6 px-1.5 font-mono tabular-nums shadow-none"
											>
												<Phone className="mr-1.5 h-3 w-3 text-primary" />{" "}
												{order.shippingAddress.gsmNumber}
											</Badge>
										</p>
										<div className="space-y-1 rounded-lg border border-dashed bg-muted/30 p-3 text-xs">
											<p className="font-semibold text-foreground">
												{order.shippingAddress.addressDetail}
											</p>
											<p>{order.shippingAddress.neighborhood}</p>
											<p>
												{order.shippingAddress.district} /{" "}
												{order.shippingAddress.province}
											</p>
											<p className="font-mono text-[10px]">
												{order.shippingAddress.zipCode}
											</p>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Actions */}
					{order.status !== "cancelled" &&
						order.status !== "shipped" &&
						(!order.returnRequests || order.returnRequests.length === 0) && (
							<div className="px-0 print:hidden">
								<Dialog
									open={isReturnDialogOpen}
									onOpenChange={setIsReturnDialogOpen}
								>
									<DialogTrigger
										render={
											<Button
												variant="outline"
												className="h-12 w-full rounded-xl border-rose-200 font-bold text-rose-600 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
											>
												{order.status === "delivered"
													? "İade Talebi Oluştur"
													: "Siparişi İptal Et"}
											</Button>
										}
									/>
									<DialogContent className="rounded-2xl sm:max-w-[425px]">
										<DialogHeader>
											<DialogTitle className="font-bold text-2xl tracking-tight">
												{order.status === "delivered"
													? "İade Talebi"
													: "İptal Talebi"}
											</DialogTitle>
											<DialogDescription className="pt-1 font-medium text-muted-foreground">
												Lütfen {order.status === "delivered" ? "iade" : "iptal"}{" "}
												sebebinizi belirtin. Talebiniz yönetici onayından sonra
												işlenecektir.
											</DialogDescription>
										</DialogHeader>
										<div className="py-6">
											<Textarea
												value={returnReason}
												onChange={(e) => setReturnReason(e.target.value)}
												placeholder="Müşteri hizmetlerine iletmek istediğiniz mesaj..."
												className="min-h-[140px] rounded-xl border-muted-foreground/10 bg-muted/10 focus-visible:ring-primary/20"
											/>
										</div>
										<DialogFooter>
											<Button
												variant="destructive"
												className="h-12 w-full rounded-xl font-bold shadow-md"
												disabled={
													returnRequestMutation.isPending ||
													!returnReason.trim()
												}
												onClick={() => {
													returnRequestMutation.mutate({
														orderId: order.id,
														type:
															order.status === "delivered"
																? "return"
																: "cancel",
														reason: returnReason,
													});
												}}
											>
												{returnRequestMutation.isPending
													? "Talebiniz Gönderiliyor..."
													: "Talebi Gönder"}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
						)}
				</div>
			</div>
		</div>
	);
}
