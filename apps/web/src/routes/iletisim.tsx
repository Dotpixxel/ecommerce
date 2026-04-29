import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/iletisim")({
	component: IletisimPage,
});

function IletisimPage() {
	const { data: settings } = useSuspenseQuery(
		orpc.settings.getPublicSettings.queryOptions(),
	);

	return (
		<div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
			<div className="mb-16 text-center">
				<h1 className="mb-4 font-bold font-serif text-4xl">İletişime Geçin</h1>
				<p className="mx-auto max-w-2xl text-muted-foreground">
					Sorularınız veya geri bildirimleriniz için bize her zaman
					ulaşabilirsiniz. Ekibimiz en kısa sürede size dönüş yapacaktır.
				</p>
			</div>

			<div className="grid gap-12 md:grid-cols-2">
				{/* İletişim Bilgileri */}
				<div className="space-y-8 rounded-2xl border bg-card p-8 shadow-sm md:p-12">
					<h2 className="font-bold font-serif text-2xl">Bize Ulaşın</h2>

					<div className="space-y-6">
						<div className="flex items-start gap-4">
							<div className="rounded-full bg-primary/10 p-3">
								<MapPin className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold text-lg">Mağaza Adresi</h3>
								<p className="mt-1 text-muted-foreground text-sm leading-relaxed">
									Nişantaşı, Teşvikiye Cd. No:12
									<br />
									Şişli, İstanbul
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4">
							<div className="rounded-full bg-primary/10 p-3">
								<Phone className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold text-lg">Telefon</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									{settings.contactPhone || "+90 (212) 123 45 67"}
								</p>
								<p className="mt-1 text-muted-foreground text-xs">
									Pzt-Cmt, 09:00-18:00
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4">
							<div className="rounded-full bg-primary/10 p-3">
								<Mail className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold text-lg">E-posta</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									{settings.contactEmail || "hello@raunkbutik.com"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Lokasyon (placeholder map görseli) */}
				<div className="relative min-h-[400px] overflow-hidden rounded-2xl bg-muted">
					<iframe
						title="Raunk Butik Lokasyon"
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3009.6895311028747!2d28.9892305!3d41.0315174!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7650656bd63%3A0x8ca058b28c20b6c3!2zVGVZw7Zpa2l5ZSwgVGVZw7Zpa2l5ZSBDZC4gTm86MTIsIDM0MzY1IMWeacWfbGkvxLBzdGFuYnVs!5e0!3m2!1str!2str!4v1709400000000!5m2!1str!2str"
						width="100%"
						height="100%"
						className="absolute inset-0 border-0"
						allowFullScreen={false}
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
					/>
				</div>
			</div>
		</div>
	);
}
