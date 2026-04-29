export interface UploadUrlResult {
	/** URL'e PUT request ile dosya yüklenir */
	uploadUrl: string;
	/** Yüklenen dosyanın herkese açık URL'i */
	publicUrl: string;
	/** Storage'daki dosya yolu */
	key: string;
}

export interface IStorageProvider {
	getUploadUrl(params: {
		fileName: string;
		fileType: string;
		path: string;
	}): Promise<UploadUrlResult>;

	getPublicUrl(key: string): string;
}
