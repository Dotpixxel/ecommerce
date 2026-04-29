import { Link } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { CampaignBanner } from "./campaign-banner";
import { CartSheet } from "./cart-sheet";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { SearchModal } from "./search-modal";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";

export default function Header() {
	const { totalItems } = useCart();
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsSearchOpen((open) => !open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return (
		<>
			<CampaignBanner />
			<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="container flex h-16 items-center gap-4 px-4 md:px-6">
					{/* Sol: Logo */}
					<div className="flex items-center gap-2">
						<MobileNav />
						<Link
							to="/"
							className="shrink-0 transition-opacity hover:opacity-90"
						>
							<Logo size="md" className="md:hidden" />
							<Logo size="lg" className="hidden md:flex" />
						</Link>
					</div>

					{/* Orta: Nav — esnek yapı (flex) sayesinde çakışma yapmaz */}
					<div className="hidden flex-1 items-center justify-center lg:flex">
						<MainNav />
					</div>

					{/* Sağ: Arama + Sepet + Profil */}
					<div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
						<button
							type="button"
							onClick={() => setIsSearchOpen(true)}
							className="group relative hidden items-center lg:flex"
						>
							<Search className="absolute left-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
							<div className="flex h-9 w-64 items-center rounded-md border border-border/50 bg-muted/50 pr-3 pl-9 text-muted-foreground text-sm transition-colors hover:bg-muted group-hover:border-border">
								<span>Ürün ara...</span>
								<kbd className="pointer-events-none absolute right-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100 sm:flex">
									<span className="text-xs">⌘</span>K
								</kbd>
							</div>
						</button>
						<Link
							to="/favorites"
							className="relative flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-red-500"
						>
							<Heart className="h-5 w-5" />
						</Link>
						<Button
							variant="ghost"
							size="icon"
							className="relative"
							onClick={() => setIsCartOpen(true)}
						>
							<ShoppingBag className="h-5 w-5" />
							{totalItems > 0 && (
								<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-medium text-[10px] text-primary-foreground">
									{totalItems}
								</span>
							)}
						</Button>
						<UserMenu />
					</div>
				</div>
			</header>
			<CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
			<SearchModal
				isOpen={isSearchOpen}
				onClose={() => setIsSearchOpen(false)}
			/>
		</>
	);
}
