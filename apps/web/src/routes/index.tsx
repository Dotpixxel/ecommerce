import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, Star } from "lucide-react";
import React from "react";
import { Price } from "@/components/price";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { orpc } from "@/utils/orpc";
import { seo } from "@/utils/seo";

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		const campaigns = await context.queryClient.ensureQueryData(
			orpc.campaign.getActive.queryOptions({}),
		);
		const productData = await context.queryClient.ensureQueryData(
			orpc.product.list.queryOptions({
				input: { limit: 8 },
			}),
		);
		const categories = await context.queryClient.ensureQueryData(
			orpc.product.getCategories.queryOptions({}),
		);

		return {
			campaigns,
			productData,
			categories,
		};
	},
	head: ({ loaderData }) => {
		const firstCampaign = loaderData?.campaigns?.[0];
		return {
			meta: [
				...seo({
					title: firstCampaign?.title || "Raunk Butik",
					description:
						firstCampaign?.description ||
						"Raunk Butik - Modern silüetler ve zamansız parçalarla stilinizi yenileyin. En yeni moda trendleri, elbiseler ve aksesuarlar.",
					image: firstCampaign?.imageUrl || undefined,
				}),
			],
		};
	},
	component: HomeComponent,
});

// Placeholder ürünler — gerçek ürün yokken gösterilir
const PLACEHOLDER_PRODUCTS = [
	{
		id: "p1",
		name: "Yeni Sezon Elbise",
		price: 1299,
		slug: "",
		image:
			"https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=600&auto=format&fit=crop",
	},
	{
		id: "p2",
		name: "Yazlık Bluz",
		price: 649,
		slug: "",
		image:
			"https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=600&auto=format&fit=crop",
	},
	{
		id: "p3",
		name: "Elegant Tunik",
		price: 899,
		slug: "",
		image:
			"https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=600&auto=format&fit=crop",
	},
	{
		id: "p4",
		name: "Klasik Ceket",
		price: 1899,
		slug: "",
		image:
			"https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=600&auto=format&fit=crop",
	},
	{
		id: "p5",
		name: "Midi Etek",
		price: 749,
		slug: "",
		image:
			"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=600&auto=format&fit=crop",
	},
	{
		id: "p6",
		name: "Piliseli Pantolon",
		price: 999,
		slug: "",
		image:
			"https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop",
	},
	{
		id: "p7",
		name: "Keten Gömlek",
		price: 589,
		slug: "",
		image:
			"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop",
	},
	{
		id: "p8",
		name: "Trench Coat",
		price: 2499,
		slug: "",
		image:
			"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop",
	},
];

const CATEGORY_IMAGES: Record<string, string> = {
	Kadın:
		"https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
	"Dış Giyim":
		"https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=800&auto=format&fit=crop",
	Elbise:
		"https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800&auto=format&fit=crop",
	Bluz: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=800&auto=format&fit=crop",
	Pantolon:
		"https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop",
	Aksesuar:
		"https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
	default:
		"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop",
};

const PLACEHOLDER_CAMPAIGNS = [
	{
		id: "c1",
		title: "Yeni Sezon",
		description: "Modern silüetler ve zamansız parçalarla stilinizi yenileyin.",
		imageUrl:
			"https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop",
		showTitle: true,
		showDescription: true,
		showButton: true,
	},
	{
		id: "c2",
		title: "Zarafetin Adresi",
		description: "Özel tasarım koleksiyonlarımızla farkınızı ortaya koyun.",
		imageUrl:
			"https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop",
		showTitle: true,
		showDescription: true,
		showButton: true,
	},
	{
		id: "c3",
		title: "Sokak Modası",
		description: "Konfor ve şıklığı bir araya getiren günlük kombinler.",
		imageUrl:
			"https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600&auto=format&fit=crop",
		showTitle: true,
		showDescription: true,
		showButton: true,
	},
];

function HomeComponent() {
	const loaderData = Route.useLoaderData();

	const { data: activeCampaigns = [] } = useQuery({
		...orpc.campaign.getActive.queryOptions({}),
		initialData: loaderData.campaigns,
	});

	const { data: productData } = useQuery({
		...orpc.product.list.queryOptions({
			input: { limit: 8 },
		}),
		initialData: loaderData.productData,
	});

	const { data: categories = [] } = useQuery({
		...orpc.product.getCategories.queryOptions({}),
		initialData: loaderData.categories,
	});

	const { data: siteSettings } = useQuery(
		orpc.settings.getPublicSettings.queryOptions(),
	);

	const featuredProducts = productData?.items ?? [];
	const hasProducts = featuredProducts.length > 0;
	const heroCampaigns =
		activeCampaigns.length > 0 ? activeCampaigns : PLACEHOLDER_CAMPAIGNS;

	return (
		<div className="flex flex-col gap-20 pb-20">
			{/* ─── Hero ─── */}
			<section className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
				<Carousel
					className="h-full w-full"
					plugins={[Autoplay({ delay: 5000 })]}
				>
					<CarouselContent className="h-full">
						{heroCampaigns.map((campaign) => (
							<CarouselItem key={campaign.id} className="h-full">
								<div className="relative h-full w-full">
									{campaign.imageUrl ? (
										<img
											src={campaign.imageUrl}
											alt={campaign.title}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="h-full w-full bg-gradient-to-br from-stone-900 to-stone-700" />
									)}
									{/* 
										If all text/buttons are hidden, remove the dark overlay 
										(campaign might have these fields as undefined for a moment if coming from cache/old data, 
										so we default to true to preserve existing behavior)
									*/}
									{(campaign.showTitle !== false ||
										campaign.showDescription !== false ||
										campaign.showButton !== false) && (
										<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
									)}

									{(campaign.showTitle !== false ||
										campaign.showDescription !== false ||
										campaign.showButton !== false) && (
										<div className="absolute inset-0 z-10 flex items-center justify-center">
											<div className="space-y-4 px-4 text-center text-white antialiased">
												{campaign.showTitle !== false && (
													<h1 className="font-bold font-serif text-3xl uppercase tracking-wider drop-shadow-md md:text-5xl">
														{campaign.title}
													</h1>
												)}
												{campaign.showDescription !== false && (
													<p className="mx-auto max-w-2xl font-light text-sm tracking-wide opacity-90 md:text-base">
														{campaign.description}
													</p>
												)}
												{campaign.showButton !== false && (
													<Link
														to="/products"
														className="inline-block border border-white/80 bg-white/10 px-10 py-4 font-medium text-sm uppercase tracking-widest backdrop-blur-sm transition-all hover:bg-white hover:text-black"
													>
														Hemen Keşfet
													</Link>
												)}
											</div>
										</div>
									)}
								</div>
							</CarouselItem>
						))}
					</CarouselContent>
					{heroCampaigns.length > 1 && (
						<>
							<CarouselPrevious className="left-4 border-none bg-black/20 text-white hover:bg-black/40 lg:left-8" />
							<CarouselNext className="right-4 border-none bg-black/20 text-white hover:bg-black/40 lg:right-8" />
						</>
					)}
				</Carousel>
			</section>

			{/* ─── Öne Çıkan Kategoriler ─── */}
			{categories.length > 0 && (
				<section className="container mx-auto px-4">
					<p className="mb-2 font-light text-muted-foreground text-sm uppercase tracking-[0.25em]">
						{siteSettings?.homepage_categories_subtitle || "Kategoriler"}
					</p>
					<h2 className="font-serif text-3xl text-foreground md:text-4xl">
						{siteSettings?.homepage_categories_title || "Tarzınızı Keşfedin"}
					</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						{categories.slice(0, 3).map((category) => {
							const imageUrl =
								category.imageUrl ||
								CATEGORY_IMAGES[category.name] ||
								CATEGORY_IMAGES.default;
							return (
								<Link
									key={category.id}
									to="/products"
									search={{ categoryId: category.id }}
									className="group relative aspect-[3/4] cursor-pointer overflow-hidden"
								>
									<img
										src={imageUrl}
										alt={category.name}
										className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-all group-hover:from-black/70" />
									<div className="absolute inset-0 flex items-end p-8">
										<div>
											<h3 className="font-serif text-2xl text-white">
												{category.name}
											</h3>
											<span className="mt-2 flex translate-y-2 items-center gap-2 font-light text-sm text-white/80 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
												Keşfet <ArrowRight className="h-4 w-4" />
											</span>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				</section>
			)}

			{/* ─── Öne Çıkan Ürünler ─── */}
			<section className="container mx-auto space-y-12 px-4">
				<div className="space-y-3 text-center">
					<p className="font-light text-muted-foreground text-sm uppercase tracking-[0.25em]">
						{siteSettings?.homepage_products_subtitle || "Koleksiyon"}
					</p>
					<h2 className="font-bold font-serif text-3xl text-foreground md:text-4xl">
						{siteSettings?.homepage_products_title || "Öne Çıkanlar"}
					</h2>
					<div className="mx-auto h-px w-16 bg-primary/40" />
				</div>

				<div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
					{hasProducts
						? featuredProducts.map((product) => (
								<Link
									key={product.id}
									to="/products/$slug"
									params={{ slug: product.slug }}
									className="group cursor-pointer space-y-4"
								>
									<div className="relative aspect-[3/4] overflow-hidden bg-muted">
										<img
											src={product.images[0] || PLACEHOLDER_PRODUCTS[0].image}
											alt={product.name}
											className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
										{product.stock <= 3 && product.stock > 0 && (
											<span className="absolute top-3 left-3 bg-destructive px-2 py-1 font-bold text-[10px] text-white uppercase tracking-wide">
												Son {product.stock} Adet
											</span>
										)}
										{product.stock === 0 && (
											<div className="absolute inset-0 flex items-center justify-center bg-black/40">
												<span className="border border-white/60 px-4 py-1.5 font-medium text-white text-xs uppercase tracking-widest">
													Tükendi
												</span>
											</div>
										)}
									</div>
									<div className="space-y-1 text-center">
										<h3 className="font-medium text-sm tracking-tight transition-colors group-hover:text-primary">
											{product.name}
										</h3>
										<div className="flex justify-center">
											<Price
												amount={product.price}
												size="lg"
												className="text-primary/90"
											/>
										</div>
									</div>
								</Link>
							))
						: /* Ürün yoksa placeholder kartlar */
							PLACEHOLDER_PRODUCTS.map((p) => (
								<Link
									key={p.id}
									to="/products"
									className="group cursor-pointer space-y-4"
								>
									<div className="relative aspect-[3/4] overflow-hidden bg-muted">
										<img
											src={p.image}
											alt={p.name}
											className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
										/>
										<div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
											<span className="border border-white/70 px-6 py-2 font-medium text-white text-xs uppercase tracking-widest backdrop-blur-sm">
												İncele
											</span>
										</div>
									</div>
									<div className="space-y-1 text-center">
										<h3 className="font-medium text-sm tracking-tight transition-colors group-hover:text-primary">
											{p.name}
										</h3>
										<div className="flex justify-center">
											<Price
												amount={p.price}
												size="lg"
												className="text-primary/90"
											/>
										</div>
									</div>
								</Link>
							))}
				</div>

				<div className="flex justify-center">
					<Link
						to="/products"
						className="flex items-center gap-2 border-primary border-b pb-1 font-medium text-primary text-sm uppercase tracking-widest transition-all hover:gap-4"
					>
						Tüm Ürünleri Gör <ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</section>

			{/* ─── Editorial Banner ─── */}
			<section className="container mx-auto px-4">
				<div className="relative overflow-hidden">
					<img
						src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop&crop=top"
						alt="Raunk Butik Editorial"
						className="h-[400px] w-full object-cover object-top md:h-[500px]"
					/>
					<div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
					<div className="absolute inset-0 flex items-center px-10 md:px-20">
						<div className="max-w-sm space-y-6 text-white">
							<p className="font-light text-xs uppercase tracking-[0.3em] opacity-80">
								{siteSettings?.editorial_subtitle || "Özel Koleksiyon"}
							</p>
							<h2 className="font-serif text-3xl leading-tight md:text-4xl">
								{(siteSettings?.editorial_title || "Zarafetin\nYeni Adresi")
									.split("\n")
									.map((line, i) => (
										<React.Fragment
											// biome-ignore lint/suspicious/noArrayIndexKey: Static editorial title lines
											key={`${line}-${i}`}
										>
											{line}
											{i !==
												(
													siteSettings?.editorial_title ||
													"Zarafetin\nYeni Adresi"
												).split("\n").length -
													1 && <br />}
										</React.Fragment>
									))}
							</h2>
							<p className="font-light text-sm leading-relaxed opacity-85">
								{siteSettings?.editorial_desc ||
									"Tasarımcı parçalar ve özenle seçilmiş koleksiyonlarla kendinizi ifade edin."}
							</p>
							<Link
								to="/products"
								className="inline-flex items-center gap-2 border-white/60 border-b pb-1 font-medium text-sm uppercase tracking-widest transition-all hover:gap-4"
							>
								Alışverişe Başla <ArrowRight className="h-4 w-4" />
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ─── Müşteri Yorumları (static sosyal kanıt) ─── */}
			<section className="container mx-auto px-4">
				<div className="mb-10 text-center">
					<h2 className="font-serif text-2xl text-foreground">
						{siteSettings?.homepage_testimonials_title ||
							"Müşterilerimiz ne diyor?"}
					</h2>
				</div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{[
						{
							name: "Ayşe K.",
							text: "Kumaş kalitesi gerçekten çok iyi. Kargo da çok hızlı geldi. Kesinlikle tavsiye ederim.",
							rating: 5,
						},
						{
							name: "Merve T.",
							text: "Elbisenin dikişleri ve kesimi çok güzel. Fotoğraftakinin aynısı. Bir daha alışveriş yapacağım.",
							rating: 5,
						},
						{
							name: "Selin A.",
							text: "Beden seçimi tam doğru çıktı. İade politikası da çok pratik. Harika bir alışveriş deneyimi.",
							rating: 5,
						},
					].map(({ name, text, rating }) => (
						<div
							key={name}
							className="space-y-4 rounded-sm border bg-background p-6 shadow-sm"
						>
							<div className="flex gap-1">
								{Array.from({ length: rating }).map((_, i) => (
									<Star
										// biome-ignore lint/suspicious/noArrayIndexKey: Static rating display
										key={`${name}-star-${i}`}
										className="h-4 w-4 fill-yellow-400 text-yellow-400"
									/>
								))}
							</div>
							<p className="font-light text-muted-foreground text-sm leading-relaxed">
								"{text}"
							</p>
							<p className="font-semibold text-sm">{name}</p>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
