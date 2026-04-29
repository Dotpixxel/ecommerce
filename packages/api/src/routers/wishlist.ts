import { wishlist } from "@raunk-butik/db/schema/wishlist";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const wishlistRouter = {
	toggle: protectedProcedure
		.input(z.object({ productId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const existing = await context.db.query.wishlist.findFirst({
				where: and(
					eq(wishlist.userId, userId),
					eq(wishlist.productId, input.productId),
				),
			});

			if (existing) {
				await context.db
					.delete(wishlist)
					.where(
						and(
							eq(wishlist.userId, userId),
							eq(wishlist.productId, input.productId),
						),
					);
				return { status: "removed" };
			}

			await context.db.insert(wishlist).values({
				id: crypto.randomUUID(),
				userId,
				productId: input.productId,
			});

			return { status: "added" };
		}),

	list: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;

		return await context.db.query.wishlist.findMany({
			where: eq(wishlist.userId, userId),
			with: {
				product: {
					with: {
						category: true,
					},
				},
			},
		});
	}),

	check: protectedProcedure
		.input(z.object({ productId: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			const existing = await context.db.query.wishlist.findFirst({
				where: and(
					eq(wishlist.userId, userId),
					eq(wishlist.productId, input.productId),
				),
			});

			return { isInWishlist: !!existing };
		}),
};
