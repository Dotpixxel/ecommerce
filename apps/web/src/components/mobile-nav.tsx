import type { InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "@raunk-butik/api";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Instagram, Mail, Menu, Phone, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { orpc } from "@/utils/orpc";
import { Logo } from "./logo";

export function MobileNav() {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const navigate = useNavigate();

	const { data: categories } = useQuery(
		orpc.product.getCategories.queryOptions(),
	);

	const categoriesData =
		(categories as InferRouterOutputs<AppRouter>["product"]["getCategories"]) ||
		[];
	const parentCategories = categoriesData.filter((c) => !c.parentId);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate({
				to: "/products",
				search: { q: searchQuery.trim() },
			});
			setSearchQuery("");
			setIsOpen(false);
		}
	};

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						className="mr-2 hover:bg-transparent md:hidden"
					>
						<Menu className="h-6 w-6" />
						<span className="sr-only">Menüyü Aç</span>
					</Button>
				}
			/>
			<SheetContent
				side="left"
				className="flex w-[280px] flex-col p-0 sm:w-[350px]"
			>
				<SheetHeader className="border-b bg-background/80 px-6 py-4 backdrop-blur-md">
					<div className="flex items-center justify-between">
						<SheetTitle className="text-left">
							<Logo size="md" />
						</SheetTitle>
					</div>
				</SheetHeader>

				<div className="px-6 py-4">
					<form onSubmit={handleSearch} className="group relative">
						<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
						<Input
							type="search"
							placeholder="Koleksiyonlarda ara..."
							className="h-10 w-full rounded-none border-none bg-secondary/50 pl-10 ring-offset-background transition-all focus-visible:bg-secondary focus-visible:ring-1 focus-visible:ring-ring"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</form>
				</div>

				<div className="flex-1 overflow-y-auto px-6">
					<nav className="flex flex-col space-y-8 py-4">
						{/* Ana Kategoriler - Highlighted */}
						<div className="space-y-4">
							<Link
								to="/products"
								className="group flex items-center justify-between font-serif text-lg tracking-tight transition-colors hover:text-primary"
								onClick={() => setIsOpen(false)}
							>
								<span>Yeni Gelenler</span>
								<span className="h-px w-8 bg-border transition-all group-hover:w-12 group-hover:bg-primary" />
							</Link>
							<Link
								to="/"
								className="flex items-center justify-between font-bold font-serif text-lg text-red-600 tracking-tight transition-colors hover:text-red-700"
								onClick={() => setIsOpen(false)}
							>
								<span>Çok Satanlar</span>
								<div className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
							</Link>
						</div>

						{/* Dinamik Kategoriler */}
						<div className="space-y-6 pt-2">
							{parentCategories.map((parent) => (
								<div key={parent.id} className="space-y-3">
									<h4 className="font-serif text-muted-foreground text-xs uppercase tracking-[0.2em]">
										{parent.name}
									</h4>
									<ul className="grid grid-cols-1 gap-y-3 pl-2">
										{parent.children?.map((child) => (
											<li key={child.id}>
												<Link
													to="/products"
													search={{ categoryId: child.id }}
													className="text-[15px] text-foreground/80 transition-all hover:translate-x-1 hover:text-primary"
													onClick={() => setIsOpen(false)}
												>
													{child.name}
												</Link>
											</li>
										))}
										<li>
											<Link
												to="/products"
												search={{ categoryId: parent.id }}
												className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
												onClick={() => setIsOpen(false)}
											>
												Tümünü Gör
											</Link>
										</li>
									</ul>
								</div>
							))}
						</div>

						{/* Alt Linkler */}
						<div className="space-y-4 border-t pt-8">
							<Link
								to="/"
								className="block text-sm transition-colors hover:text-primary"
								onClick={() => setIsOpen(false)}
							>
								Hakkımızda
							</Link>
							<Link
								to="/"
								className="block text-sm transition-colors hover:text-primary"
								onClick={() => setIsOpen(false)}
							>
								Kargo & İade
							</Link>
							<Link
								to="/"
								className="block text-sm transition-colors hover:text-primary"
								onClick={() => setIsOpen(false)}
							>
								İletişim
							</Link>
						</div>
					</nav>
				</div>

				{/* Footer Info Area */}
				<div className="space-y-4 border-t bg-secondary/20 p-6">
					<div className="flex gap-4">
						<a
							href="https://instagram.com"
							target="_blank"
							rel="noreferrer"
							className="rounded-full bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:text-primary"
						>
							<Instagram className="h-4 w-4" />
						</a>
						<a
							href="mailto:contact@raunkbutik.com"
							className="rounded-full bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:text-primary"
						>
							<Mail className="h-4 w-4" />
						</a>
						<a
							href="tel:+900000000000"
							className="rounded-full bg-background p-2 text-muted-foreground shadow-sm transition-colors hover:text-primary"
						>
							<Phone className="h-4 w-4" />
						</a>
					</div>
					<p className="text-[10px] text-muted-foreground uppercase tracking-widest">
						&copy; 2024 Raunk Butik. Tüm hakları saklıdır.
					</p>
				</div>
			</SheetContent>
		</Sheet>
	);
}
