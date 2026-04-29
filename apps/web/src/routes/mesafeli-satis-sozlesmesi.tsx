import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/mesafeli-satis-sozlesmesi")({
	component: MesafeliSatisSozlesmesiPage,
});

function MesafeliSatisSozlesmesiPage() {
	const { data: settings } = useSuspenseQuery(
		orpc.settings.getPublicSettings.queryOptions(),
	);

	return (
		<div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
			<div className="mx-auto mb-12 text-center">
				<h1 className="mb-4 font-bold font-serif text-4xl">
					Mesafeli Satış Sözleşmesi
				</h1>
				<p className="text-muted-foreground">
					Son Güncelleme: {new Date().toLocaleDateString("tr-TR")}
				</p>
			</div>

			<div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 rounded-2xl border bg-card p-8 text-muted-foreground leading-relaxed shadow-sm md:p-12">
				<section>
					<h3 className="mb-4 font-semibold text-foreground text-xl">
						MADDE 1 - TARAFLAR
					</h3>
					<div className="space-y-4">
						<div className="rounded-lg border bg-muted/30 p-6">
							<h4 className="mb-4 font-bold text-foreground">
								1.1. SATICI BİLGİLERİ
							</h4>
							<div className="space-y-3 text-sm">
								<p className="flex items-center gap-2">
									<strong className="w-24">Unvan:</strong> Raunk Butik
								</p>
								<p className="flex items-start gap-2">
									<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
									<strong className="w-24">Adres:</strong> Nişantaşı, Teşvikiye
									Cd. No:12 Şişli, İstanbul
								</p>
								<p className="flex items-center gap-2">
									<Phone className="h-4 w-4 shrink-0 text-primary" />
									<strong className="w-24">Telefon:</strong>{" "}
									{settings.contactPhone || "+90 (212) 123 45 67"}
								</p>
								<p className="flex items-center gap-2">
									<Mail className="h-4 w-4 shrink-0 text-primary" />
									<strong className="w-24">E-posta:</strong>{" "}
									{settings.contactEmail || "hello@raunkbutik.com"}
								</p>
								<p className="flex items-center gap-2 pl-6">
									<strong className="w-24">Vergi D.:</strong>{" "}
									{settings.taxOffice || "[Lütfen Giriniz]"}
								</p>
								<p className="flex items-center gap-2 pl-6">
									<strong className="w-24">Vergi No:</strong>{" "}
									{settings.taxNumber || "[Lütfen Giriniz]"}
								</p>
							</div>
						</div>
						<div className="rounded-lg border bg-muted/30 p-4">
							<h4 className="mb-2 font-bold text-foreground">
								1.2. ALICI BİLGİLERİ
							</h4>
							<p>
								Siteden sipariş veren ve ödemeyi gerçekleştiren kişi. Alıcının
								sistem kayıtlarında yer alan iletişim bilgileri geçerlidir.
							</p>
						</div>
					</div>
				</section>

				<section>
					<h3 className="mb-4 font-semibold text-foreground text-xl">
						MADDE 2 - SÖZLEŞMENİN KONUSU
					</h3>
					<p>
						İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait internet sitesinden
						siparişini yaptığı nitelikleri ve satış fiyatı belirtilen ürünün
						satışı ve teslimi ile ilgili 6502 sayılı Tüketicinin Korunması
						Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri
						gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
					</p>
				</section>

				<section>
					<h3 className="mb-4 font-semibold text-foreground text-xl">
						MADDE 3 - ÜRÜN BİLGİLERİ VE TESLİMAT
					</h3>
					<p>
						Sözleşme konusu malın türü, miktarı, marka/modeli, rengi, satış
						bedeli, ödeme şekli, siparişin sonlandığı ana kadarki bilgilerden
						oluşmaktadır.
					</p>
					<p className="mt-2">
						Ürünler yasal 30 günlük süreyi aşmamak koşulu ile ALICI'nın
						bildirdiği adrese teslim edilir. Kargo ücreti aksi belirtilmedikçe
						ALICI tarafından ödenir.
					</p>
				</section>

				<section>
					<h3 className="mb-4 font-semibold text-foreground text-xl">
						MADDE 4 - CAYMA HAKKI
					</h3>
					<p>
						ALICI; mal satışına ilişkin mesafeli sözleşmelerde, ürünün kendisine
						veya gösterdiği adresteki kişi/kuruluşa teslim tarihinden itibaren{" "}
						<strong>14 (on dört) gün</strong> içerisinde hiçbir hukuki ve cezai
						sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı
						reddederek sözleşmeden cayma hakkına sahiptir.
					</p>
					<p className="mt-2">
						Cayma hakkının kullanılması için bu süre içinde SATICI'ya yazılı
						bildirimde bulunulması ve ürünün işbu sözleşme hükümleri
						çerçevesinde kullanılmamış olması şarttır.
					</p>
				</section>

				<section>
					<h3 className="mb-4 font-semibold text-foreground text-xl">
						MADDE 5 - GENEL HÜKÜMLER
					</h3>
					<ul className="list-disc space-y-2 pl-5">
						<li>
							ALICI, internet sitesinde sözleşme konusu ürünün temel
							nitelikleri, satış fiyatı ve ödeme şekli ile teslimata ilişkin ön
							bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda
							gerekli teyidi verdiğini beyan eder.
						</li>
						<li>
							SATICI, sözleşme konusu ürünün sağlam, eksiksiz, siparişte
							belirtilen niteliklere uygun teslim edilmesinden sorumludur.
						</li>
						<li>
							Ödemenin kredi kartı vb. ile yapılması halinde, kartın yetkisiz
							kişilerce haksız kullanımı nedeniyle bankanın SATICI'ya ödeme
							yapmaması durumunda, ALICI ürünü 3 gün içinde iade etmekle
							yükümlüdür.
						</li>
					</ul>
				</section>

				<section>
					<h3 className="mb-4 font-semibold text-foreground text-xl">
						MADDE 6 - YETKİLİ MAHKEME
					</h3>
					<p>
						İşbu sözleşmenin uygulanmasında, Gümrük ve Ticaret Bakanlığınca ilan
						edilen değere kadar Tüketici Hakem Heyetleri ile ALICI'nın veya
						SATICI'nın yerleşim yerindeki Tüketici Mahkemeleri yetkilidir.
					</p>
				</section>

				<div className="mt-12 border-t pt-8 text-center text-sm italic">
					Siparişin gerçekleşmesi durumunda ALICI işbu sözleşmenin tüm
					koşullarını kabul etmiş sayılır.
				</div>
			</div>
		</div>
	);
}
