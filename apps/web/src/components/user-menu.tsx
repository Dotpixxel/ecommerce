import { Link, useNavigate } from "@tanstack/react-router";
import {
	LayoutDashboard,
	LogOut,
	Package,
	Settings,
	User,
	UserCircle,
} from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-9 rounded-full sm:h-9 sm:w-24" />;
	}

	if (!session || session.user.isAnonymous) {
		return (
			<Link to="/login">
				<Button variant="ghost" size="sm" className="gap-2 font-medium">
					<User className="h-4 w-4" />
					<span className="hidden sm:inline-block">Giriş Yap</span>
				</Button>
			</Link>
		);
	}

	const initials = session.user.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						className="flex h-9 items-center gap-2.5 px-2"
					>
						<span className="hidden font-medium text-sm sm:inline-block">
							{session.user.name?.split(" ")[0]}
						</span>
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-[11px] text-primary transition-colors">
							{initials || <UserCircle className="h-5 w-5" />}
						</div>
					</Button>
				}
			/>
			<DropdownMenuContent className="w-56" align="end">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="font-medium text-sm leading-none">
								{session.user.name}
							</p>
							<p className="text-muted-foreground text-xs leading-none">
								{session.user.email}
							</p>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					{session.user.role === "admin" && (
						<DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
							<LayoutDashboard className="mr-2 h-4 w-4" />
							<span>Yönetim Paneli</span>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
						<UserCircle className="mr-2 h-4 w-4" />
						<span>Profilim</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => navigate({ to: "/dashboard/orders" })}
					>
						<Package className="mr-2 h-4 w-4" />
						<span>Siparişlerim</span>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
						<Settings className="mr-2 h-4 w-4" />
						<span>Ayarlar</span>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:bg-destructive/10 focus:text-destructive"
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									navigate({
										to: "/",
									});
								},
							},
						});
					}}
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Çıkış Yap</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
