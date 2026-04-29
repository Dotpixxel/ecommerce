import { ORPCError } from "@orpc/server";
import { cartItems, products } from "@raunk-butik/db/schema/index";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";

export const cartRouter = {
	getCart: publicProcedure.handler(async ({ context }) => {
		const userId = context.session?.user.id;

		if (!userId) {
			return [];
		}

		const items = await context.db.query.cartItems.findMany({
			where: eq(cartItems.userId, userId),
			with: {
				product: true,
			},
		});

		return items;
	}),

	addItem: publicProcedure
		.input(
			z.object({
				productId: z.string(),
				quantity: z.number().default(1),
				size: z.string().optional(),
				color: z.string().optional(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user.id;

			if (!userId) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "User session required",
				});
			}

			const product = await context.db.query.products.findFirst({
				where: eq(products.id, input.productId),
			});

			if (!product) {
				throw new ORPCError("NOT_FOUND", {
					message: "Ürün bulunamadı",
				});
			}

			if (product.stock < input.quantity) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Yeterli stok yok",
				});
			}

			// Check if item already exists in cart for this user
			const existingItem = await context.db.query.cartItems.findFirst({
				where: and(
					eq(cartItems.userId, userId),
					eq(cartItems.productId, input.productId),
					input.size ? eq(cartItems.size, input.size) : undefined,
					input.color ? eq(cartItems.color, input.color) : undefined,
				),
			});

			if (existingItem) {
				const newQuantity = existingItem.quantity + input.quantity;
				if (product.stock < newQuantity) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Yeterli stok yok",
					});
				}
				await context.db
					.update(cartItems)
					.set({
						quantity: newQuantity,
					})
					.where(eq(cartItems.id, existingItem.id));
				return { success: true, id: existingItem.id };
			}

			const id = crypto.randomUUID();
			await context.db.insert(cartItems).values({
				id,
				userId,
				productId: input.productId,
				quantity: input.quantity,
				size: input.size,
				color: input.color,
			});

			return { success: true, id };
		}),

	updateQuantity: publicProcedure
		.input(
			z.object({
				id: z.string(),
				quantity: z.number(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user.id;
			if (!userId) throw new ORPCError("UNAUTHORIZED");

			// Ensure user owns this cart item
			const item = await context.db.query.cartItems.findFirst({
				where: and(eq(cartItems.id, input.id), eq(cartItems.userId, userId)),
				with: { product: true },
			});

			if (!item)
				throw new ORPCError("NOT_FOUND", {
					message: "Item not found or unauthorized",
				});

			if (input.quantity <= 0) {
				await context.db.delete(cartItems).where(eq(cartItems.id, input.id));
			} else {
				if (item.product.stock < input.quantity) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Yeterli stok yok",
					});
				}
				await context.db
					.update(cartItems)
					.set({ quantity: input.quantity })
					.where(eq(cartItems.id, input.id));
			}
			return { success: true };
		}),

	removeItem: publicProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session?.user.id;
			if (!userId) throw new ORPCError("UNAUTHORIZED");

			await context.db
				.delete(cartItems)
				.where(and(eq(cartItems.id, input.id), eq(cartItems.userId, userId)));
			return { success: true };
		}),

	clearCart: publicProcedure.handler(async ({ context }) => {
		const userId = context.session?.user.id;

		if (!userId) return { success: false };

		await context.db.delete(cartItems).where(eq(cartItems.userId, userId));
		return { success: true };
	}),
};
