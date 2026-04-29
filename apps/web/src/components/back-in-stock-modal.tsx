import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/utils/orpc";

interface BackInStockModalProps {
	isOpen: boolean;
	onClose: () => void;
	productId: string;
	productName: string;
	selectedSize?: string | null;
	selectedColor?: string | null;
	userEmail?: string | null;
}

export function BackInStockModal({
	isOpen,
	onClose,
	productId,
	productName,
	selectedSize,
	selectedColor,
	userEmail,
}: BackInStockModalProps) {
	const requestMutation = useMutation(
		orpc.product.requestBackInStock.mutationOptions({
			onSuccess: () => {
				toast.success(
					"Talebiniz alınmıştır. Ürün stoklara girdiğinde size haber vereceğiz.",
				);
				onClose();
			},
			onError: (error) => {
				toast.error(error.message || "Talebiniz alınırken bir hata oluştu.");
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			email: userEmail || "",
		},
		onSubmit: async ({ value }) => {
			requestMutation.mutate({
				productId,
				email: value.email,
				size: selectedSize || undefined,
				color: selectedColor || undefined,
			});
		},
	});

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Gelince Haber Ver</DialogTitle>
					<DialogDescription>
						<strong className="text-foreground">{productName}</strong> ürünü
						{selectedSize ? ` (${selectedSize} Beden)` : ""}
						{selectedColor ? ` (${selectedColor} Renk)` : ""} stoklarımıza
						girdiğinde e-posta ile bilgilendirilmek için adresinizi bırakın.
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4 pt-4"
				>
					<form.Field name="email">
						{(field) => (
							<Field>
								<FieldLabel>E-posta Adresiniz</FieldLabel>
								<Input
									type="email"
									placeholder="ornek@email.com"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									required
								/>
							</Field>
						)}
					</form.Field>

					<DialogFooter className="pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={requestMutation.isPending}
						>
							İptal
						</Button>
						<Button type="submit" disabled={requestMutation.isPending}>
							{requestMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Haber Ver
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
