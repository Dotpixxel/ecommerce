import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/kisisel-veriler")({
	component: KVKKPage,
});

function KVKKPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
			<div className="mx-auto mb-12 text-center">
				<h1 className="mb-4 font-bold font-serif text-4xl">
					KVKK ve Aydınlatma Metni
				</h1>
				<p className="text-muted-foreground">
					Son Güncelleme: {new Date().toLocaleDateString("tr-TR")}
				</p>
			</div>

			<div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 rounded-2xl border bg-card p-8 text-muted-foreground leading-relaxed shadow-sm md:p-12">
				<h3 className="mt-8 font-semibold text-foreground text-xl">
					Veri Sorumlusunun Kimliği
				</h3>
				<p>
					Kişisel verileriniz, veri sorumlusu sıfatıyla Raunk Butik tarafından,
					6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca aşağıda
					açıklanan kapsamda işlenebilecektir.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					Kişisel Verilerin İşlenme Amacı
				</h3>
				<p>
					Kişisel verileriniz;
					<ul className="mt-2 list-disc space-y-2 pl-5">
						<li>Ürün ve hizmetlerimizin sizlere sunulabilmesi,</li>
						<li>
							Siparişlerin hazırlanması ve kargolanması süreçlerinin
							yönetilmesi,
						</li>
						<li>Yetkili kamu kurum ve kuruluşlarına bilgi verilmesi,</li>
						<li>
							Kampanya ve tekliflerden sizlerin haberdar edilmesi amacıyla
							işlenmektedir.
						</li>
					</ul>
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					İşlenen Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği
				</h3>
				<p>
					Toplanan kişisel verileriniz iş ortaklarımızla (DHL),
					tedarikçilerimizle, şirket yetkilileriyle ve iyzico gibi yetkili
					kurumlar ile hukuki zorunluluk kapsamında aktarılabilecektir.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					Kişisel Veri Sahibinin Hakları
				</h3>
				<p>
					KVKK'nın 11. maddesi uyarınca veri sahipleri;
					<ul className="mt-2 list-disc space-y-2 pl-5">
						<li>Kişisel veri işlenip işlenmediğini öğrenme,</li>
						<li>Veriler işlenmişse bilgi talep etme,</li>
						<li>Amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
						<li>
							Eksik veya yanlış işlenmişse düzeltilmesini isteme haklarına
							sahiptir.
						</li>
					</ul>
				</p>
			</div>
		</div>
	);
}
