import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import {
	ArrowLeft,
	Loader2,
	MessageSquare,
	Minus,
	Plus,
	Send,
	Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthPromptModal } from "@/components/auth-prompt-modal";
import { BackInStockModal } from "@/components/back-in-stock-modal";
import { Price } from "@/components/price";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { getColorHex } from "@/utils/colors";
import { orpc } from "@/utils/orpc";
import { seo } from "@/utils/seo";

export const Route = createFileRoute("/products/$slug")({
	loader: async ({ context, params }) => {
		const product = await context.queryClient.ensureQueryData(
			orpc.product.bySlug.queryOptions({
				input: { slug: params.slug },
			}),
		);
		if (!product) {
			throw notFound();
		}
		return { product };
	},
	notFoundComponent: () => {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center pt-28 text-center">
				<h1 className="font-bold font-serif text-4xl">Ürün Bulunamadı</h1>
				<p className="mt-4 text-muted-foreground">
					Aradığınız ürün mevcut değil veya kaldırılmış olabilir.
				</p>
				<Button className="mt-6">
					<Link to="/products" className="flex items-center">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Tüm Ürünlere Geri Dön
					</Link>
				</Button>
			</div>
		);
	},
	head: ({ loaderData }) => {
		const product = loaderData?.product;

		return {
			meta: seo({
				title: product?.name || "Ürün Bulunamadı",
				description: product?.description,
				image: product?.images?.[0],
				canonical: `https://raunkbutik.com/products/${product?.slug}`,
			}),
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Product",
						name: product?.name,
						description: product?.description,
						image: product?.images,
						offers: {
							"@type": "Offer",
							price: product?.price,
							priceCurrency: "TRY",
							availability:
								(product?.stock ?? 0) > 0
									? "https://schema.org/InStock"
									: "https://schema.org/OutOfStock",
						},
					}),
				},
			],
		};
	},
	component: ProductDetailPage,
});

function ProductDetailPage() {
	const { slug } = Route.useParams();
	const { product: initialProduct } = Route.useLoaderData();
	const { data: product, isLoading } = useQuery({
		...orpc.product.bySlug.queryOptions({
			input: { slug },
		}),
		initialData: initialProduct,
	});
	const {
		addItem,
		pendingItem,
		clearPendingItem,
		confirmAddItem,
		isAddingItem,
	} = useCart();
	const navigate = useNavigate();

	const session = authClient.useSession();
	const [isBackInStockOpen, setIsBackInStockOpen] = useState(false);

	const handleGuestContinue = async () => {
		try {
			await authClient.signIn.anonymous();
			confirmAddItem();
			clearPendingItem();
		} catch (error) {
			toast.error("Misafir girişi yapılamadı");
			console.error(error);
		}
	};

	const form = useForm({
		defaultValues: {
			quantity: 1,
			size: null as string | null,
			color: null as string | null,
		},
		onSubmit: async ({ value }) => {
			if (!product) return;

			if (!value.size && product.sizes && product.sizes.length > 0) {
				toast.error("Lütfen bir beden seçiniz");
				return;
			}
			if (!value.color && product.colors && product.colors.length > 0) {
				toast.error("Lütfen bir renk seçiniz");
				return;
			}

			// Check variant stock
			const selectedVariant = product.variants?.find(
				(v) => v.size === value.size && v.color === value.color,
			);

			if (selectedVariant && selectedVariant.stock < value.quantity) {
				toast.error("Seçili kombinasyon için yeterli stok yok");
				return;
			}

			addItem({
				productId: product.id,
				quantity: value.quantity,
				size: value.size || undefined,
				color: value.color || undefined,
			});
		},
	});

	const formValues = useStore(form.store, (state) => state.values);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!product) {
		return null; // Handled by notFoundComponent
	}

	const isSizeAvailable = (size: string) => {
		if (!product.variants) return true;
		const color = formValues.color;
		if (color) {
			const variant = product.variants.find(
				(v) => v.size === size && v.color === color,
			);
			return (variant?.stock ?? 0) > 0;
		}
		return product.variants.some((v) => v.size === size && (v.stock ?? 0) > 0);
	};

	const isColorAvailable = (color: string) => {
		if (!product.variants) return true;
		const size = formValues.size;
		if (size) {
			const variant = product.variants.find(
				(v) => v.size === size && v.color === color,
			);
			return (variant?.stock ?? 0) > 0;
		}
		return product.variants.some(
			(v) => v.color === color && (v.stock ?? 0) > 0,
		);
	};

	return (
		<div className="container mx-auto px-4 py-4 md:py-8">
			<Link
				to="/products"
				className="mb-4 inline-flex items-center gap-2 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground md:mb-6 md:text-sm"
			>
				<ArrowLeft className="h-3 w-3 md:h-4 md:w-4" /> Tüm Ürünler
			</Link>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
				{/* Image Carousel */}
				<div className="relative">
					<Carousel
						className="w-full"
						plugins={[
							Autoplay({
								delay: 4000,
							}),
						]}
					>
						<CarouselContent>
							{product.images.map((image, index) => (
								<CarouselItem key={image}>
									<div className="aspect-3/4 w-full overflow-hidden rounded-xl bg-muted/50 md:rounded-2xl">
										<img
											src={image}
											alt={`${product.name} - ${index + 1}`}
											className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
										/>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className="left-4 h-8 w-8 border-none bg-white/80 shadow-lg backdrop-blur-sm hover:bg-white md:h-12 md:w-12" />
						<CarouselNext className="right-4 h-8 w-8 border-none bg-white/80 shadow-lg backdrop-blur-sm hover:bg-white md:h-12 md:w-12" />
					</Carousel>
				</div>

				{/* Product Info */}
				<div className="space-y-10">
					{(product.deletedAt || !product.isActive) && (
						<div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-200/50">
									<Star className="h-5 w-5 text-amber-700" />
								</div>
								<h3 className="font-bold text-lg">Bu Ürün Satışta Değil</h3>
							</div>
							<p className="mt-3 text-amber-800/80 text-sm leading-relaxed">
								Bu ürün mağazamızdan kaldırılmış veya geçici olarak satışa
								kapatılmış olabilir. Diğer ürünlerimize göz atmak ister misiniz?
							</p>
							<Button
								variant="outline"
								className="mt-6 w-full rounded-2xl border-amber-200 bg-white/50 hover:bg-white"
								onClick={() => navigate({ to: "/products" })}
							>
								Tüm Ürünleri Gör
							</Button>
						</div>
					)}
					<div className="space-y-4">
						<h1 className="font-sans font-semibold text-4xl leading-tight tracking-tight md:text-6xl">
							{product.name}
						</h1>
						<div className="flex items-center gap-4">
							<Price
								amount={product.price}
								size="2xl"
								className="font-price font-semibold text-primary tracking-tight md:text-5xl"
							/>
						</div>
					</div>

					<Separator className="opacity-50" />

					<div className="space-y-4">
						<h3 className="font-sans font-semibold text-muted-foreground text-xs uppercase tracking-[0.2em] md:text-sm">
							Açıklama
						</h3>
						<p className="max-w-2xl text-muted-foreground/90 text-sm leading-relaxed md:text-lg">
							{product.description}
						</p>
					</div>

					{/* Variants */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-6 md:space-y-8"
					>
						<form.Subscribe selector={(state) => state.values}>
							{(values) => {
								const selectedVariant = product.variants?.find(
									(v) => v.size === values.size && v.color === values.color,
								);

								const availableStock = (() => {
									if (!product.variants || product.variants.length === 0) {
										return product.stock;
									}
									if (selectedVariant) {
										return selectedVariant.stock;
									}
									const matchingVariants = product.variants.filter(
										(v) =>
											(!values.size || v.size === values.size) &&
											(!values.color || v.color === values.color),
									);
									if (matchingVariants.length > 0) {
										return Math.max(...matchingVariants.map((v) => v.stock));
									}
									return 0;
								})();

								const isOutOfStock = availableStock <= 0;

								return (
									<>
										{product.sizes && product.sizes.length > 0 && (
											<form.Field name="size">
												{(field) => (
													<div className="space-y-3">
														<div className="flex items-center justify-between">
															<span className="font-sans font-semibold text-muted-foreground text-xs uppercase tracking-[0.2em] md:text-sm">
																Beden Seçin
															</span>
															{field.state.value && (
																<button
																	type="button"
																	className="font-montserrat text-[9px] text-muted-foreground uppercase tracking-widest underline underline-offset-4"
																	onClick={() => field.handleChange(null)}
																>
																	Temizle
																</button>
															)}
														</div>
														<div className="flex flex-wrap gap-2.5">
															{product.sizes?.map((size) => {
																const available = isSizeAvailable(size);
																return (
																	<button
																		type="button"
																		key={size}
																		disabled={!available}
																		onClick={() => field.handleChange(size)}
																		className={cn(
																			"relative flex h-14 min-w-[4rem] items-center justify-center border px-5 font-sans font-semibold text-sm uppercase tracking-widest transition-all duration-300 md:h-16 md:min-w-[4.5rem] md:text-base",
																			field.state.value === size
																				? "border-foreground bg-foreground text-background"
																				: available
																					? "border-border bg-background text-foreground hover:border-foreground"
																					: "border-muted/30 border-dashed bg-muted/5 text-muted-foreground/30",
																		)}
																	>
																		{size}
																		{!available && (
																			<div className="absolute inset-0 flex items-center justify-center overflow-hidden">
																				<div className="h-[0.5px] w-full rotate-45 bg-muted-foreground/10" />
																			</div>
																		)}
																	</button>
																);
															})}
														</div>
													</div>
												)}
											</form.Field>
										)}

										{product.colors && product.colors.length > 0 && (
											<form.Field name="color">
												{(field) => (
													<div className="space-y-3">
														<div className="flex items-center justify-between">
															<span className="font-sans font-semibold text-muted-foreground text-xs uppercase tracking-[0.2em] md:text-sm">
																Renk Seçin
															</span>
															{field.state.value && (
																<button
																	type="button"
																	className="font-montserrat text-[9px] text-muted-foreground uppercase tracking-widest underline underline-offset-4"
																	onClick={() => field.handleChange(null)}
																>
																	Temizle
																</button>
															)}
														</div>
														<div className="flex flex-wrap gap-2.5">
															{product.colors?.map((color) => {
																const available = isColorAvailable(color);
																return (
																	<button
																		type="button"
																		key={color}
																		disabled={!available}
																		onClick={() => field.handleChange(color)}
																		className={cn(
																			"relative flex h-14 items-center justify-center border px-6 font-sans font-semibold text-sm uppercase tracking-widest transition-all duration-300 md:h-16 md:text-base",
																			field.state.value === color
																				? "border-foreground bg-foreground text-background"
																				: available
																					? "border-border bg-background text-foreground hover:border-foreground"
																					: "border-muted/30 border-dashed bg-muted/5 text-muted-foreground/30",
																		)}
																	>
																		<div className="flex items-center gap-2">
																			<div
																				className="h-3 w-3 rounded-full border border-white/20 shadow-sm"
																				style={{
																					backgroundColor: getColorHex(color),
																				}}
																			/>
																			<span>{color}</span>
																		</div>
																		{!available && (
																			<div className="absolute inset-0 flex items-center justify-center overflow-hidden">
																				<div className="h-[0.5px] w-full rotate-45 bg-muted-foreground/10" />
																			</div>
																		)}
																	</button>
																);
															})}
														</div>
													</div>
												)}
											</form.Field>
										)}

										{selectedVariant && availableStock > 0 && (
											<div
												className={cn(
													"flex items-center gap-3 border-l-2 p-3 font-medium transition-all duration-300",
													availableStock <= 5
														? "border-amber-500 bg-amber-50/50 text-amber-900"
														: "border-primary bg-primary/5 text-primary",
												)}
											>
												<span className="font-sans font-semibold text-xs uppercase tracking-widest md:text-sm">
													{availableStock <= 5 ? (
														<>
															Sadece{" "}
															<strong className="text-amber-600">
																{availableStock} adet
															</strong>{" "}
															kaldı!
														</>
													) : (
														<>
															Stokta <strong>{availableStock}</strong> seçenek
															mevcut.
														</>
													)}
												</span>
											</div>
										)}

										{product.deletedAt ||
										!product.isActive ? null : product.stock > 0 ? (
											<div className="flex flex-col gap-6 pt-4">
												<form.Field name="quantity">
													{(field) => (
														<div className="flex h-12 items-center justify-between border-border border-b">
															<span className="font-sans font-semibold text-muted-foreground text-xs uppercase tracking-[0.2em] md:text-sm">
																Miktar
															</span>
															<div className="flex items-center gap-8">
																<button
																	type="button"
																	className="text-muted-foreground transition-all hover:text-foreground disabled:opacity-30"
																	onClick={() =>
																		field.handleChange(
																			Math.max(1, field.state.value - 1),
																		)
																	}
																	disabled={field.state.value <= 1}
																>
																	<Minus className="h-3.5 w-3.5" />
																</button>
																<span className="min-w-[1rem] text-center font-montserrat font-semibold text-xs">
																	{field.state.value}
																</span>
																<button
																	type="button"
																	className="text-muted-foreground transition-all hover:text-foreground disabled:opacity-30"
																	onClick={() =>
																		field.handleChange(
																			Math.min(
																				availableStock,
																				field.state.value + 1,
																			),
																		)
																	}
																	disabled={field.state.value >= availableStock}
																>
																	<Plus className="h-3.5 w-3.5" />
																</button>
															</div>
														</div>
													)}
												</form.Field>

												<Button
													size="lg"
													className="h-16 w-full rounded-none bg-foreground font-sans font-semibold text-background text-sm uppercase tracking-[0.3em] transition-all hover:bg-foreground/90 active:scale-[0.98] md:h-20 md:text-base"
													type="submit"
													disabled={isAddingItem || isOutOfStock}
												>
													{isAddingItem ? (
														<Loader2 className="h-4 w-4 animate-spin" />
													) : isOutOfStock ? (
														"Stokta Yok"
													) : (
														"Sepete Ekle"
													)}
												</Button>
											</div>
										) : (
											<div className="pt-4">
												<Button
													size="lg"
													type="button"
													variant="outline"
													className="h-14 w-full rounded-none border-dashed font-medium font-montserrat text-[11px] uppercase tracking-widest"
													onClick={() => setIsBackInStockOpen(true)}
												>
													Gelince Haber Ver
												</Button>
											</div>
										)}
									</>
								);
							}}
						</form.Subscribe>
					</form>

					{/* Reviews */}
					<div className="mt-16 space-y-10">
						<div className="flex items-center justify-between border-b pb-6">
							<h3 className="font-bold font-serif text-xl tracking-tight md:text-3xl">
								Ürün Yorumları ({product.reviews.length})
							</h3>
						</div>

						{/* Add Review Section */}
						<ReviewForm productId={product.id} slug={product.slug} />

						<div className="space-y-8">
							{product.reviews.length === 0 ? (
								<div className="rounded-2xl border-2 border-dashed p-12 text-center">
									<MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
									<p className="text-lg text-muted-foreground">
										Bu ürün için henüz yorum yapılmamış. İlk yorumu siz yapın!
									</p>
								</div>
							) : (
								product.reviews.map((review) => (
									<div
										key={review.id}
										className="group relative rounded-2xl bg-muted/30 p-6 transition-colors hover:bg-muted/50"
									>
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
													{review.user?.name?.[0] || "A"}
												</div>
												<div>
													<p className="font-bold text-lg">
														{review.user?.name || "Anonim"}
													</p>
													<div className="flex items-center gap-2 text-muted-foreground text-xs italic">
														<span>
															{new Date(review.createdAt).toLocaleDateString(
																"tr-TR",
																{
																	year: "numeric",
																	month: "long",
																	day: "numeric",
																},
															)}
														</span>
													</div>
												</div>
											</div>
											<div className="flex gap-0.5 text-yellow-400">
												{[1, 2, 3, 4, 5].map((star) => (
													<Star
														key={star}
														className={cn(
															"h-4 w-4",
															star <= review.rating
																? "fill-current"
																: "text-gray-200",
														)}
													/>
												))}
											</div>
										</div>
										<p className="mt-4 text-muted-foreground text-sm leading-relaxed outline-none">
											{review.comment}
										</p>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>

			<AuthPromptModal
				isOpen={!!pendingItem}
				onClose={clearPendingItem}
				onGuestContinue={handleGuestContinue}
				onSignIn={() => {
					clearPendingItem();
					navigate({ to: "/login" });
				}}
			/>

			<BackInStockModal
				isOpen={isBackInStockOpen}
				onClose={() => setIsBackInStockOpen(false)}
				productId={product.id}
				productName={product.name}
				selectedSize={form.state.values.size}
				selectedColor={form.state.values.color}
				userEmail={session.data?.user.email}
			/>
		</div>
	);
}

function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
	const queryClient = useQueryClient();
	const session = authClient.useSession();
	const [rating, setRating] = useState(0);
	const [hoverRating, setHoverRating] = useState(0);
	const [comment, setComment] = useState("");
	const [showForm, setShowForm] = useState(false);

	const { data: canReviewData } = useQuery({
		...orpc.product.canReview.queryOptions({
			input: { productId },
		}),
		enabled: !!session.data,
	});

	const addReviewMutation = useMutation(
		orpc.product.addReview.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.product.bySlug.queryKey({ input: { slug } }),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.product.canReview.queryKey({ input: { productId } }),
				});
				toast.success(
					"Yorumunuz başarıyla iletildi. Onaylandıktan sonra görünecektir.",
				);
				setRating(0);
				setComment("");
				setShowForm(false);
			},
			onError: (error) => {
				toast.error(error.message || "Yorum gönderilirken bir hata oluştu");
			},
		}),
	);

	if (!session.data) {
		return (
			<Card className="group border-2 border-primary/10 bg-primary/5 shadow-none transition-all hover:border-primary/20">
				<CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-lg transition-transform group-hover:scale-110">
						<MessageSquare className="h-7 w-7 text-primary" />
					</div>
					<div className="flex-1 space-y-1">
						<h4 className="font-bold text-lg">Bu ürünü kullandınız mı?</h4>
						<p className="text-muted-foreground text-sm">
							Görüşleriniz diğer alıcılar için çok değerli. Yorum yapmak için
							giriş yapın.
						</p>
					</div>
					<Button className="h-12 px-8 font-bold shadow-lg">
						<Link to="/login">Giriş Yap</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const canReview = canReviewData?.canReview ?? false;
	const reason = canReviewData?.reason;

	const disabledLabel =
		reason === "already_reviewed"
			? "Bu ürün için zaten bir yorum bıraktınız"
			: null;

	if (!showForm) {
		return (
			<div className="space-y-2">
				<Button
					variant="outline"
					className="h-16 w-full gap-3 border-2 border-primary/20 border-dashed bg-background font-bold text-lg text-primary transition-all hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
					onClick={() => setShowForm(true)}
					disabled={!canReview}
				>
					<Star className="h-6 w-6 fill-primary" />
					Değerlendirme Yap ve Yorum Bırak
				</Button>
				{disabledLabel && (
					<p className="text-center text-muted-foreground text-sm">
						{disabledLabel}
					</p>
				)}
			</div>
		);
	}

	return (
		<Card className="overflow-hidden border-2 shadow-xl ring-4 ring-primary/5">
			<CardHeader className="bg-muted/30 pb-4">
				<CardTitle className="text-xl">Yorumunuzu Yazın</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6 pt-6">
				<div className="space-y-3">
					<p className="font-bold text-sm uppercase tracking-wider">Puanınız</p>
					<div className="flex gap-2">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								className="group relative transition-transform active:scale-90"
								onMouseEnter={() => setHoverRating(star)}
								onMouseLeave={() => setHoverRating(0)}
								onClick={() => setRating(star)}
							>
								<Star
									className={cn(
										"h-10 w-10 transition-all duration-300",
										(hoverRating || rating) >= star
											? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]"
											: "text-muted-foreground/30 hover:text-muted-foreground/50",
									)}
								/>
							</button>
						))}
					</div>
				</div>

				<div className="space-y-3">
					<label
						htmlFor="comment-input"
						className="font-bold text-sm uppercase tracking-wider"
					>
						Mesajınız
					</label>
					<Textarea
						id="comment-input"
						placeholder="Ürün hakkındaki düşüncelerinizi paylaşın..."
						className="min-h-[140px] resize-none border-2 p-4 text-lg focus:ring-4"
						value={comment}
						onChange={(e) => setComment(e.target.value)}
					/>
				</div>

				<div className="flex gap-4">
					<Button
						variant="ghost"
						className="h-14 flex-1 font-bold text-lg"
						onClick={() => setShowForm(false)}
						disabled={addReviewMutation.isPending}
					>
						Vazgeç
					</Button>
					<Button
						className="h-14 flex-2 gap-3 bg-primary font-bold text-lg shadow-primary/20 shadow-xl"
						disabled={rating === 0 || addReviewMutation.isPending}
						onClick={() =>
							addReviewMutation.mutate({
								productId,
								rating,
								comment,
							})
						}
					>
						Yorumu Gönder
						<Send className="h-5 w-5" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
