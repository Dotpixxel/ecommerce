import { ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface AuthPromptModalProps {
	isOpen: boolean;
	onClose: () => void;
	onGuestContinue?: () => void;
	onSignIn: () => void;
	title?: string;
	description?: string;
}

export function AuthPromptModal({
	isOpen,
	onClose,
	onGuestContinue,
	onSignIn,
	title = "Sepete Eklemek İçin Giriş Yapın",
	description = "Alışverişinize misafir olarak devam edebilir veya hesabınıza giriş yaparak siparişlerinizi takip edebilirsiniz.",
}: AuthPromptModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<ShoppingBag className="h-6 w-6 text-primary" />
					</div>
					<DialogTitle className="text-center font-serif text-2xl">
						{title}
					</DialogTitle>
					<DialogDescription className="pt-2 text-center">
						{description}
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-6">
					<Button
						onClick={onSignIn}
						className="flex h-12 w-full items-center justify-center gap-2 text-base"
					>
						<User className="h-5 w-5" /> Hesabınla Giriş Yap
					</Button>
					{onGuestContinue && (
						<Button
							variant="outline"
							onClick={onGuestContinue}
							className="h-12 w-full text-base"
						>
							Misafir Olarak Devam Et
						</Button>
					)}
				</div>
				<DialogFooter className="block text-center text-muted-foreground text-xs">
					Devam ederek kullanım şartlarımızı kabul etmiş olursunuz.
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
