import { env } from "@raunk-butik/env/server";
import { createFileRoute } from "@tanstack/react-router";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Local development file upload handler.
 * Only active when STORAGE_PROVIDER=local.
 *
 * Frontend does: PUT /api/local-upload/products/timestamp-file.jpg
 * File is saved to:  apps/web/public/local-uploads/products/timestamp-file.jpg
 * Served at:         /local-uploads/products/timestamp-file.jpg  (Vite static)
 */
export const Route = createFileRoute("/api/local-upload/$" as never)({
	server: {
		handlers: {
			PUT: async ({ request, params }) => {
				if ((env.STORAGE_PROVIDER ?? "s3") !== "local") {
					return new Response("Local storage is not enabled", { status: 403 });
				}

				const key = (params as Record<string, string>)["*"] ?? "";

				if (!key) {
					return new Response("Missing file key", { status: 400 });
				}

				try {
					const buffer = await request.arrayBuffer();

					// Resolve to apps/web/public/local-uploads/{key}
					// __dirname is not available in ESM; use process.cwd() which is apps/web
					const uploadsDir = join(process.cwd(), "public", "local-uploads");
					const filePath = join(uploadsDir, key);

					// Ensure the directory exists (e.g. products/)
					const dir = filePath.substring(0, filePath.lastIndexOf("/"));
					await mkdir(dir, { recursive: true });

					await writeFile(filePath, Buffer.from(buffer));

					return new Response("OK", { status: 200 });
				} catch (error) {
					console.error("[LocalUpload] Failed to save file:", error);
					return new Response("Upload failed", { status: 500 });
				}
			},
		},
	},
});
