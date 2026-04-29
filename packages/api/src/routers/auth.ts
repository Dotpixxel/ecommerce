import { user } from "@raunk-butik/db/schema/auth";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";

export const authRouter = {
	checkUserExists: publicProcedure
		.input(
			z.object({
				email: z.string().email().optional(),
				phoneNumber: z.string().optional(),
			}),
		)
		.handler(async ({ context: { db }, input }) => {
			if (!input.email && !input.phoneNumber) {
				return { exists: false };
			}

			const conditions = [];
			if (input.email) conditions.push(eq(user.email, input.email));
			if (input.phoneNumber)
				conditions.push(eq(user.phoneNumber, input.phoneNumber));

			const existingUser = await db.query.user.findFirst({
				where: or(...conditions),
			});

			return {
				exists: !!existingUser,
				emailExists: existingUser?.email === input.email,
				phoneExists: existingUser?.phoneNumber === input.phoneNumber,
			};
		}),
};
