import { env } from "@raunk-butik/env/server";
import type { IStorageProvider, UploadUrlResult } from "../types";

/**
 * Local filesystem storage provider.
 *
 * Upload URL  → PUT  /api/local-upload/{key}  (handled by apps/web route)
 * Public URL  → GET  /local-uploads/{key}     (served by Vite from public/)
 */
export class LocalStorageProvider implements IStorageProvider {
	private get baseUrl(): string {
		// BETTER_AUTH_URL = app origin (e.g. http://localhost:3001)
		return env.BETTER_AUTH_URL ?? "http://localhost:3001";
	}

	async getUploadUrl(params: {
		fileName: string;
		fileType: string;
		path: string;
	}): Promise<UploadUrlResult> {
		const key = `${params.path}/${Date.now()}-${params.fileName}`;
		return {
			uploadUrl: `${this.baseUrl}/api/local-upload/${key}`,
			publicUrl: `${this.baseUrl}/local-uploads/${key}`,
			key,
		};
	}

	getPublicUrl(key: string): string {
		return `${this.baseUrl}/local-uploads/${key}`;
	}
}
