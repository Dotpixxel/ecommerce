import { env } from "@raunk-butik/env/server";
import { LocalStorageProvider } from "./providers/local";
import { S3StorageProvider } from "./providers/s3";
import type { IStorageProvider } from "./types";

export type { IStorageProvider, UploadUrlResult } from "./types";

let _provider: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
	if (_provider) return _provider;

	const provider = env.STORAGE_PROVIDER ?? "s3";

	switch (provider) {
		case "s3":
			_provider = new S3StorageProvider();
			break;
		case "local":
			_provider = new LocalStorageProvider();
			break;
		default:
			throw new Error(`Unknown storage provider: "${String(provider)}"`);
	}

	return _provider;
}
