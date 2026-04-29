import { ORPCError } from "@orpc/server";
import {
	backInStockRequests,
	products,
	reviews,
} from "@raunk-butik/db/schema/index";
import {
	and,
	asc,
	desc,
	eq,
	gte,
	isNull,
	like,
	lte,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";

export const productRouter = {
	list: publicProcedure
		.input(
			z.object({
				categoryId: z.string().nullish(),
				brand: z.string().nullish(),
				colors: z.array(z.string()).nullish(),
				sizes: z.array(z.string()).nullish(),
				minPrice: z.coerce.number().nullish(),
				maxPrice: z.coerce.number().nullish(),
				q: z.string().nullish(),
				sort: z.enum(["newest", "price_asc", "price_desc"]).nullish(),
				limit: z.coerce.number().default(12),
				cursor: z.coerce.number().default(0),
			}),
		)
		.handler(async ({ context, input }) => {
			const limit = input.limit;
			const offset = input.cursor;

			const conditions = [
				isNull(products.deletedAt),
				or(eq(products.isActive, true), isNull(products.isActive)),
			];

			if (input.q) {
				const tokens = input.q
					.trim()
					.split(/\s+/)
					.filter((t) => t.length > 0);
				for (const token of tokens) {
					const condition = or(
						like(products.name, `%${token}%`),
						products.brand ? like(products.brand, `%${token}%`) : undefined,
						like(products.description, `%${token}%`),
					);
					if (condition) {
						conditions.push(condition);
					}
				}
			}

			if (input.categoryId) {
				conditions.push(eq(products.categoryId, input.categoryId));
			}
			if (input.brand) {
				conditions.push(eq(products.brand, input.brand));
			}
			if (input.colors && input.colors.length > 0) {
				const colorConditions = input.colors.map(
					(color) =>
						sql`EXISTS (SELECT 1 FROM json_each(${products.colors}) WHERE value = ${color})`,
				);
				const colorCond = or(...colorConditions);
				if (colorCond) conditions.push(colorCond);
			}
			if (input.sizes && input.sizes.length > 0) {
				const sizeConditions = input.sizes.map(
					(size) =>
						sql`EXISTS (SELECT 1 FROM json_each(${products.sizes}) WHERE value = ${size})`,
				);
				const sizeCond = or(...sizeConditions);
				if (sizeCond) conditions.push(sizeCond);
			}
			if (input.minPrice != null) {
				conditions.push(gte(products.price, input.minPrice));
			}
			if (input.maxPrice != null) {
				conditions.push(lte(products.price, input.maxPrice));
			}

			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			const orderBy = [desc(sql`${products.stock} > 0`)];
			if (input.sort === "price_asc") {
				orderBy.push(asc(products.price));
			} else if (input.sort === "price_desc") {
				orderBy.push(desc(products.price));
			} else {
				orderBy.push(desc(products.createdAt));
			}

			const items = await context.db.query.products.findMany({
				where: whereClause,
				limit: limit + 1,
				offset: offset,
				with: {
					category: true,
				},
				orderBy,
			});

			let nextCursor: typeof offset | undefined;
			if (items.length > limit) {
				items.pop();
				nextCursor = offset + limit;
			}

			const total = await context.db
				.select({ count: sql<number>`count(*)` })
				.from(products)
				.where(whereClause)
				.then((res) => res[0]?.count ?? 0);

			return {
				items,
				nextCursor,
				total,
			};
		}),

	bySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.handler(async ({ context, input }) => {
			const product = await context.db.query.products.findFirst({
				where: eq(products.slug, input.slug),
				with: {
					category: true,
					variants: true,
					reviews: {
						where: eq(reviews.status, "approved"),
						with: {
							user: true,
						},
						orderBy: [desc(reviews.createdAt)],
					},
				},
			});

			return product;
		}),

	getCategories: publicProcedure.handler(async ({ context }) => {
		return await context.db.query.categories.findMany({
			with: {
				children: true,
			},
		});
	}),

	getFilters: publicProcedure.handler(async ({ context }) => {
		const allProducts = await context.db
			.select({
				brand: products.brand,
				colors: products.colors,
				sizes: products.sizes,
			})
			.from(products);

		const brands = [
			...new Set(allProducts.map((p) => p.brand).filter(Boolean)),
		] as string[];
		const colors = [
			...new Set(allProducts.flatMap((p) => p.colors || []).filter(Boolean)),
		] as string[];
		const sizes = [
			...new Set(allProducts.flatMap((p) => p.sizes || []).filter(Boolean)),
		] as string[];

		return {
			brands: brands.sort(),
			colors: colors.sort(),
			sizes: sizes.sort(),
		};
	}),

	addReview: publicProcedure
		.input(
			z.object({
				productId: z.string(),
				rating: z.number().min(1).max(5),
				comment: z.string().optional(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user.id;
			if (!userId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "Giriş yapmanız gerekmektedir.",
				});
			}

			// Check if user already reviewed this product
			const existing = await context.db.query.reviews.findFirst({
				where: and(
					eq(reviews.productId, input.productId),
					eq(reviews.userId, userId),
				),
			});

			if (existing) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Bu ürün için zaten bir yorumunuz bulunmaktadır.",
				});
			}

			const id = crypto.randomUUID();
			await context.db.insert(reviews).values({
				id,
				productId: input.productId,
				userId,
				rating: input.rating,
				comment: input.comment,
				status: "pending",
			});

			return { success: true, id };
		}),

	canReview: publicProcedure
		.input(z.object({ productId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session?.user.id;
			if (!userId) return { canReview: false, reason: "auth" as const };

			const alreadyReviewed = await context.db.query.reviews.findFirst({
				where: and(
					eq(reviews.productId, input.productId),
					eq(reviews.userId, userId),
				),
			});

			if (alreadyReviewed)
				return { canReview: false, reason: "already_reviewed" as const };

			return { canReview: true, reason: null };
		}),

	requestBackInStock: publicProcedure
		.input(
			z.object({
				productId: z.string(),
				email: z.string().email("Geçerli bir e-posta adresi giriniz"),
				size: z.string().optional(),
				color: z.string().optional(),
			}),
		)
		.handler(async ({ context, input }) => {
			// Check if already requested
			const existing = await context.db.query.backInStockRequests.findFirst({
				where: and(
					eq(backInStockRequests.productId, input.productId),
					eq(backInStockRequests.email, input.email),
					input.size ? eq(backInStockRequests.size, input.size) : undefined,
					input.color ? eq(backInStockRequests.color, input.color) : undefined,
				),
			});

			if (existing) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"Bu ürün için zaten bir gelince haber ver talebiniz bulunmaktadır.",
				});
			}

			const id = crypto.randomUUID();
			await context.db.insert(backInStockRequests).values({
				id,
				productId: input.productId,
				email: input.email,
				size: input.size,
				color: input.color,
				status: "pending",
			});

			return { success: true, id };
		}),
};
