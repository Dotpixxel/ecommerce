import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/kargo-degisim")({
	component: KargoDegisimPage,
});

function KargoDegisimPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
			<div className="mx-auto mb-12 text-center">
				<h1 className="mb-4 font-bold font-serif text-4xl">Kargo Değişim</h1>
				<p className="text-muted-foreground">
					Son Güncelleme: {new Date().toLocaleDateString("tr-TR")}
				</p>
			</div>

			<div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 rounded-2xl border bg-card p-8 text-muted-foreground leading-relaxed shadow-sm md:p-12">
				<h3 className="mt-8 font-semibold text-foreground text-xl">
					1. Kargo ve Teslimat
				</h3>
				<p>
					Siparişleriniz, onaylandıktan sonra 1-3 iş günü içerisinde kargoya
					teslim edilmektedir. Kargo takip numaranız e-posta yoluyla tarafınıza
					iletilecektir.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					2. Değişim Koşulları
				</h3>
				<p>
					Satın aldığınız ürünlerde beden değişimi yapmak isterseniz, ürünü
					teslim aldığınız tarihten itibaren 14 gün içerisinde tarafımıza
					gönderebilirsiniz. Ürünün kullanılmamış, etiketi koparılmamış ve
					orijinal ambalajının bozulmamış olması gerekmektedir.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					3. Değişim Süreci
				</h3>
				<p>
					Değişim talebinizi "Hesabım" sayfasından veya müşteri hizmetlerimizle
					iletişime geçerek oluşturabilirsiniz. Değişim için gönderilecek
					ürünlerin kargo ücreti, aksi belirtilmedikçe müşteri tarafından
					karşılanır.
				</p>

				<h3 className="mt-6 font-semibold text-foreground text-xl">
					4. Hasarlı Ürünler
				</h3>
				<p>
					Kargo paketi hasarlı olan ürünleri teslim alırken kargo görevlisine
					tutanak tutturmanız gerekmektedir. Hasarlı ürünlerle ilgili süreçte
					kargo tutanağı zorunludur.
				</p>
			</div>
		</div>
	);
}
