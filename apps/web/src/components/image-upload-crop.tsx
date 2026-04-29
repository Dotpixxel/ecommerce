import { useMutation } from "@tanstack/react-query";
import { Loader2, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { Area } from "react-easy-crop";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

interface ImageUploadWithCropProps {
	value: string[];
	onChange: (value: string[]) => void;
	maxFiles?: number;
	/** 3/4 for product cards, 16/9 for banners. Default: 3/4 */
	aspect?: number;
	label?: string;
}

// ──── Canvas helpers ─────────────────────────────────────────────────────────

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = pixelCrop.width;
			canvas.height = pixelCrop.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) return reject(new Error("Canvas context not available"));

			ctx.drawImage(
				image,
				pixelCrop.x,
				pixelCrop.y,
				pixelCrop.width,
				pixelCrop.height,
				0,
				0,
				pixelCrop.width,
				pixelCrop.height,
			);

			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
					else reject(new Error("Canvas is empty"));
				},
				"image/webp",
				1,
			);
		};
		image.onerror = reject;
		image.src = imageSrc;
	});
}

// ──── Component ──────────────────────────────────────────────────────────────

export function ImageUploadWithCrop({
	value,
	onChange,
	maxFiles = 10,
	aspect = 3 / 4,
	label,
}: ImageUploadWithCropProps) {
	const [pendingFiles, setPendingFiles] = useState<string[]>([]);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const currentFile = pendingFiles[0] || null;

	const getPresignedUrlMutation = useMutation(
		orpc.storage.getPresignedUploadUrl.mutationOptions(),
	);

	// Crop dialog confirmed
	const handleCropConfirm = useCallback(async () => {
		if (!currentFile || !croppedAreaPixels) return;
		setIsUploading(true);
		try {
			const blob = await getCroppedImg(currentFile, croppedAreaPixels);
			const fileName = `crop_${Date.now()}.webp`;
			const { url, publicUrl } = await getPresignedUrlMutation.mutateAsync({
				fileName,
				fileType: "image/webp",
				path: "products",
			});

			await fetch(url, {
				method: "PUT",
				body: blob,
				headers: { "Content-Type": "image/webp" },
			});

			onChange([...value, publicUrl]);
			toast.success("Görsel yüklendi");

			// Remove the processed file and move to next
			setPendingFiles((prev) => prev.slice(1));
		} catch {
			toast.error("Görsel yüklenirken hata oluştu");
		} finally {
			setIsUploading(false);
			setCrop({ x: 0, y: 0 });
			setZoom(1);
		}
	}, [
		currentFile,
		croppedAreaPixels,
		value,
		onChange,
		getPresignedUrlMutation,
	]);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			if (value.length + acceptedFiles.length > maxFiles) {
				toast.error(`En fazla ${maxFiles} görsel yükleyebilirsiniz`);
				return;
			}

			const objectUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
			setPendingFiles((prev) => [...prev, ...objectUrls]);
			setCrop({ x: 0, y: 0 });
			setZoom(1);
		},
		[value, maxFiles],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
		multiple: true,
		maxFiles: maxFiles - value.length,
		disabled: value.length >= maxFiles,
	});

	const removeImage = (url: string) => {
		onChange(value.filter((u) => u !== url));
	};

	// Aspect label for UI guidance
	const aspectLabel =
		Math.abs(aspect - 16 / 9) < 0.01
			? "16:9 (Yatay Banner)"
			: Math.abs(aspect - 3 / 4) < 0.01
				? "3:4 (Ürün Kartı)"
				: `${aspect.toFixed(2)}`;

	return (
		<>
			<div className="space-y-3">
				{/* Guides */}
				<p className="rounded-md bg-muted/60 px-3 py-1.5 text-muted-foreground text-xs">
					💡 Bu alan <strong>{aspectLabel}</strong> oranında görsel ister.
					Yüklediğiniz görseli interaktif olarak kırpabilirsiniz.
				</p>

				{/* Preview grid */}
				<div
					className={cn(
						"grid gap-4",
						Math.abs(aspect - 16 / 9) < 0.01
							? "grid-cols-1 md:grid-cols-2"
							: "grid-cols-2 md:grid-cols-4 lg:grid-cols-5",
					)}
				>
					{value.map((url) => (
						<div
							key={url}
							className="group relative overflow-hidden rounded-lg border bg-muted"
							style={{
								aspectRatio: String(aspect),
							}}
						>
							<img
								src={url}
								alt="Yüklenen görsel"
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
								"flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors hover:bg-muted/50",
								isDragActive
									? "border-primary bg-primary/5"
									: "border-muted-foreground/25",
							)}
							style={{
								aspectRatio: String(aspect),
							}}
						>
							<input {...getInputProps()} />
							<Upload className="h-6 w-6 text-muted-foreground" />
							<span className="text-center text-muted-foreground text-xs">
								{isDragActive ? "Bırakın" : (label ?? "Görsel Yükle")}
							</span>
						</div>
					)}
				</div>

				<p className="text-muted-foreground text-xs">
					En fazla {maxFiles} görsel. (JPG, PNG veya WebP)
				</p>
			</div>

			{/* ── Crop Dialog ── */}
			<Dialog
				open={!!currentFile}
				onOpenChange={(open) => {
					if (!open) {
						setPendingFiles([]);
					}
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							Görseli Kırp{" "}
							{pendingFiles.length > 1 && `(1/${pendingFiles.length})`}
						</DialogTitle>
					</DialogHeader>

					<div
						className="relative w-full overflow-hidden rounded-lg bg-black"
						style={{ height: 380 }}
					>
						{currentFile && (
							<Cropper
								image={currentFile}
								crop={crop}
								zoom={zoom}
								aspect={aspect}
								onCropChange={setCrop}
								onZoomChange={setZoom}
								onCropComplete={(_, areaPixels) =>
									setCroppedAreaPixels(areaPixels)
								}
							/>
						)}
					</div>

					{/* Zoom controls */}
					<div className="flex items-center gap-3">
						<ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
						<input
							type="range"
							min={1}
							max={3}
							step={0.05}
							value={zoom}
							onChange={(e) => setZoom(Number(e.target.value))}
							className="w-full accent-primary"
						/>
						<ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
					</div>

					<p className="text-center text-muted-foreground text-xs">
						Görseli sürükleyin ve kırpma alanını ayarlayın • Oran:{" "}
						<strong>{aspectLabel}</strong>
					</p>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setPendingFiles([])}
							disabled={isUploading}
						>
							İptal
						</Button>
						<Button onClick={handleCropConfirm} disabled={isUploading}>
							{isUploading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Yükleniyor...
								</>
							) : pendingFiles.length > 1 ? (
								"Kırp ve Sıradakine Geç"
							) : (
								"Kırp ve Yükle"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
