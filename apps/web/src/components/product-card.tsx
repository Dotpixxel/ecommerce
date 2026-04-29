import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { getColorHex } from "@/utils/colors";
import { orpc } from "@/utils/orpc";
import { AuthPromptModal } from "./auth-prompt-modal";
import { Price } from "./price";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

// Define strict interface for Product to avoid type issues
export interface Product {
	id: string;
	name: string;
	slug: string;
	price: number;
	images: string[];
	brand?: string | null;
	categoryId?: string | null;
	sizes?: string[] | null;
	colors?: string[] | null;
	stock: number;
	createdAt: Date | string;
}

interface ProductCardProps {
	product: Product;
	className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
	const { addItem } = useCart();
	const [isAdding, setIsAdding] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const { data: session } = authClient.useSession();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { data: wishlistData } = useQuery({
		...orpc.wishlist.check.queryOptions({
			input: { productId: product.id },
		}),
		enabled: !!session?.user,
	});

	const toggleWishlistMutation = useMutation(
		orpc.wishlist.toggle.mutationOptions({
			onSuccess: (res) => {
				queryClient.invalidateQueries({
					queryKey: orpc.wishlist.check.queryKey({
						input: { productId: product.id },
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.wishlist.list.queryKey(),
				});
				toast.success(
					res.status === "added"
						? "Favorilere eklendi"
						: "Favorilerden çıkarıldı",
				);
			},
			onError: () => {
				toast.error("İşlem gerçekleştirilemedi");
			},
		}),
	);

	const handleWishlistToggle = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!session?.user) {
			setShowAuthModal(true);
			return;
		}

		toggleWishlistMutation.mutate({ productId: product.id });
	};

	if (!product)
		return (
			<Card className="flex h-full w-full items-center justify-center border-none bg-transparent p-12 text-muted-foreground shadow-none">
				Ürün bulunamadı
			</Card>
		);

	const isNew =
		Date.now() - new Date(product.createdAt).getTime() <
		7 * 24 * 60 * 60 * 1000; // 7 days
	const isOutOfStock = product.stock <= 0;

	const handleQuickAdd = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsAdding(true);
		try {
			await addItem({
				productId: product.id,
				quantity: 1,
				size: product.sizes?.[0], // Default to first size
				color: product.colors?.[0], // Default to first color
			});
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<div className={cn("group relative space-y-3", className)}>
			<Link
				to="/products/$slug"
				params={{ slug: product.slug }}
				className="block"
			>
				{/* Image Container */}
				<div className="relative aspect-3/4 overflow-hidden rounded-xl bg-gray-100">
					{product.images?.[0] ? (
						<img
							src={product.images[0]}
							alt={product.name}
							className={cn(
								"h-full w-full object-cover transition-all duration-500",
								product.images[1]
									? "md:group-hover:opacity-0"
									: "md:group-hover:scale-105",
								isOutOfStock && "brightness-75 contrast-110 grayscale",
							)}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-secondary/30 text-muted-foreground">
							No image
						</div>
					)}

					{/* Second Image on Hover */}
					{product.images?.[1] && (
						<img
							src={product.images[1]}
							alt={product.name}
							className={cn(
								"absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 md:group-hover:opacity-100",
								isOutOfStock && "brightness-75 contrast-110 grayscale",
							)}
						/>
					)}

					{/* Badges */}
					<div className="absolute top-3 left-3 flex flex-col gap-1.5">
						{isOutOfStock ? (
							<Badge
								variant="destructive"
								className="rounded-sm px-2 py-0.5 font-medium text-xs uppercase tracking-wider"
							>
								Tükendi
							</Badge>
						) : isNew ? (
							<Badge className="rounded-sm bg-blue-600 px-2 py-0.5 font-medium text-white text-xs uppercase tracking-wider hover:bg-blue-700">
								Yeni
							</Badge>
						) : null}
					</div>

					{/* Wishlist Toggle */}
					<button
						type="button"
						onClick={handleWishlistToggle}
						className={cn(
							"absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-md transition-all hover:scale-110 active:scale-95",
							wishlistData?.isInWishlist
								? "text-red-500"
								: "text-gray-400 hover:text-red-400",
						)}
					>
						{toggleWishlistMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Heart
								className={cn(
									"h-5 w-5",
									wishlistData?.isInWishlist && "fill-current",
								)}
							/>
						)}
					</button>

					{/* Quick Actions Overlay (Desktop) */}
					<div className="absolute right-4 bottom-4 left-4 hidden translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:block">
						<Button
							className="w-full gap-2 font-medium shadow-sm transition-all hover:shadow-md"
							size="sm"
							disabled={isOutOfStock || isAdding}
							onClick={handleQuickAdd}
						>
							{isAdding ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<ShoppingBag className="h-4 w-4" />
							)}
							{isOutOfStock ? "Stokta Yok" : "Hızlı Ekle"}
						</Button>
					</div>
				</div>
			</Link>

			{/* Info */}
			<div className="space-y-1.5">
				<div className="flex flex-col gap-1">
					<div className="flex items-start justify-between gap-2.5">
						<Link
							to="/products/$slug"
							params={{ slug: product.slug }}
							className="group/title block flex-1"
						>
							{product.brand && (
								<p className="mb-0.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
									{product.brand}
								</p>
							)}
							<h3 className="font-medium text-[13px] text-foreground/90 leading-snug transition-colors group-hover/title:text-primary md:text-sm">
								{product.name}
							</h3>
						</Link>
						<div className="mt-0.5 shrink-0">
							<Price
								amount={product.price}
								size="md"
								className="font-medium font-price text-primary/90 md:text-lg"
							/>
						</div>
					</div>
				</div>

				{/* Variants Preview */}
				{product.colors && product.colors.length > 0 && (
					<div className="flex gap-1 pt-1">
						{product.colors.slice(0, 3).map((color) => (
							<div
								key={color}
								className="h-3 w-3 rounded-full border border-border shadow-sm"
								style={{ backgroundColor: getColorHex(color) }}
								title={color}
							/>
						))}
						{product.colors.length > 3 && (
							<span className="text-[10px] text-muted-foreground">
								+{product.colors.length - 3}
							</span>
						)}
					</div>
				)}
			</div>
			<AuthPromptModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				onSignIn={() => {
					setShowAuthModal(false);
					navigate({ to: "/login" });
				}}
				title="Favorilere Eklemek İçin Giriş Yapın"
				description="Beğendiğiniz ürünleri favorilerinize ekleyip daha sonra kolayca bulabilirsiniz."
			/>
		</div>
	);
}
