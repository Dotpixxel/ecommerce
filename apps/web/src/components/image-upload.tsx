import { useMutation } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface ImageUploadProps {
	value: string[];
	onChange: (value: string[]) => void;
	maxFiles?: number;
}

export function ImageUpload({
	value,
	onChange,
	maxFiles = 5,
}: ImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);

	const getPresignedUrlMutation = useMutation(
		orpc.storage.getPresignedUploadUrl.mutationOptions(),
	);

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (value.length + acceptedFiles.length > maxFiles) {
				toast.error(`En fazla ${maxFiles} görsel yükleyebilirsiniz`);
				return;
			}

			setIsUploading(true);

			try {
				const uploadPromises = acceptedFiles.map(async (file) => {
					const { url, publicUrl } = await getPresignedUrlMutation.mutateAsync({
						fileName: file.name,
						fileType: file.type,
						path: "products",
					});

					await fetch(url, {
						method: "PUT",
						body: file,
						headers: {
							"Content-Type": file.type,
						},
					});

					return publicUrl;
				});

				const newUrls = await Promise.all(uploadPromises);
				onChange([...value, ...newUrls]);
				toast.success("Görseller başarıyla yüklendi");
			} catch (error) {
				console.error("Upload error:", error);
				toast.error("Görsel yüklenirken bir hata oluştu");
			} finally {
				setIsUploading(false);
			}
		},
		[value, onChange, maxFiles, getPresignedUrlMutation],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".jpeg", ".jpg", ".png", ".webp"],
		},
		maxFiles: maxFiles - value.length,
	});

	const removeImage = (url: string) => {
		onChange(value.filter((u) => u !== url));
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
				{value.map((url) => (
					<div
						key={url}
						className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
					>
						<img
							src={url}
							alt="Ürün görseli"
							className="h-full w-full object-cover"
						/>
						<button
							type="button"
							onClick={() => removeImage(url)}
							className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
						>
							<X className="h-3 w-3" />
						</button>
					</div>
				))}

				{value.length < maxFiles && (
					<div
						{...getRootProps()}
						className={cn(
							"flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50",
							isDragActive
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25",
							isUploading && "pointer-events-none opacity-50",
						)}
					>
						<input {...getInputProps()} />
						{isUploading ? (
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						) : (
							<>
								<Upload className="h-6 w-6 text-muted-foreground" />
								<span className="text-center text-muted-foreground text-xs">
									{isDragActive ? "Bırakın" : "Görsel Yükle"}
								</span>
							</>
						)}
					</div>
				)}
			</div>
			<p className="text-muted-foreground text-xs">
				En fazla {maxFiles} görsel. (JPG, PNG veya WebP)
			</p>
		</div>
	);
}
