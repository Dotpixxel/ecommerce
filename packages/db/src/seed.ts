// @ts-nocheck
import dotenv from "dotenv";
import { reset, seed } from "drizzle-seed";

dotenv.config({ path: "../../apps/web/.env" });

const main = async () => {
	try {
		// Dynamic imports to ensure env vars are loaded first
		const { db } = await import("./index");
		const schema = await import("./schema");

		console.log("Seeding database with drizzle-seed...");

		// Reset database first
		await reset(db, schema);

		await seed(db, schema, { count: 100 }).refine((funcs) => ({
			products: {
				count: 20,
				columns: {
					name: funcs.companyName(), // Using company name as proxy for product name
					slug: funcs.uuid(),
					description: funcs.loremIpsum({ sentencesCount: 3 }),
					price: funcs.int({ minValue: 100, maxValue: 5000 }),
					stock: funcs.int({ minValue: 0, maxValue: 100 }),
					images: funcs.default({
						defaultValue: [
							"https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=600&auto=format&fit=crop",
							"https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=600&auto=format&fit=crop",
							"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop",
							"https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop",
						],
					}),
					sizes: funcs.default({ defaultValue: ["S", "M", "L"] }),
					colors: funcs.default({ defaultValue: ["Siyah", "Beyaz"] }),
					categoryId: funcs.default({ defaultValue: undefined }), // We will fix category relations automatically or let it be random if handled by seed
				},
			},
			categories: {
				count: 5,
				columns: {
					name: funcs.valuesFromArray({
						values: ["Elbiseler", "Dış Giyim", "Aksesuar", "Pantolon", "Bluz"],
					}),
					slug: funcs.uuid(),
				},
			},
			reviews: {
				count: 50,
				columns: {
					rating: funcs.int({ minValue: 1, maxValue: 5 }),
					comment: funcs.loremIpsum({ sentencesCount: 2 }),
				},
			},
			user: {
				count: 10,
				columns: {
					name: funcs.fullName(),
					email: funcs.email(),
				},
			},
		}));

		console.log("Seeding completed.");
		process.exit(0);
	} catch (error) {
		console.error("Error seeding database:", error);
		process.exit(1);
	}
};

main();
