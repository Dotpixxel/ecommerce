import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/kargo-ve-tasima")({
	component: KargoVeTasimaPage,
});

function KargoVeTasimaPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
			<div className="mx-auto mb-12 text-center">
				<h1 className="mb-4 font-bold font-serif text-4xl">
					Kargo ve Taşıma Bilgileri
				</h1>
				<p className="text-muted-foreground">
					Son Güncelleme: {new Date().toLocaleDateString("tr-TR")}
				</p>
			</div>

			<div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 rounded-2xl border bg-card p-8 text-muted-foreground leading-relaxed shadow-sm md:p-12">
				<h3 className="mt-8 font-semibold text-foreground text-xl">
					1. Teslimat Süreçleri
				</h3>
				<p>
					Raunk Butik olarak siparişlerinizi en hızlı şekilde ulaştırmayı
					hedefliyoruz. Standart teslimat süremiz kargoya verildikten sonra
					24-72 saattir.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					2. Çalıştığımız Kargo Firmaları
				</h3>
				<p>
					Şu an için sadece DHL Kargo ile aktif olarak çalışmaktayız.
					Siparişiniz DHL Kargo güvencesi ile kapınıza kadar ulaştırılır. Kargo
					takibi ve detaylı bilgi için{" "}
					<a
						href="https://shipnow.dhl.com/tr/tr"
						target="_blank"
						rel="noopener noreferrer"
						className="font-semibold text-primary underline"
					>
						DHL ShipNow
					</a>{" "}
					sayfasını ziyaret edebilirsiniz.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					3. Kargo Ücretlendirmesi
				</h3>
				<p>
					Belirlenen ücretsiz kargo limitinin üzerindeki siparişlerde herhangi
					bir kargo ücreti alınmaz. Limit altındaki siparişlerde standart kargo
					ücreti ödeme aşamasında eklenmektedir.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					4. Kapıda Ödeme Seçeneği
				</h3>
				<p>
					Kapıda ödeme seçeneğimiz belirli dönemlerde ve limitlerde kargo
					firmalarının sunduğu imkanlar dahilinde aktif edilmektedir. Aktif
					olduğunda ödeme sayfasında görebilirsiniz.
				</p>
			</div>
		</div>
	);
}
