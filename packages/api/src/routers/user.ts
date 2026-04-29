import { addresses } from "@raunk-butik/db/schema/address";
import { user } from "@raunk-butik/db/schema/auth";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const userRouter = {
	getMe: protectedProcedure.handler(async ({ context }) => {
		return { user: context.session.user };
	}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1).optional(),
				phone: z.string().optional(),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			await context.db
				.update(user)
				.set({
					...(input.name && { name: input.name }),
					...(input.phone && { phoneNumber: input.phone }),
					updatedAt: new Date(),
				})
				.where(eq(user.id, userId));

			return { success: true };
		}),

	getAddresses: protectedProcedure.handler(async ({ context }) => {
		const userId = context.session.user.id;

		return await context.db.query.addresses.findMany({
			where: eq(addresses.userId, userId),
			orderBy: [desc(addresses.createdAt)],
		});
	}),

	saveAddress: protectedProcedure
		.input(
			z.object({
				id: z.string().optional(),
				title: z.string().min(1),
				name: z.string().min(1),
				surname: z.string().min(1),
				phone: z.string().min(1),
				city: z.string().min(1),
				district: z.string().min(1),
				neighborhood: z.string().min(1),
				addressDetail: z.string().min(1),
				zipCode: z.string().min(1),
			}),
		)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;
			const { id: addressId, ...data } = input;

			if (addressId) {
				const [updated] = await context.db
					.update(addresses)
					.set({
						...data,
						updatedAt: new Date(),
					})
					.where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
					.returning();
				return updated;
			}

			// Check if an identical address already exists for this user
			const existingAddress = await context.db.query.addresses.findFirst({
				where: and(
					eq(addresses.userId, userId),
					eq(addresses.name, data.name),
					eq(addresses.surname, data.surname),
					eq(addresses.phone, data.phone),
					eq(addresses.city, data.city),
					eq(addresses.district, data.district),
					eq(addresses.neighborhood, data.neighborhood),
					eq(addresses.addressDetail, data.addressDetail),
					eq(addresses.zipCode, data.zipCode),
				),
			});

			if (existingAddress) {
				const [updated] = await context.db
					.update(addresses)
					.set({
						updatedAt: new Date(),
					})
					.where(eq(addresses.id, existingAddress.id))
					.returning();
				return updated;
			}

			const [created] = await context.db
				.insert(addresses)
				.values({
					id: crypto.randomUUID(),
					userId,
					...data,
				})
				.returning();
			return created;
		}),

	deleteAddress: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			await context.db
				.delete(addresses)
				.where(and(eq(addresses.id, input.id), eq(addresses.userId, userId)));

			return { success: true };
		}),
};
