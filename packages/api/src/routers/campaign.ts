import { campaigns } from "@raunk-butik/db/schema/index";
import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { publicProcedure } from "../index";

export const campaignRouter = {
	getActive: publicProcedure.handler(async ({ context: { db } }) => {
		const now = new Date();
		return await db.query.campaigns.findMany({
			where: and(
				eq(campaigns.isActive, true),
				or(isNull(campaigns.startDate), lte(campaigns.startDate, now)),
				or(isNull(campaigns.endDate), gte(campaigns.endDate, now)),
			),
			orderBy: [asc(campaigns.priority)],
		});
	}),
};
