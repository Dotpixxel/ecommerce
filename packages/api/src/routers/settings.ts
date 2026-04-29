import { publicProcedure } from "../index";

export const settingsRouter = {
	getPublicSettings: publicProcedure.handler(async ({ context: { db } }) => {
		const settings = await db.query.siteSettings.findMany();

		// Return as a key-value object map for easy consumption on the frontend
		const settingsMap = settings.reduce(
			(acc, curr) => {
				acc[curr.key] = curr.value;
				return acc;
			},
			{} as Record<string, string>,
		);

		return settingsMap;
	}),
};
