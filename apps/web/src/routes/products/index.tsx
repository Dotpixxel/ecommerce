import type { InferRouterOutputs } from "@orpc/server";
import type { appRouter } from "@raunk-butik/api/routers/index";
import { useForm } from "@tanstack/react-form";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, Loader2, SortAsc } from "lucide-react";
import * as React from "react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { z } from "zod";
import { ProductCard } from "@/components/product-card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getColorHex } from "@/utils/colors";
import { orpc } from "@/utils/orpc";
import { seo } from "@/utils/seo";
import { type BaseNode, buildTree, type TreeNode } from "@/utils/tree";

const productSearchSchema = z.object({
	categoryId: z.string().optional(),
	brands: z.array(z.string()).catch([]).optional(),
	colors: z.array(z.string()).catch([]).optional(),
	sizes: z.array(z.string()).catch([]).optional(),
	minPrice: z.coerce.number().optional(),
	maxPrice: z.coerce.number().optional(),
	q: z.string().optional(),
	sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});

type ProductSearch = z.infer<typeof productSearchSchema>;

type RouterOutput = InferRouterOutputs<typeof appRouter>;
type CategoriesOutput = RouterOutput["product"]["getCategories"];

export const Route = createFileRoute("/products/")({
	validateSearch: (search) => productSearchSchema.parse(search),
	loaderDeps: ({ search }) => ({ search }),
	loader: async ({ deps, context }) => {
		const categories = await context.queryClient.ensureQueryData(
			orpc.product.getCategories.queryOptions({
				input: { id: deps.search.categoryId },
			}),
		);
		return {
			search: deps.search,
			categoryName:
				deps.search.categoryId && categories.length > 0
					? categories[0].name
					: null,
		};
	},
	head: ({ loaderData }) => {
		const categoryTitle = loaderData?.categoryName;
		const displayTitle = categoryTitle || "Tüm Ürünler";

		return {
			meta: [
				...seo({
					title: `${displayTitle} | Raunk Butik`,
					description: categoryTitle
						? `Raunk Butik ${categoryTitle} koleksiyonunu keşfedin. En şık ${categoryTitle.toLowerCase()} modelleri ve fiyatları.`
						: "Raunk Butik ürün kataloğu. En yeni elbiseler, ceketler, pantolonlar ve aksesuarları keşfedin.",
				}),
			],
		};
	},
	component: ProductsPage,
});

function ProductsPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const { ref, inView } = useInView();

	const { data: categories } = useQuery(
		orpc.product.getCategories.queryOptions({}),
	);

	const categoryTree = categories
		? buildTree(
				categories as (Omit<CategoriesOutput[number], "children"> & BaseNode)[],
			)
		: [];
	const { data: filterOptions } = useQuery(
		orpc.product.getFilters.queryOptions({}),
	);

	const form = useForm({
		defaultValues: {
			categoryId: search.categoryId,
			brands: search.brands || [],
			colors: search.colors || [],
			sizes: search.sizes || [],
			minPrice: search.minPrice?.toString() ?? "",
			maxPrice: search.maxPrice?.toString() ?? "",
			priceRange: [search.minPrice ?? 0, search.maxPrice ?? 10000] as [
				number,
				number,
			],
			q: search.q || "",
		},
	});

	// Synchronize form with URL when URL changes (e.g. back button)
	useEffect(() => {
		form.setFieldValue("categoryId", search.categoryId);
		form.setFieldValue("brands", search.brands || []);
		form.setFieldValue("colors", search.colors || []);
		form.setFieldValue("sizes", search.sizes || []);
		form.setFieldValue("minPrice", search.minPrice?.toString() ?? "");
		form.setFieldValue("maxPrice", search.maxPrice?.toString() ?? "");
		form.setFieldValue("priceRange", [
			search.minPrice ?? 0,
			search.maxPrice ?? 10000,
		]);
		form.setFieldValue("q", search.q || "");
	}, [search, form]);

	const {
		data: productsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		orpc.product.list.infiniteOptions({
			input: (pageParam) => ({
				...(search.categoryId ? { categoryId: search.categoryId } : {}),
				...(search.brands && search.brands.length > 0
					? { brands: search.brands }
					: {}),
				...(search.colors && search.colors.length > 0
					? { colors: search.colors }
					: {}),
				...(search.sizes && search.sizes.length > 0
					? { sizes: search.sizes }
					: {}),
				...(search.minPrice ? { minPrice: search.minPrice } : {}),
				...(search.maxPrice ? { maxPrice: search.maxPrice } : {}),
				...(search.q ? { q: search.q } : {}),
				...(search.sort ? { sort: search.sort } : {}),
				limit: 12,
				cursor: pageParam as number,
			}),
			getNextPageParam: (lastPage: { nextCursor?: number }) =>
				lastPage.nextCursor,
			initialPageParam: 0,
		}),
	);

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	type ListProduct = RouterOutput["product"]["list"]["items"][number];
	const allProducts =
		productsData?.pages.flatMap((p: { items: ListProduct[] }) => p.items) || [];
	const totalCount =
		(productsData?.pages[0] as { total: number } | undefined)?.total || 0;

	const handleSearch = (values: typeof form.state.values) => {
		const min = values.minPrice ? Number(values.minPrice) : undefined;
		const max = values.maxPrice ? Number(values.maxPrice) : undefined;

		const finalMin = min === 0 ? undefined : min;
		const finalMax = max === 10000 ? undefined : max;

		navigate({
			to: ".",
			search: (prev) => {
				const next: ProductSearch = {
					...prev,
					categoryId: values.categoryId,
					brands: values.brands.length > 0 ? values.brands : undefined,
					colors: values.colors.length > 0 ? values.colors : undefined,
					sizes: values.sizes.length > 0 ? values.sizes : undefined,
					minPrice: finalMin,
					maxPrice: finalMax,
					q: values.q,
				};
				if (!next.categoryId) delete next.categoryId;
				if (!next.brands) delete next.brands;
				if (!next.colors) delete next.colors;
				if (!next.sizes) delete next.sizes;
				if (next.minPrice === undefined) delete next.minPrice;
				if (next.maxPrice === undefined) delete next.maxPrice;
				if (!next.q) delete next.q;
				return next;
			},
		});
	};

	const [debouncedSearch] = useDebounce(handleSearch, 500);

	const toggleItem = (name: "brands" | "colors" | "sizes", value: string) => {
		const current = form.getFieldValue(name) as string[];
		const next = current.includes(value)
			? current.filter((v) => v !== value)
			: [...current, value];

		if (name === "brands") form.setFieldValue("brands", next);
		else if (name === "colors") form.setFieldValue("colors", next);
		else if (name === "sizes") form.setFieldValue("sizes", next);

		debouncedSearch(form.state.values);
	};

	const updateSearch = (params: Partial<ProductSearch>) => {
		navigate({
			to: ".",
			search: (prev) => ({ ...prev, ...params }),
		});
	};

	const clearFilters = () => {
		navigate({
			to: ".",
			search: {},
		});
	};

	const removeFilter = (key: keyof ProductSearch, value?: string) => {
		navigate({
			to: ".",
			search: (prev) => {
				const next: ProductSearch = { ...prev };
				if (key === "brands")
					next.brands = (next.brands || []).filter((b) => b !== value);
				else if (key === "colors")
					next.colors = (next.colors || []).filter((c) => c !== value);
				else if (key === "sizes")
					next.sizes = (next.sizes || []).filter((s) => s !== value);
				else if (key === "categoryId") delete next.categoryId;
				else if (key === "minPrice" || key === "maxPrice") {
					delete next.minPrice;
					delete next.maxPrice;
				} else if (key === "q") delete next.q;
				return next;
			},
		});
	};

	const renderFilters = () => (
		<div className="space-y-6">
			<Accordion defaultValue={["categories"]} className="w-full" multiple>
				<AccordionItem value="categories" className="border-b-0">
					<AccordionTrigger className="py-3 font-medium text-base hover:no-underline">
						Kategoriler
					</AccordionTrigger>
					<AccordionContent>
						<form.Field name="categoryId">
							{(field) => {
								const renderCategoryItem = (
									category: TreeNode<
										Omit<CategoriesOutput[number], "children"> & BaseNode
									>,
									level = 0,
								): React.ReactNode => {
									const isActive = field.state.value === category.id;
									return (
										<React.Fragment key={category.id}>
											<li
												className={cn(
													"list-none",
													level > 0 && "ml-3 border-border/50 border-l",
												)}
											>
												<button
													type="button"
													onClick={() => {
														field.handleChange(category.id);
														handleSearch({
															...form.state.values,
															categoryId: category.id,
														});
													}}
													className={cn(
														"w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-all",
														level > 0 && "ml-2",
														isActive
															? "bg-primary/10 font-semibold text-primary"
															: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
													)}
												>
													{category.name}
												</button>
												{category.children?.length > 0 && (
													<ul className="mt-0.5 space-y-0.5">
														{category.children.map((child) =>
															renderCategoryItem(child, level + 1),
														)}
													</ul>
												)}
											</li>
										</React.Fragment>
									);
								};

								return (
									<ul className="space-y-0.5">
										<li>
											<button
												type="button"
												onClick={() => {
													field.handleChange(undefined);
													handleSearch({
														...form.state.values,
														categoryId: undefined,
													});
												}}
												className={cn(
													"w-full text-left text-sm transition-colors hover:text-primary",
													!field.state.value
														? "font-semibold text-primary"
														: "text-muted-foreground",
												)}
											>
												Tümü
											</button>
										</li>
										{categoryTree.map((category) =>
											renderCategoryItem(category),
										)}
									</ul>
								);
							}}
						</form.Field>
					</AccordionContent>
				</AccordionItem>

				{filterOptions?.brands && filterOptions.brands.length > 0 && (
					<AccordionItem value="brands" className="border-b-0">
						<AccordionTrigger className="py-3 font-medium text-base hover:no-underline">
							Markalar
						</AccordionTrigger>
						<AccordionContent>
							<form.Field name="brands">
								{(field) => (
									<div className="space-y-2 pl-1">
										{filterOptions.brands.map((brand) => (
											<label
												key={brand}
												className="group flex cursor-pointer items-center gap-2"
											>
												<input
													type="checkbox"
													className="h-4 w-4 rounded border-input text-primary accent-primary focus:ring-primary"
													checked={field.state.value.includes(brand)}
													onChange={() => toggleItem("brands", brand)}
												/>
												<span className="text-muted-foreground text-sm transition-colors group-hover:text-foreground">
													{brand}
												</span>
											</label>
										))}
									</div>
								)}
							</form.Field>
						</AccordionContent>
					</AccordionItem>
				)}

				<AccordionItem value="price" className="border-b-0">
					<AccordionTrigger className="py-3 font-medium text-base hover:no-underline">
						Fiyat Aralığı
					</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-4 px-1 pt-2">
							<form.Subscribe selector={(s) => s.values.priceRange}>
								{(priceRange) => (
									<Slider
										defaultValue={[0, 10000]}
										value={priceRange}
										max={10000}
										step={10}
										onValueChange={(val) => {
											if (!Array.isArray(val)) return;
											const [min, max] = val;
											form.setFieldValue("priceRange", [min, max]);
											form.setFieldValue("minPrice", min.toString());
											form.setFieldValue("maxPrice", max.toString());
											debouncedSearch({
												...form.state.values,
												minPrice: min.toString(),
												maxPrice: max.toString(),
											});
										}}
										className="py-4"
									/>
								)}
							</form.Subscribe>

							<div className="flex items-center gap-2">
								<form.Field name="minPrice">
									{(field) => (
										<div className="grid w-full gap-1.5">
											<Label
												htmlFor="min-price"
												className="text-muted-foreground text-xs"
											>
												Min
											</Label>
											<Input
												type="number"
												id="min-price"
												placeholder="0"
												value={field.state.value}
												onChange={(e) => {
													const val = e.target.value;
													field.handleChange(val);
													const nextRange: [number, number] = [
														Number(val),
														(
															form.getFieldValue("priceRange") as [
																number,
																number,
															]
														)[1],
													];
													form.setFieldValue("priceRange", nextRange);
													debouncedSearch({
														...form.state.values,
														minPrice: val,
													});
												}}
												className="h-8 text-sm"
											/>
										</div>
									)}
								</form.Field>
								<form.Field name="maxPrice">
									{(field) => (
										<div className="grid w-full gap-1.5">
											<Label
												htmlFor="max-price"
												className="text-muted-foreground text-xs"
											>
												Max
											</Label>
											<Input
												type="number"
												id="max-price"
												placeholder="10000"
												value={field.state.value}
												onChange={(e) => {
													const val = e.target.value;
													field.handleChange(val);
													const nextRange: [number, number] = [
														(
															form.getFieldValue("priceRange") as [
																number,
																number,
															]
														)[0],
														Number(val),
													];
													form.setFieldValue("priceRange", nextRange);
													debouncedSearch({
														...form.state.values,
														maxPrice: val,
													});
												}}
												className="h-8 text-sm"
											/>
										</div>
									)}
								</form.Field>
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>

				{filterOptions?.sizes && filterOptions.sizes.length > 0 && (
					<AccordionItem value="sizes" className="border-b-0">
						<AccordionTrigger className="py-3 font-medium text-base hover:no-underline">
							Bedenler
						</AccordionTrigger>
						<AccordionContent>
							<form.Field name="sizes">
								{(field) => (
									<div className="flex flex-wrap gap-2 pt-2 pl-1">
										{filterOptions.sizes.map((size) => (
											<button
												key={size}
												type="button"
												onClick={() => toggleItem("sizes", size)}
												className={cn(
													"flex h-9 min-w-[36px] items-center justify-center rounded-md border border-border px-2 font-medium text-sm transition-colors hover:border-primary hover:text-primary",
													field.state.value.includes(size)
														? "border-primary bg-primary/5 text-primary"
														: "text-muted-foreground",
												)}
											>
												{size}
											</button>
										))}
									</div>
								)}
							</form.Field>
						</AccordionContent>
					</AccordionItem>
				)}

				{filterOptions?.colors && filterOptions.colors.length > 0 && (
					<AccordionItem value="colors" className="border-b-0">
						<AccordionTrigger className="py-3 font-medium text-base hover:no-underline">
							Renkler
						</AccordionTrigger>
						<AccordionContent>
							<form.Field name="colors">
								{(field) => (
									<div className="flex flex-wrap gap-2 pt-2 pl-1">
										{filterOptions.colors.map((color) => (
											<button
												key={color}
												type="button"
												title={color}
												onClick={() => toggleItem("colors", color)}
												className={cn(
													"h-6 w-6 rounded-full border border-border shadow-sm transition-transform hover:scale-110",
													field.state.value.includes(color)
														? "ring-2 ring-primary ring-offset-2"
														: "",
												)}
												style={{ backgroundColor: getColorHex(color) }}
											/>
										))}
									</div>
								)}
							</form.Field>
						</AccordionContent>
					</AccordionItem>
				)}
			</Accordion>
		</div>
	);

	const renderActiveFilters = () => {
		const hasFilters =
			search.categoryId ||
			(search.brands && search.brands.length > 0) ||
			(search.colors && search.colors.length > 0) ||
			(search.sizes && search.sizes.length > 0) ||
			search.minPrice !== undefined ||
			search.maxPrice !== undefined ||
			search.q;

		if (!hasFilters) return null;

		return (
			<div className="mb-6 flex flex-wrap items-center gap-2">
				<span className="mr-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
					Seçili Filtreler:
				</span>
				{search.categoryId && (
					<Button
						variant="secondary"
						size="sm"
						className="h-7 rounded-full px-3 text-xs"
						onClick={() => removeFilter("categoryId")}
					>
						Kategori:{" "}
						{categories?.find((c) => c.id === search.categoryId)?.name}
						<span className="ml-2">×</span>
					</Button>
				)}
				{search.brands?.map((brand) => (
					<Button
						key={brand}
						variant="secondary"
						size="sm"
						className="h-7 rounded-full px-3 text-xs"
						onClick={() => removeFilter("brands", brand)}
					>
						Marka: {brand} <span className="ml-2">×</span>
					</Button>
				))}
				{search.colors?.map((color) => (
					<Button
						key={color}
						variant="secondary"
						size="sm"
						className="h-7 rounded-full px-3 text-xs"
						onClick={() => removeFilter("colors", color)}
					>
						Renk: {color} <span className="ml-2">×</span>
					</Button>
				))}
				{search.sizes?.map((size) => (
					<Button
						key={size}
						variant="secondary"
						size="sm"
						className="h-7 rounded-full px-3 text-xs"
						onClick={() => removeFilter("sizes", size)}
					>
						Beden: {size} <span className="ml-2">×</span>
					</Button>
				))}
				{(search.minPrice !== undefined || search.maxPrice !== undefined) && (
					<Button
						variant="secondary"
						size="sm"
						className="h-7 rounded-full px-3 text-xs"
						onClick={() => removeFilter("minPrice")}
					>
						Fiyat: {search.minPrice ?? 0}₺ - {search.maxPrice ?? "∞"}₺
						<span className="ml-2">×</span>
					</Button>
				)}
				{search.q && (
					<Button
						variant="secondary"
						size="sm"
						className="h-7 rounded-full px-3 text-xs"
						onClick={() => removeFilter("q")}
					>
						Arama: {search.q}
						<span className="ml-2">×</span>
					</Button>
				)}
				<Button
					variant="ghost"
					size="sm"
					className="h-7 rounded-full px-3 text-primary text-xs hover:text-primary"
					onClick={clearFilters}
				>
					Tümünü Temizle
				</Button>
			</div>
		);
	};

	const renderPagination = () => null;

	return (
		<div className="container mx-auto px-4 py-4 md:py-12">
			<div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
				{/* Desktop Sidebar Filters */}
				<aside className="hidden w-64 shrink-0 lg:block">
					<div className="sticky top-24 space-y-6">
						<div className="pb-4">
							<h3 className="font-bold font-serif text-2xl tracking-tight">
								Filtrele
							</h3>
						</div>
						{renderFilters()}
					</div>
				</aside>

				{/* Mobile Filter Sheet */}
				<div className="flex gap-2 lg:hidden">
					<Sheet>
						<SheetTrigger
							render={
								<Button variant="outline" className="flex-1 gap-2">
									<Filter className="h-4 w-4" />
									Filtrele
								</Button>
							}
						/>
						<SheetContent
							side="left"
							className="flex w-[300px] flex-col p-0 sm:w-[400px]"
						>
							<SheetHeader className="p-6">
								<SheetTitle className="font-serif text-2xl">
									Filtrele
								</SheetTitle>
								<SheetDescription>
									Ürünleri detaylı kriterlere göre filtreleyin.
								</SheetDescription>
							</SheetHeader>
							<div className="flex-1 overflow-y-auto px-6 pb-20">
								{renderFilters()}
							</div>
						</SheetContent>
					</Sheet>

					<Select
						value={search.sort || "newest"}
						onValueChange={(
							val: "newest" | "price_asc" | "price_desc" | null,
						) => {
							if (val) updateSearch({ sort: val });
						}}
					>
						<SelectTrigger className="h-10 flex-1 px-4">
							<div className="flex items-center gap-2">
								<SortAsc className="h-4 w-4 opacity-50" />
								<SelectValue placeholder="Sırala" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="newest">En Yeniler</SelectItem>
							<SelectItem value="price_asc">
								Fiyat (Düşükten Yükseğe)
							</SelectItem>
							<SelectItem value="price_desc">
								Fiyat (Yüksekten Düşüğe)
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Product Grid Section */}
				<div className="flex-1 space-y-6">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div className="space-y-1">
							<h1 className="font-medium font-serif text-2xl leading-none tracking-tight md:text-4xl">
								{search.categoryId
									? categories?.find(
											(c: CategoriesOutput[number]) =>
												c.id === search.categoryId,
										)?.name
									: "Tüm Ürünler"}
							</h1>
							<p className="text-muted-foreground text-xs md:text-sm">
								{totalCount} ürün bulundu
							</p>
						</div>

						<div className="hidden lg:block">
							<Select
								value={search.sort || "newest"}
								onValueChange={(
									val: "newest" | "price_asc" | "price_desc" | null,
								) => {
									if (val) updateSearch({ sort: val });
								}}
							>
								<SelectTrigger className="h-10 w-48 px-4">
									<div className="flex items-center gap-2">
										<SortAsc className="h-4 w-4 opacity-50" />
										<SelectValue placeholder="Sırala" />
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="newest">En Yeniler</SelectItem>
									<SelectItem value="price_asc">
										Fiyat (Düşükten Yükseğe)
									</SelectItem>
									<SelectItem value="price_desc">
										Fiyat (Yüksekten Düşüğe)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{renderActiveFilters()}

					{isLoading ? (
						<div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
							{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
								<div key={i} className="space-y-3">
									<div className="aspect-3/4 animate-pulse rounded-xl bg-muted" />
									<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
									<div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
								</div>
							))}
						</div>
					) : (
						<>
							<div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
								{allProducts.map((product) => (
									<ProductCard key={product.id} product={product} />
								))}
							</div>

							<div ref={ref} className="flex justify-center py-12">
								{isFetchingNextPage ? (
									<Loader2 className="h-8 w-8 animate-spin text-primary" />
								) : hasNextPage ? (
									<Button
										variant="outline"
										onClick={() => fetchNextPage()}
										disabled={isFetchingNextPage}
										className="min-w-[200px]"
									>
										Daha Fazla Göster
									</Button>
								) : allProducts.length > 0 ? (
									<div className="flex flex-col items-center gap-2">
										<div className="h-px w-12 bg-border" />
										<p className="text-muted-foreground text-xs uppercase tracking-widest">
											Tüm ürünler gösterildi
										</p>
									</div>
								) : null}
							</div>

							{allProducts.length === 0 && (
								<div className="flex min-h-[500px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/20 px-4 py-20 text-center">
									<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-sm ring-8 ring-muted/50">
										<Filter className="h-10 w-10 text-muted-foreground/60" />
									</div>
									<h3 className="font-bold font-serif text-2xl tracking-tight md:text-3xl">
										Ürün bulunamadı
									</h3>
									<p className="mx-auto mt-4 max-w-[320px] text-muted-foreground text-sm leading-relaxed md:text-base">
										Seçtiğiniz kriterlere uygun ürün bulamadık. Filtreleri
										temizleyerek koleksiyonumuza tekrar göz atabilirsiniz.
									</p>
									<Button
										size="lg"
										onClick={clearFilters}
										className="mt-10 h-12 rounded-full px-8 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
									>
										Filtreleri Temizle
									</Button>
								</div>
							)}
						</>
					)}

					{renderPagination()}
				</div>
			</div>
		</div>
	);
}
