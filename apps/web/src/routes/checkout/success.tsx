import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Package, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";

import { z } from "zod";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const successSearchSchema = z.object({
	orderId: z.string().optional(),
});

export const Route = createFileRoute("/checkout/success")({
	component: SuccessPage,
	validateSearch: successSearchSchema,
});

function SuccessPage() {
	const [showConfetti, setShowConfetti] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setShowConfetti(false), 10000);
		return () => clearTimeout(timer);
	}, []);

	const { orderId } = Route.useSearch();

	return (
		<div className="container relative mx-auto min-h-[80vh] px-4 py-12 md:py-24">
			{showConfetti && (
				<Confetti
					width={1080}
					height={1920}
					recycle={false}
					numberOfPieces={200}
					colors={["#EAB308", "#000000", "#71717A"]}
				/>
			)}

			<div className="mx-auto max-w-2xl text-center">
				<div className="mb-8 flex justify-center">
					<div className="relative">
						<div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
						<div className="relative rounded-full bg-primary p-4 text-primary-foreground">
							<CheckCircle2 className="h-12 w-12" />
						</div>
					</div>
				</div>

				<h1 className="mb-4 font-bold font-serif text-4xl tracking-tight md:text-5xl">
					Siparişiniz Başarıyla Alındı!
				</h1>
				{orderId && (
					<p className="mb-4 font-mono text-muted-foreground text-sm">
						Sipariş No:{" "}
						<span className="font-bold text-foreground">
							#{orderId.slice(0, 8).toUpperCase()}
						</span>
					</p>
				)}
				<p className="mb-12 text-lg text-muted-foreground">
					Harika bir seçim yaptınız. Ödemeniz onaylandı ve ekibimiz siparişinizi
					hazırlamaya başladı.
				</p>

				<div className="grid gap-6 md:grid-cols-2">
					<Card className="border-none bg-muted/50 transition-colors hover:bg-muted">
						<CardContent className="flex flex-col items-center p-6 text-center">
							<div className="mb-4 rounded-full bg-background p-3 shadow-sm">
								<Package className="h-6 w-6 text-primary" />
							</div>
							<h3 className="mb-2 font-semibold font-serif text-xl">
								Sipariş Durumu
							</h3>
							<p className="text-muted-foreground text-sm">
								Siparişiniz şu an <strong>hazırlanıyor</strong> aşamasında.
								Kargo bilgileriniz e-posta ile iletilecektir.
							</p>
						</CardContent>
					</Card>

					<Card className="border-none bg-muted/50 transition-colors hover:bg-muted">
						<CardContent className="flex flex-col items-center p-6 text-center">
							<div className="mb-4 rounded-full bg-background p-3 shadow-sm">
								<ShoppingBag className="h-6 w-6 text-primary" />
							</div>
							<h3 className="mb-2 font-semibold font-serif text-xl">
								Alışverişe Devam
							</h3>
							<p className="text-muted-foreground text-sm">
								Yeni koleksiyonlarımıza göz atmak ister misiniz? Keşfedilecek
								çok şey var.
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Link
						to="/products"
						className={cn(buttonVariants({ size: "lg" }), "h-12 px-8")}
					>
						Alışverişe Devam Et
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
					<Link
						to="/dashboard"
						className={cn(
							buttonVariants({ variant: "outline", size: "lg" }),
							"h-12 px-8",
						)}
					>
						Siparişlerimi Görüntüle
					</Link>
				</div>

				<div className="mt-16 border-t pt-8 text-muted-foreground text-sm">
					<p>
						Yardıma mı ihtiyacınız var?{" "}
						<Link to="/" className="text-primary hover:underline">
							Destek merkezimize
						</Link>{" "}
						ulaşabilirsiniz.
					</p>
				</div>
			</div>
		</div>
	);
}
