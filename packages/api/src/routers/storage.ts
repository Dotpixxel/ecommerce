import { z } from "zod";
import { adminProcedure } from "../index";
import { getStorageProvider } from "../lib/storage/index";

export const storageRouter = {
	getPresignedUploadUrl: adminProcedure
		.input(
			z.object({
				fileName: z.string(),
				fileType: z.string(),
				path: z.string().default("products"),
			}),
		)
		.handler(async ({ input }) => {
			const storage = getStorageProvider();
			const result = await storage.getUploadUrl({
				fileName: input.fileName,
				fileType: input.fileType,
				path: input.path,
			});

			return {
				url: result.uploadUrl,
				key: result.key,
				publicUrl: result.publicUrl,
			};
		}),

	/** Güncelleme için eski imzayı public URL ile çözümler */
	getPublicUrl: adminProcedure
		.input(z.object({ key: z.string() }))
		.handler(async ({ input }) => {
			return { publicUrl: getStorageProvider().getPublicUrl(input.key) };
		}),
};
