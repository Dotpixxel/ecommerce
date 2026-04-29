import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, PackageSearch, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

// Create a type matching the response from trackGuestOrder
type TrackedOrder = {
	id: string;
	status: string;
	totalAmount: number;
	items: {
		id: string;
		quantity: number;
		price: number;
		size: string | null;
		color: string | null;
		product: {
			name: string;
			images: string[] | null;
		} | null;
	}[];
};

export const Route = createFileRoute("/siparis-takip")({
	component: OrderTrackingPage,
});

function OrderTrackingPage() {
	const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
	const [error, setError] = useState<string | null>(null);

	const trackMutation = useMutation(
		orpc.order.trackGuestOrder.mutationOptions({
			onSuccess: (data) => {
				setTrackedOrder(data);
				setError(null);
			},
			onError: (err) => {
				setError(err.message || "Sipariş bulunamadı veya bilgiler hatalı.");
				setTrackedOrder(null);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			orderId: "",
			email: "",
		},
		onSubmit: async ({ value }) => {
			trackMutation.mutate(value);
		},
	});

	return (
		<div className="container mx-auto max-w-4xl px-4 py-12">
			<div className="mb-8 space-y-2 text-center">
				<h1 className="font-bold font-serif text-3xl tracking-tight md:text-5xl">
					Sipariş Takibi
				</h1>
				<p className="text-lg text-muted-foreground">
					Siparişinizin güncel durumunu öğrenmek için bilgilerinizi giriniz.
				</p>
			</div>

			<Card className="mx-auto mb-12 max-w-md border-2 shadow-xl">
				<CardHeader className="bg-muted/30">
					<CardTitle className="flex items-center gap-2 text-xl">
						<PackageSearch className="h-6 w-6 text-primary" />
						Sorgulama Formu
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-6">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-6"
					>
						<form.Field name="orderId">
							{(field) => (
								<Field>
									<FieldLabel>Sipariş Numarası</FieldLabel>
									<Input
										placeholder="Örn: ord_12345abcde"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										className="h-12"
										required
									/>
									<FieldError>{field.state.meta.errors?.[0]}</FieldError>
								</Field>
							)}
						</form.Field>

						<form.Field name="email">
							{(field) => (
								<Field>
									<FieldLabel>E-posta Adresi</FieldLabel>
									<Input
										type="email"
										placeholder="Siparişte kullandığınız e-posta"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										className="h-12"
										required
									/>
									<FieldError>{field.state.meta.errors?.[0]}</FieldError>
								</Field>
							)}
						</form.Field>

						{error && (
							<div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive text-sm">
								{error}
							</div>
						)}

						<Button
							type="submit"
							className="h-14 w-full font-bold text-lg"
							disabled={trackMutation.isPending}
						>
							{trackMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-6 w-6 animate-spin" />
									Sorgulanıyor...
								</>
							) : (
								"Siparişimi Bul"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{trackedOrder && (
				<div className="fade-in slide-in-from-bottom-4 animate-in duration-500">
					<h2 className="mb-6 font-bold font-serif text-2xl">
						Sipariş Detayları
					</h2>
					<Card className="overflow-hidden border-2 shadow-sm">
						<CardHeader className="bg-muted/20 pb-4">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Sipariş No
									</p>
									<p className="font-bold font-mono tracking-tight">
										{trackedOrder.id}
									</p>
								</div>
								<div className="text-left sm:text-right">
									<p className="font-medium text-muted-foreground text-sm">
										Durum
									</p>
									<Badge
										className={cn(
											"mt-1 font-bold text-sm uppercase tracking-wider",
											trackedOrder.status === "pending" &&
												"bg-amber-100 text-amber-800 hover:bg-amber-100",
											trackedOrder.status === "processing" &&
												"bg-blue-100 text-blue-800 hover:bg-blue-100",
											trackedOrder.status === "shipped" &&
												"bg-purple-100 text-purple-800 hover:bg-purple-100",
											trackedOrder.status === "delivered" &&
												"bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
											trackedOrder.status === "cancelled" &&
												"bg-rose-100 text-rose-800 hover:bg-rose-100",
										)}
									>
										{trackedOrder.status === "pending"
											? "Bekliyor"
											: trackedOrder.status === "processing"
												? "Hazırlanıyor"
												: trackedOrder.status === "shipped"
													? "Kargoya Verildi"
													: trackedOrder.status === "delivered"
														? "Teslim Edildi"
														: "İptal Edildi"}
									</Badge>
									{(trackedOrder.status === "shipped" ||
										trackedOrder.status === "delivered") && (
										<div className="mt-2">
											<a
												href="https://shipnow.dhl.com/tr/tr"
												target="_blank"
												rel="noopener noreferrer"
												className="font-semibold text-primary text-xs underline transition-colors hover:text-primary/80"
											>
												DHL Kargo Takibi
											</a>
										</div>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y divide-border/50">
								{trackedOrder.items.map((item) => (
									<div
										key={item.id}
										className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
									>
										<div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-muted">
											{item.product?.images?.[0] ? (
												<img
													src={item.product.images[0]}
													alt={item.product.name}
													className="h-full w-full object-cover"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-muted-foreground">
													<ShoppingBag className="h-8 w-8 opacity-20" />
												</div>
											)}
										</div>
										<div className="flex-1 space-y-1">
											<h4 className="font-bold text-lg">
												{item.product?.name || "Bilinmeyen Ürün"}
											</h4>
											<div className="flex items-center gap-3 text-muted-foreground text-sm">
												{item.size && (
													<span className="rounded-sm bg-muted/80 px-2 py-0.5 font-medium">
														Beden: {item.size}
													</span>
												)}
												{item.color && (
													<span className="rounded-sm bg-muted/80 px-2 py-0.5 font-medium">
														Renk: {item.color}
													</span>
												)}
											</div>
											<div className="font-medium text-muted-foreground text-sm">
												Adet: {item.quantity}
											</div>
										</div>
										<div className="text-left sm:text-right">
											<div className="font-bold font-serif text-primary text-xl">
												{new Intl.NumberFormat("tr-TR", {
													style: "currency",
													currency: "TRY",
												}).format(item.price * item.quantity)}
											</div>
											{item.quantity > 1 && (
												<div className="text-muted-foreground text-sm">
													{new Intl.NumberFormat("tr-TR", {
														style: "currency",
														currency: "TRY",
													}).format(item.price)}{" "}
													/ adet
												</div>
											)}
										</div>
									</div>
								))}
							</div>
							<div className="bg-muted/10 p-6">
								<div className="flex items-center justify-between border-t-2 border-dashed pt-4">
									<span className="font-bold font-serif text-2xl">
										Toplam Tutar
									</span>
									<span className="font-black font-serif text-3xl text-primary">
										{new Intl.NumberFormat("tr-TR", {
											style: "currency",
											currency: "TRY",
										}).format(trackedOrder.totalAmount)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
