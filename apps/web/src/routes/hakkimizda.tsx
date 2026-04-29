import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hakkimizda")({
	component: HakkimizdaPage,
});

function HakkimizdaPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
			<div className="mb-16 text-center">
				<h1 className="mb-4 font-bold font-serif text-4xl">Hakkımızda</h1>
				<p className="text-lg text-muted-foreground">
					Zarafet ve şıklığı bir araya getiren hikayemiz
				</p>
			</div>

			<div className="relative mb-16 aspect-video overflow-hidden rounded-3xl">
				<img
					src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop"
					alt="Raunk Butik Store"
					className="h-full w-full object-cover"
				/>
			</div>

			<div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-lg text-muted-foreground leading-relaxed">
				<p>
					<strong>Raunk Butik</strong>, modern kadının dinamik hayatına eşlik
					edecek zamansız ve kaliteli parçalar sunma vizyonuyla yola çıktı.
					Modanın hızlı tüketilen bir kavram olmaktan çıkıp, kişisel stili
					yansıtan kalıcı bir ifade biçimi olması gerektiğine inanıyoruz.
				</p>

				<h3 className="mt-12 mb-4 font-serif text-2xl text-foreground">
					Ortak Tutkumuz: Modanın Ötesi
				</h3>
				<p>
					Türkiye'nin dört bir yanından özenle seçilmiş tasarımcılarla işbirliği
					yapıyor, her bir dikişte sanat ve zanaatı arıyoruz. Raunk
					koleksiyonları hazırlanırken sadece trendlere değil, kumaşın dokusuna,
					vücuttaki duruşuna ve en önemlisi size hissettireceklerine
					odaklanıyoruz.
				</p>

				<div className="not-prose my-12 grid gap-8 md:grid-cols-2">
					<div className="rounded-2xl border border-primary/10 bg-primary/5 p-8">
						<h4 className="mb-3 font-bold text-foreground text-xl">
							Vizyonumuz
						</h4>
						<p className="text-sm">
							Kendinden emin, stiliyle konuşan kadınların ilk tercihi olmak ve
							e-ticaret dünyasında güven ve kalitenin sembolü haline gelmek.
						</p>
					</div>
					<div className="rounded-2xl border border-primary/10 bg-primary/5 p-8">
						<h4 className="mb-3 font-bold text-foreground text-xl">
							Misyonumuz
						</h4>
						<p className="text-sm">
							En iyi alışveriş deneyimini sunarken, müşteri memnuniyetini
							satışın ötesinde kalıcı bir dostluğa dönüştürmek.
						</p>
					</div>
				</div>

				<p>
					Bizi tercih ettiğiniz için teşekkür ederiz. Raunk ailesi olarak
					gardırobunuzda yer almak bizim için büyük bir onur. Geri
					dönüşlerinizle büyümeye ve size daha iyi hizmet vermeye devam
					edeceğiz.
				</p>
			</div>
		</div>
	);
}
