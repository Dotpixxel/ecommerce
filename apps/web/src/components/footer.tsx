import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	Facebook,
	Instagram,
	Mail,
	MapPin,
	Phone,
	Twitter,
} from "lucide-react";
import { orpc } from "@/utils/orpc";

export default function Footer() {
	const { data: settings } = useSuspenseQuery(
		orpc.settings.getPublicSettings.queryOptions(),
	);

	return (
		<footer className="bg-muted/30 pt-16 pb-8">
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 gap-12 md:grid-cols-4">
					{/* Brand Section */}
					<div className="space-y-6">
						<Link to="/" className="inline-block">
							<span className="font-black font-serif text-3xl tracking-tighter">
								RAUNK<span className="text-primary">.</span>
							</span>
						</Link>
						<p className="max-w-xs text-muted-foreground leading-relaxed">
							Modern silüetler ve zamansız parçalarla stilinizi yeniden
							tanımlıyoruz. Kalite ve estetiği bir araya getiren
							koleksiyonlarımızla her anınıza eşlik ediyoruz.
						</p>
						<div className="flex gap-4">
							{settings.instagramUrl && (
								<a
									href={settings.instagramUrl}
									target="_blank"
									rel="noreferrer"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									<Instagram className="h-5 w-5" />
								</a>
							)}
							<a
								href="https://twitter.com/raunkbutik"
								target="_blank"
								rel="noreferrer"
								className="text-muted-foreground transition-colors hover:text-primary"
							>
								<Twitter className="h-5 w-5" />
							</a>
							<a
								href="https://facebook.com/raunkbutik"
								target="_blank"
								rel="noreferrer"
								className="text-muted-foreground transition-colors hover:text-primary"
							>
								<Facebook className="h-5 w-5" />
							</a>
						</div>
					</div>

					{/* Quick Links */}
					<div className="space-y-6">
						<h4 className="font-bold text-lg">Hızlı Menü</h4>
						<ul className="space-y-3">
							<li>
								<Link
									to="/products"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Tüm Ürünler
								</Link>
							</li>
							<li>
								<Link
									to="/products"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Yeni Gelenler
								</Link>
							</li>
							<li>
								<Link
									to="/dashboard/orders"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Siparişlerim
								</Link>
							</li>
							<li>
								<Link
									to="/siparis-takip"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Sipariş Takip (Misafir)
								</Link>
							</li>
						</ul>
					</div>

					{/* Support */}
					<div className="space-y-6">
						<h4 className="font-bold text-lg">Kurumsal</h4>
						<ul className="space-y-3">
							<li>
								<Link
									to="/hakkimizda"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Hakkımızda
								</Link>
							</li>
							<li>
								<Link
									to="/iletisim"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									İletişim
								</Link>
							</li>
							<li>
								<Link
									to="/gizlilik-politikasi"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Gizlilik Sözleşmesi
								</Link>
							</li>
							<li>
								<Link
									to="/kargo-degisim"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Kargo Değişim
								</Link>
							</li>
							<li>
								<Link
									to="/kargo-ve-tasima"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Kargo ve Taşıma Bilgileri
								</Link>
							</li>
							<li>
								<Link
									to="/mesafeli-satis-sozlesmesi"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									Mesafeli Satış Sözleşmesi
								</Link>
							</li>
							<li>
								<Link
									to="/iptal-iade-kosullari"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									İptal ve İade Koşulları
								</Link>
							</li>
							<li>
								<Link
									to="/kisisel-veriler"
									className="text-muted-foreground transition-colors hover:text-primary"
								>
									KVKK Aydınlatma Metni
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div className="space-y-6">
						<h4 className="font-bold text-lg">İletişim</h4>
						<ul className="space-y-4">
							<li className="flex items-start gap-3">
								<MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
								<span className="text-muted-foreground">
									Nişantaşı, Teşvikiye Cd. No:12
									<br />
									Şişli, İstanbul
								</span>
							</li>
							<li className="flex items-center gap-3">
								<Phone className="h-5 w-5 shrink-0 text-primary" />
								<span className="text-muted-foreground">
									{settings.contactPhone || "+90 (212) 123 45 67"}
								</span>
							</li>
							<li className="flex items-center gap-3">
								<Mail className="h-5 w-5 shrink-0 text-primary" />
								<span className="text-muted-foreground">
									{settings.contactEmail || "hello@raunkbutik.com"}
								</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-16 border-t pt-8">
					<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
						<p className="text-muted-foreground text-sm">
							© {new Date().getFullYear()} RAUNK Butik. Tüm hakları saklıdır.
						</p>
						<div className="flex items-center gap-6">
							<img
								src="/iyzico-logo-pack/footer_iyzico_ile_ode/Colored/logo_band_colored.svg"
								alt="iyzico ile Öde"
								className="h-10 w-auto"
							/>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
