import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
	ArrowUpRight,
	DollarSign,
	Loader2,
	PackageOpen,
	ShoppingCart,
	Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/")({
	component: AdminDashboardPage,
});

const statusLabels: Record<string, { label: string; className: string }> = {
	pending: {
		label: "Bekliyor",
		className: "bg-amber-500/15 text-amber-700 border border-amber-500/25",
	},
	paid: {
		label: "Ödendi",
		className: "bg-blue-500/15 text-blue-700 border border-blue-500/25",
	},
	shipped: {
		label: "Kargoda",
		className: "bg-violet-500/15 text-violet-700 border border-violet-500/25",
	},
	delivered: {
		label: "Teslim Edildi",
		className:
			"bg-emerald-500/15 text-emerald-700 border border-emerald-500/25",
	},
	cancelled: {
		label: "İptal",
		className: "bg-red-500/15 text-red-700 border border-red-500/25",
	},
};

function AdminDashboardPage() {
	const { data: stats, isLoading } = useQuery(
		orpc.admin.getDashboardStats.queryOptions({}),
	);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const statCards = [
		{
			title: "Toplam Kasa",
			value: (stats?.totalRevenue || 0).toLocaleString("tr-TR", {
				style: "currency",
				currency: "TRY",
			}),
			icon: DollarSign,
			accent: "bg-emerald-500/10 text-emerald-600",
		},
		{
			title: "Sipariş Sayısı",
			value: `${stats?.ordersCount || 0} Adet`,
			icon: ShoppingCart,
			accent: "bg-blue-500/10 text-blue-600",
		},
		{
			title: "Bekleyen İşler",
			value: `${(stats?.paidOrdersCount || 0) + (stats?.pendingReturnRequestsCount || 0) + (stats?.pendingReviewsCount || 0)} Aksiyon`,
			icon: PackageOpen,
			accent: "bg-amber-500/10 text-amber-600",
			description: `${stats?.paidOrdersCount || 0} Gönderi, ${stats?.pendingReturnRequestsCount || 0} İade, ${stats?.pendingReviewsCount || 0} Yorum`,
		},
		{
			title: "Müşteriler",
			value: `${stats?.usersCount || 0} Kişi`,
			icon: Users,
			accent: "bg-violet-500/10 text-violet-600",
		},
	];

	return (
		<div className="space-y-8 p-6 lg:p-8">
			{/* Header */}
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Mağaza Özeti</h1>
				<p className="mt-1 text-muted-foreground">
					Mağazanızın genel durumunu ve son satışları takip edin.
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{statCards.map((stat) => (
					<Card key={stat.title} className="border-none bg-card shadow-sm">
						<CardContent className="p-5">
							<div className="flex items-center justify-between">
								<p className="font-medium text-muted-foreground text-sm">
									{stat.title}
								</p>
								<div
									className={cn(
										"flex h-9 w-9 items-center justify-center rounded-lg",
										stat.accent,
									)}
								>
									<stat.icon className="h-[18px] w-[18px]" />
								</div>
							</div>
							<p className="mt-3 font-bold text-2xl tracking-tight">
								{stat.value}
							</p>
							{stat.description && (
								<p className="mt-1 font-medium text-muted-foreground text-xs">
									{stat.description}
								</p>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Recent Orders */}
			<Card className="border-none shadow-sm">
				<CardHeader className="flex flex-row items-center justify-between border-b px-6 py-5">
					<CardTitle className="font-semibold text-lg">
						Son Siparişler
					</CardTitle>
					<Link to="/admin/orders">
						<Button
							variant="ghost"
							size="sm"
							className="gap-1.5 text-muted-foreground text-xs"
						>
							Tümünü Gör
							<ArrowUpRight className="h-3.5 w-3.5" />
						</Button>
					</Link>
				</CardHeader>
				<CardContent className="p-0">
					{stats?.recentOrders?.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
								<ShoppingCart className="h-5 w-5 text-muted-foreground" />
							</div>
							<p className="font-medium text-muted-foreground text-sm">
								Henüz hiç sipariş yok.
							</p>
						</div>
					) : (
						<div className="divide-y">
							{stats?.recentOrders?.map((order) => {
								const st = statusLabels[order.status] || {
									label: order.status,
									className: "bg-muted text-muted-foreground",
								};

								return (
									<Link
										key={order.id}
										to="/admin/orders"
										search={{ q: order.id.slice(0, 8).toUpperCase() }}
										className="block rounded-lg transition-colors hover:bg-muted/50"
									>
										<div className="flex items-center gap-4 px-6 py-4">
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground text-xs uppercase">
												{order.user.name
													?.split(" ")
													.map((n) => n[0])
													.join("")
													.slice(0, 2)}
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<p className="truncate font-semibold text-sm">
														{order.user.name}
													</p>
													<Badge
														variant="outline"
														className={cn(
															"rounded-md px-1.5 py-0 font-medium text-[10px]",
															st.className,
														)}
													>
														{st.label}
													</Badge>
												</div>
												<p className="text-muted-foreground text-xs">
													{format(
														new Date(order.createdAt),
														"d MMM yyyy HH:mm",
														{ locale: tr },
													)}
												</p>
											</div>
											<div className="text-right">
												<p className="min-w-[100px] font-bold text-sm tabular-nums">
													{(
														order.totalAmount +
														order.shippingFee -
														order.discountAmount
													).toLocaleString("tr-TR", {
														style: "currency",
														currency: order.currency,
													})}
												</p>
												<p className="text-[9px] text-muted-foreground uppercase">
													{order.totalAmount.toLocaleString("tr-TR", {
														style: "currency",
														currency: order.currency,
													})}{" "}
													+{" "}
													{order.shippingFee.toLocaleString("tr-TR", {
														style: "currency",
														currency: order.currency,
													})}
												</p>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
