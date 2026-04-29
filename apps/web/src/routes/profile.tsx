import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const { data: session, isPending: isSessionLoading } =
		authClient.useSession();
	const queryClient = useQueryClient();

	const updateMutation = useMutation(
		orpc.user.updateProfile.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["auth", "getSession"]],
				});
				toast.success("Profiliniz başarıyla güncellendi");
			},
			onError: (error) => {
				toast.error(error.message || "Güncelleme sırasında bir hata oluştu");
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			name: session?.user?.name || "",
			phone: session?.user?.phoneNumber || "",
		},
		onSubmit: async ({ value }) => {
			updateMutation.mutate(value);
		},
	});

	if (isSessionLoading) {
		return (
			<div className="flex h-[400px] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<h2 className="font-bold text-2xl">Lütfen giriş yapın</h2>
				<p className="mt-2 text-muted-foreground">
					Profilinizi görmek için önce sisteme giriş yapmalısınız.
				</p>
				<Link
					to="/login"
					className="mt-6 flex h-12 items-center justify-center rounded-md bg-primary px-8 font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90"
				>
					Giriş Yap
				</Link>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-2xl px-4 py-12">
			<div className="mb-10 text-center">
				<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
					<User className="h-10 w-10" />
				</div>
				<h1 className="font-bold text-4xl tracking-tight">
					Kişisel Bilgilerim
				</h1>
				<p className="mt-2 text-lg text-muted-foreground">
					Hesap bilgilerinizi buradan güncelleyebilirsiniz.
				</p>
			</div>

			<Card className="border-2 border-primary/5 shadow-xl">
				<CardHeader className="border-b bg-muted/30">
					<CardTitle className="text-xl">Profil Düzenle</CardTitle>
				</CardHeader>
				<CardContent className="pt-8">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
						className="space-y-8"
					>
						<form.Field name="name">
							{(field) => (
								<Field>
									<FieldLabel className="font-bold text-lg">
										Ad Soyad
									</FieldLabel>
									<Input
										className="h-14 border-2 text-xl focus:ring-4"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Adınız Soyadınız"
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="phone">
							{(field) => (
								<Field>
									<FieldLabel className="font-bold text-lg">
										Telefon Numarası
									</FieldLabel>
									<Input
										className="h-14 border-2 text-xl focus:ring-4"
										value={field.state.value || ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="05XX XXX XX XX"
									/>
									<p className="mt-2 font-medium text-muted-foreground text-sm italic">
										Siparişlerinizle ilgili size ulaşabilmemiz için gereklidir.
									</p>
								</Field>
							)}
						</form.Field>

						<div className="border-t pt-8">
							<div className="rounded-xl bg-muted/50 p-6">
								<h4 className="font-bold text-muted-foreground text-sm uppercase tracking-wider">
									Hesap E-postası
								</h4>
								<p className="mt-2 font-medium text-foreground/80 text-xl">
									{session.user.email}
								</p>
								<p className="mt-1 text-muted-foreground text-sm italic">
									E-posta adresi değiştirilemez.
								</p>
							</div>
						</div>

						<div className="border-t pt-8">
							<div className="flex items-center justify-between rounded-xl border-2 border-primary/10 bg-primary/5 p-6">
								<div>
									<h4 className="font-bold text-lg">Adreslerim</h4>
									<p className="mt-1 text-muted-foreground text-sm">
										Kayıtlı teslimat adreslerinizi yönetin.
									</p>
								</div>
								<Link
									to="/dashboard/addresses"
									className="inline-flex h-10 items-center justify-center rounded-md border border-primary/20 bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
								>
									Adresleri Yönet
								</Link>
							</div>
						</div>

						<Button
							type="submit"
							size="lg"
							className="h-16 w-full gap-3 font-bold text-xl shadow-primary/20 shadow-xl transition-all active:scale-[0.98]"
							disabled={updateMutation.isPending}
						>
							{updateMutation.isPending ? (
								<>
									<Loader2 className="h-6 w-6 animate-spin text-white" />
									Kaydediliyor...
								</>
							) : (
								<>
									<Save className="h-6 w-6" />
									Değişiklikleri Kaydet
								</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
