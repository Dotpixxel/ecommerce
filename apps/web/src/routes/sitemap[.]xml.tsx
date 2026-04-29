import { createDb } from "@raunk-butik/db";
import { categories } from "@raunk-butik/db/schema/index";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const db = createDb();
				const baseUrl = "https://raunkbutik.com";

				// Fetch products
				const allProducts = await db.query.products.findMany({
					columns: { slug: true, updatedAt: true },
				});

				// Fetch categories
				const allCategories = await db.query.categories.findMany({
					columns: { id: true },
					where: eq(categories.isActive, true),
				});

				const staticRoutes = [
					"/",
					"/products",
					"/iletisim",
					"/login",
					"/register",
				];

				let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
				xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

				// Static routes
				for (const route of staticRoutes) {
					xml += "  <url>\n";
					xml += `    <loc>${baseUrl}${route}</loc>\n`;
					xml += "    <changefreq>daily</changefreq>\n";
					xml += `    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n`;
					xml += "  </url>\n";
				}

				// Product routes
				for (const product of allProducts) {
					xml += "  <url>\n";
					xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
					if (product.updatedAt) {
						xml += `    <lastmod>${product.updatedAt.toISOString().split("T")[0]}</lastmod>\n`;
					}
					xml += "    <changefreq>weekly</changefreq>\n";
					xml += "    <priority>0.9</priority>\n";
					xml += "  </url>\n";
				}

				// Category routes
				for (const category of allCategories) {
					xml += "  <url>\n";
					xml += `    <loc>${baseUrl}/products?categoryId=${category.id}</loc>\n`;
					xml += "    <changefreq>weekly</changefreq>\n";
					xml += "    <priority>0.7</priority>\n";
					xml += "  </url>\n";
				}

				xml += "</urlset>";

				return new Response(xml, {
					status: 200,
					headers: {
						"Content-Type": "application/xml",
						"Cache-Control": "public, max-age=86400, s-maxage=86400",
					},
				});
			},
		},
	},
});
