/**
 * Backward compatibility re-export.
 * Storage logic has moved to ./storage/ directory.
 * Use getStorageProvider() from ./storage/index.ts for new code.
 */
export { getStorageProvider } from "./storage/index";
export type { IStorageProvider, UploadUrlResult } from "./storage/types";

// Legacy S3 client — only used if STORAGE_PROVIDER=s3
import { env } from "@raunk-butik/env/server";
import { S3Client } from "@aws-sdk/client-s3";

/** @deprecated Use getStorageProvider() instead */
export const s3Client = new S3Client({
	region: "auto",
	endpoint: env.R2_ENDPOINT ?? "https://placeholder.r2.cloudflarestorage.com",
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
		secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
	},
});

/** @deprecated Use getStorageProvider().getPublicUrl() instead */
export const getPublicUrl = (key: string) => {
	if (env.R2_PUBLIC_DOMAIN) return `${env.R2_PUBLIC_DOMAIN}/${key}`;
	return `${env.R2_ENDPOINT ?? ""}/${env.R2_BUCKET_NAME ?? ""}/${key}`;
};
