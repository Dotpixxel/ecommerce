import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import { MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async ({ location }) => {
		const session = await getUser();
		if (location.pathname === "/dashboard") {
			throw redirect({
				to: "/dashboard/orders",
			});
		}
		return { session };
	},
	loader: async ({ context }) => {
		if (!context.session) {
			throw redirect({
				to: "/login",
			});
		}
	},
});

function RouteComponent() {
	const { session } = Route.useRouteContext();

	return (
		<div className="container mx-auto min-h-screen max-w-7xl px-4 py-8 md:py-12">
			<div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-12">
				<div className="md:col-span-1 lg:col-span-3">
					<Card className="sticky top-24 border-2 border-primary/5 shadow-lg">
						<CardHeader className="border-b bg-muted/30 pb-4">
							<CardTitle className="font-bold text-xl">Hesabım</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6 pt-6">
							<div className="flex flex-col gap-1">
								<p className="font-medium text-muted-foreground text-sm uppercase tracking-wider">
									Hoş Geldin,
								</p>
								<p className="font-bold text-2xl text-primary tracking-tight">
									{session?.user.name}
								</p>
							</div>
							<div className="flex flex-col gap-2 pt-2">
								<Link
									to="/dashboard/orders"
									className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 font-semibold text-foreground/80 transition-all hover:bg-primary/5 hover:text-primary [&.active]:border-primary/20 [&.active]:bg-primary/10 [&.active]:text-primary"
								>
									<Package className="h-5 w-5 transition-transform group-hover:scale-110" />
									Siparişlerim
								</Link>
								<Link
									to="/dashboard/addresses"
									className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 font-semibold text-foreground/80 transition-all hover:bg-primary/5 hover:text-primary [&.active]:border-primary/20 [&.active]:bg-primary/10 [&.active]:text-primary"
								>
									<MapPin className="h-5 w-5 transition-transform group-hover:scale-110" />
									Adreslerim
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
				<div className="md:col-span-3 lg:col-span-9">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
