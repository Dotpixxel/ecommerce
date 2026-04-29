import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@raunk-butik/env/server";
import type { IStorageProvider, UploadUrlResult } from "../types";

export class S3StorageProvider implements IStorageProvider {
	private client: S3Client;

	constructor() {
		if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
			throw new Error(
				"S3 storage requires R2_ENDPOINT, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY. " +
					"Set STORAGE_PROVIDER=local for local development.",
			);
		}

		this.client = new S3Client({
			region: "auto",
			endpoint: env.R2_ENDPOINT,
			credentials: {
				accessKeyId: env.R2_ACCESS_KEY_ID,
				secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			},
		});
	}

	async getUploadUrl(params: {
		fileName: string;
		fileType: string;
		path: string;
	}): Promise<UploadUrlResult> {
		const key = `${params.path}/${Date.now()}-${params.fileName}`;

		const command = new PutObjectCommand({
			Bucket: env.R2_BUCKET_NAME ?? "bucket",
			Key: key,
			ContentType: params.fileType,
		});

		const uploadUrl = await getSignedUrl(this.client, command, {
			expiresIn: 3600,
		});

		return { uploadUrl, publicUrl: this.getPublicUrl(key), key };
	}

	getPublicUrl(key: string): string {
		if (env.R2_PUBLIC_DOMAIN) return `${env.R2_PUBLIC_DOMAIN}/${key}`;
		return `${env.R2_ENDPOINT}/${env.R2_BUCKET_NAME}/${key}`;
	}
}
