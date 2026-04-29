import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
	CheckCircle2,
	ChevronRight,
	Clock,
	Info,
	type LucideIcon,
	Package,
	ShoppingBag,
	Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/orders/")({
	component: OrdersPage,
});

function StatusBadge({ status }: { status: string }) {
	const config: Record<
		string,
		{
			label: string;
			icon: LucideIcon;
			variant: "outline" | "secondary" | "default" | "destructive";
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
			label: "Kargoda",
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
			label: "İptal",
			icon: Info,
			variant: "outline",
			className: "text-muted-foreground bg-muted",
		},
		failed: {
			label: "Hata",
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
				"gap-1.5 px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider",
				className,
			)}
		>
			<Icon className="h-3 w-3" />
			{label}
		</Badge>
	);
}

function OrdersPage() {
	const { data: orders, isLoading } = useQuery(
		orpc.order.getMyOrders.queryOptions({}),
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="h-8 w-48 animate-pulse rounded bg-muted" />
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-32 animate-pulse rounded-lg border bg-muted/20"
						/>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="fade-in slide-in-from-bottom-2 animate-in space-y-8 duration-500">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-2xl text-foreground tracking-tight md:text-3xl">
					Siparişlerim
				</h1>
			</div>

			{!orders || orders.length === 0 ? (
				<Card className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/5 py-16 text-center">
					<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 text-muted-foreground/40">
						<ShoppingBag className="h-8 w-8" />
					</div>
					<h3 className="font-bold text-xl tracking-tight">
						Henüz siparişiniz yok
					</h3>
					<p className="mx-auto mt-2 max-w-xs text-muted-foreground text-sm">
						Siparişlerinizi burada görebilir ve takip edebilirsiniz.
					</p>
					<Link
						to="/"
						className="mt-8 rounded-full bg-primary px-8 py-2.5 font-bold text-primary-foreground text-sm shadow-sm transition-all hover:bg-primary/90 active:scale-95"
					>
						Alışverişe Başla
					</Link>
				</Card>
			) : (
				<div className="grid gap-4">
					{orders?.map((order) => (
						<Link
							key={order.id}
							to="/dashboard/orders/$id"
							params={{ id: order.id }}
							className="group block"
						>
							<Card className="overflow-hidden border bg-card transition-all group-hover:border-primary/30 group-hover:shadow-md">
								<div className="flex flex-col sm:flex-row sm:items-center">
									{/* Info Strip */}
									<div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
										{/* Main Info */}
										<div className="min-w-[140px] space-y-1">
											<div className="flex items-center gap-2">
												<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
													#{order.id.slice(0, 8).toUpperCase()}
												</span>
												<StatusBadge status={order.status} />
											</div>
											<p className="font-bold text-sm">
												{format(new Date(order.createdAt), "d MMMM yyyy", {
													locale: tr,
												})}
											</p>
										</div>

										{/* Items Images */}
										<div className="flex -space-x-3 overflow-hidden py-1">
											{order.items.slice(0, 3).map((item) => (
												<div
													key={item.id}
													className="inline-block h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm"
												>
													{item.product?.images?.[0] ? (
														<img
															src={item.product.images[0]}
															alt={item.product.name || "Ürün"}
															className="h-full w-full object-cover"
														/>
													) : (
														<div className="flex h-full items-center justify-center">
															<Package className="h-4 w-4 text-muted-foreground/40" />
														</div>
													)}
												</div>
											))}
											{order.items.length > 3 && (
												<div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-secondary font-bold text-[10px] text-secondary-foreground shadow-sm">
													+{order.items.length - 3}
												</div>
											)}
										</div>

										{/* Content Preview */}
										<div className="flex-1 space-y-0.5">
											<p className="line-clamp-1 font-semibold text-muted-foreground text-sm tracking-tight group-hover:text-foreground">
												{order.items[0].product?.name || "Sipariş Öğesi"}
												{order.items.length > 1 && (
													<span> ve {order.items.length - 1} diğer ürün</span>
												)}
											</p>
											{order.returnRequests &&
												order.returnRequests.length > 0 && (
													<div className="flex items-center gap-1.5 text-xs">
														<Badge
															variant="outline"
															className="h-4 border-amber-200 bg-amber-500/10 px-1.5 text-[9px] text-amber-600"
														>
															{order.returnRequests[0].type === "cancel"
																? "İptal Talebi"
																: "İade Talebi"}
															:{" "}
															{order.returnRequests[0].status === "approved"
																? "Onaylandı"
																: order.returnRequests[0].status === "rejected"
																	? "Reddedildi"
																	: "İşlemde"}
														</Badge>
													</div>
												)}
										</div>

										{/* Amount */}
										<div className="text-left sm:text-right">
											<p className="font-bold text-base text-primary">
												{(
													order.totalAmount +
													order.shippingFee -
													order.discountAmount
												).toLocaleString("tr-TR", {
													style: "currency",
													currency: order.currency,
												})}
											</p>
											<p className="font-semibold text-[10px] text-muted-foreground uppercase">
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

									{/* Action Arrow */}
									<div className="hidden border-s bg-muted/5 p-4 group-hover:bg-muted/10 sm:block">
										<ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
									</div>
								</div>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
