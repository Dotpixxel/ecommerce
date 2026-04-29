import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Loader2 } from "lucide-react";
import { type Product, ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/favorites")({
	component: FavoritesPage,
});

function FavoritesPage() {
	const { data: favorites, isLoading } = useQuery(
		orpc.wishlist.list.queryOptions(),
	);

	if (isLoading) {
		return (
			<div className="flex h-[400px] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-12">
			<div className="mb-12 text-center">
				<h1 className="font-bold text-4xl tracking-tight">Favorilerim</h1>
				<p className="mt-2 text-lg text-muted-foreground">
					Beğendiğiniz ürünlere buradan ulaşabilirsiniz.
				</p>
			</div>

			{!favorites || favorites.length === 0 ? (
				<div className="py-20 text-center">
					<div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
						<Heart className="h-10 w-10 text-muted-foreground/40" />
					</div>
					<h3 className="font-bold text-2xl">Favori ürününüz bulunmuyor</h3>
					<p className="mt-2 text-lg text-muted-foreground">
						Alışverişe başlayın ve beğendiğiniz ürünleri favorilerinize ekleyin.
					</p>
					<Button className="mt-8 h-12 px-8 font-bold shadow-lg">
						<Link to="/">Alışverişe Başla</Link>
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
					{favorites.map((item) => (
						<ProductCard key={item.id} product={item.product as Product} />
					))}
				</div>
			)}
		</div>
	);
}
