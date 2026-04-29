import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
	email: z.string().email().optional(),
});

export const Route = createFileRoute("/registration-success")({
	validateSearch: (search) => searchSchema.parse(search),
	component: RegistrationSuccessPage,
});

function RegistrationSuccessPage() {
	const { email } = Route.useSearch();
	const navigate = useNavigate();

	return (
		<div className="container relative mx-auto grid min-h-[calc(100vh-4rem)] flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
			<div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
				<div className="absolute inset-0 bg-neutral-900" />
				<img
					src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop"
					alt="Registration Success Cover"
					className="absolute inset-0 h-full w-full object-cover opacity-50"
				/>
				<div className="relative z-20 mt-auto">
					<blockquote className="space-y-2">
						<p className="font-serif text-lg italic">
							"Raunk Butik dünyasına hoş geldiniz. Stil dolu bir yolculuk sizi
							bekliyor."
						</p>
					</blockquote>
				</div>
			</div>
			<div className="lg:p-8">
				<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
					<div className="flex flex-col items-center gap-4 text-center">
						<div className="rounded-full bg-primary/10 p-3">
							<MailCheck className="h-10 w-10 text-primary" />
						</div>
						<h1 className="font-semibold text-2xl tracking-tight">
							Kayıt Başarılı!
						</h1>
						<p className="text-muted-foreground text-sm">
							{email ? (
								<>
									<span className="font-medium text-foreground">{email}</span>{" "}
									adresine bir doğrulama bağlantısı gönderdik. Devam etmek için
									lütfen e-postanızı kontrol edin.
								</>
							) : (
								"E-posta adresinize bir doğrulama bağlantısı gönderdik. Devam etmek için lütfen e-postanızı kontrol edin."
							)}
						</p>
					</div>

					<div className="flex flex-col gap-2">
						<Button
							onClick={() => navigate({ to: "/login" })}
							className="w-full"
						>
							Giriş Ekranına Dön
						</Button>
						<Button
							variant="ghost"
							onClick={() => navigate({ to: "/" })}
							className="w-full text-sm"
						>
							Ana Sayfaya Git
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
