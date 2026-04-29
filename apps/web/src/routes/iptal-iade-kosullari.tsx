import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/iptal-iade-kosullari")({
	component: IptalIadePage,
});

function IptalIadePage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
			<div className="mx-auto mb-12 text-center">
				<h1 className="mb-4 font-bold font-serif text-4xl">
					İptal ve İade Koşulları
				</h1>
				<p className="text-muted-foreground">
					Son Güncelleme: {new Date().toLocaleDateString("tr-TR")}
				</p>
			</div>

			<div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 rounded-2xl border bg-card p-8 text-muted-foreground leading-relaxed shadow-sm md:p-12">
				<section>
					<h3 className="font-semibold text-foreground text-xl">
						1. CAYMA HAKKI (İADE)
					</h3>
					<p>
						Tüketici, mesafeli sözleşmenin mal satışına ilişkin olması
						durumunda, malı teslim aldığı tarihten itibaren{" "}
						<strong>14 (on dört) gün</strong> içerisinde hiçbir gerekçe
						göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına
						sahiptir.
					</p>
					<ul className="mt-4 list-disc space-y-2 pl-5">
						<li>
							Ürünün kullanılmamış, zarar görmemiş ve tekrar satılabilir durumda
							olması gerekir.
						</li>
						<li>
							Orijinal ambalajı, etiketleri ve tüm aksesuarları eksiksiz şekilde
							gönderilmelidir.
						</li>
						<li>
							İade kargo sürecinde paketlemenin sağlam yapılması alıcının
							sorumluluğundadır.
						</li>
					</ul>
				</section>

				<section>
					<h3 className="font-semibold text-foreground text-xl">
						2. İPTAL PROSEDÜRÜ
					</h3>
					<p>
						Siparişiniz kargoya verilmeden önce dilediğiniz zaman iptal
						edebilirsiniz. İptal talebinizi <strong>"Siparişlerim"</strong>{" "}
						panelinden veya müşteri hizmetlerimize e-posta/telefon yoluyla
						ulaşarak iletebilirsiniz. Kargoya verilmiş siparişlerde iade
						prosedürü uygulanır.
					</p>
				</section>

				<section>
					<h3 className="font-semibold text-foreground text-xl">
						3. İADE SÜRECİ VE ÜCRET İADESİ
					</h3>
					<p>
						İade talebiniz onaylandıktan sonra, ürün bedeli kullandığınız ödeme
						yöntemine bağlı olarak <strong>7-10 iş günü</strong> içerisinde
						iyzico aracılığıyla kartınıza iade edilir. İade edilen tutarın banka
						ekstrenize yansıma süresi bankanızın prosedürlerine bağlıdır.
					</p>
				</section>

				<section>
					<h3 className="font-semibold text-foreground text-xl">
						4. CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER
					</h3>
					<p>
						Hijyen kuralları gereği iç giyim, küpe, mayo gibi paket açıldıktan
						sonra iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde
						cayma hakkı kullanılamaz.
					</p>
				</section>
			</div>
		</div>
	);
}
