import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/gizlilik-politikasi")({
	component: GizlilikPolitikasiPage,
});

function GizlilikPolitikasiPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
			<div className="mx-auto mb-12 text-center">
				<h1 className="mb-4 font-bold font-serif text-4xl">
					Gizlilik Politikası
				</h1>
				<p className="text-muted-foreground">
					Son Güncelleme: {new Date().toLocaleDateString("tr-TR")}
				</p>
			</div>

			<div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 rounded-2xl border bg-card p-8 text-muted-foreground leading-relaxed shadow-sm md:p-12">
				<p>
					Raunk Butik olarak gizliliğinize ve kişisel verilerinizin güvenliğine
					önem veriyoruz.
				</p>

				<h3 className="mt-8 font-semibold text-foreground text-xl">
					1. Toplanan Bilgiler
				</h3>
				<p>
					Sitemize üye olurken, sipariş verirken veya iletişim formunu
					doldururken ad, soyad, e-posta adresi, telefon numarası ve teslimat
					adresi gibi temel kişisel bilgilerinizi paylaşırsınız.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					2. Bilgilerin Kullanımı
				</h3>
				<p>
					Topladığımız bilgiler siparişlerinizin işlenmesi, teslimatı, ödeme
					süreçlerinin yönetimi ve yasal yükümlülüklerimizin yerine getirilmesi
					amacıyla kullanılır.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					3. Bilgilerin Paylaşımı
				</h3>
				<p>
					Bilgileriniz yalnızca iyzico gibi ödeme altyapı sağlayıcıları ve DHL
					gibi lojistik iş ortaklarımızla hizmetin gereği kadar paylaşılır.
					Verileriniz asla üçüncü şahıslara satılamaz.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					4. Çerezler (Cookies)
				</h3>
				<p>
					Sitemizde alışveriş deneyiminizi iyileştirmek için çerezler
					kullanmaktayız. Tarayıcı ayarlarınızdan çerezleri dilediğiniz zaman
					yönetebilirsiniz.
				</p>
			</div>
		</div>
	);
}
