import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { adminRouter } from "./admin";
import { authRouter } from "./auth";
import { campaignRouter } from "./campaign";
import { cartRouter } from "./cart";
import { orderRouter } from "./order";
import { paymentRouter } from "./payment";
import { productRouter } from "./product";
import { settingsRouter } from "./settings";
import { storageRouter } from "./storage";
import { userRouter } from "./user";
import { wishlistRouter } from "./wishlist";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	admin: adminRouter,
	auth: authRouter,
	campaign: campaignRouter,
	product: productRouter,
	cart: cartRouter,
	payment: paymentRouter,
	order: orderRouter,
	settings: settingsRouter,
	storage: storageRouter,
	user: userRouter,
	wishlist: wishlistRouter,
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
