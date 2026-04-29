import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	linkOptions,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import {
	LayoutDashboard,
	Megaphone,
	MessageSquare,
	Package,
	Settings,
	ShoppingCart,
	Store,
	Tags,
	TicketPercent,
	Undo2,
	Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		const { data: session } = await authClient.getSession();

		if (session?.user?.role !== "admin") {
			throw redirect({
				to: "/",
			});
		}
	},
	component: AdminLayout,
});

const navItems = [
	linkOptions({
		label: "Dashboard",
		to: "/admin",
		icon: LayoutDashboard,
	}),
	linkOptions({
		label: "Siparişler",
		to: "/admin/orders",
		icon: ShoppingCart,
	}),
	linkOptions({
		label: "Ürünler",
		to: "/admin/products",
		icon: Package,
	}),
	linkOptions({
		label: "Kategoriler",
		to: "/admin/categories",
		icon: Tags,
	}),
	linkOptions({
		label: "Kuponlar",
		to: "/admin/coupons",
		icon: TicketPercent,
	}),
	linkOptions({
		label: "Kampanyalar",
		to: "/admin/campaigns",
		icon: Megaphone,
	}),
	linkOptions({
		label: "Yorumlar",
		to: "/admin/reviews",
		icon: MessageSquare,
	}),
	linkOptions({
		label: "İade & İptal",
		to: "/admin/returns",
		icon: Undo2,
	}),
	linkOptions({
		label: "Site Ayarları",
		to: "/admin/settings",
		icon: Settings,
	}),
] as const;

function AdminLayout() {
	const { data: stats } = useQuery(
		orpc.admin.getDashboardStats.queryOptions({}),
	);

	const getBadgeCount = (to: string) => {
		if (!stats) return 0;
		if (to === "/admin/orders") return stats.paidOrdersCount;
		if (to === "/admin/returns") return stats.pendingReturnRequestsCount;
		if (to === "/admin/reviews") return stats.pendingReviewsCount;
		return 0;
	};

	return (
		<div className="flex min-h-screen">
			{/* Sidebar */}
			<aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r bg-card md:block">
				<div className="flex h-full flex-col">
					{/* Brand */}
					<div className="flex h-16 items-center gap-2.5 border-b px-5">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<Store className="h-4 w-4" />
						</div>
						<div className="flex flex-col">
							<span className="font-bold text-sm leading-none tracking-tight">
								Raunk Butik
							</span>
							<span className="text-[10px] text-muted-foreground">
								Yönetim Paneli
							</span>
						</div>
					</div>

					<nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
						<div className="mb-2 px-3 font-medium text-[11px] text-muted-foreground/60 uppercase tracking-widest">
							Menü
						</div>
						{navItems.map((item) => {
							const badgeCount = getBadgeCount(item.to);
							return (
								<Link
									key={item.to}
									{...item}
									className={cn(
										"group flex items-center justify-between rounded-lg px-3 py-2.5 font-medium text-muted-foreground text-sm transition-all duration-150",
										"hover:bg-muted/80 hover:text-foreground",
										"[&.active]:bg-primary/10 [&.active]:font-semibold [&.active]:text-primary",
									)}
								>
									<div className="flex items-center gap-3">
										<item.icon className="h-[18px] w-[18px] shrink-0 transition-colors group-[.active]:text-primary" />
										{item.label}
									</div>
									{badgeCount > 0 && (
										<Badge
											variant="default"
											className="h-5 min-w-[20px] justify-center px-1 font-bold text-[10px]"
										>
											{badgeCount}
										</Badge>
									)}
								</Link>
							);
						})}

						<div className="mt-6 mb-2 px-3 font-medium text-[11px] text-muted-foreground/60 uppercase tracking-widest">
							Yakında
						</div>
						<div className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground/40 text-sm">
							<Users className="h-[18px] w-[18px]" />
							Kullanıcılar
						</div>
					</nav>

					{/* Footer */}
					<div className="border-t px-5 py-4">
						<Link
							to="/"
							className="flex items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
						>
							<Store className="h-3.5 w-3.5" />
							Mağazaya Git
						</Link>
					</div>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-auto bg-muted/30">
				<Outlet />
			</main>
		</div>
	);
}
