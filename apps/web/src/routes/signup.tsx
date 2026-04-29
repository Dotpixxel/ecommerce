import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { SignupForm } from "@/components/signup-form";

export const Route = createFileRoute("/signup")({
	component: SignupPage,
});

function SignupPage() {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] w-full flex-col lg:grid lg:grid-cols-2">
			{/* Left Side: Image & Quote (Hidden on Mobile) */}
			<div className="relative hidden bg-muted lg:flex lg:flex-col lg:p-12 lg:text-white">
				<div className="absolute inset-0 bg-neutral-900" />
				<img
					src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop"
					alt="Signup Cover"
					className="absolute inset-0 h-full w-full object-cover opacity-40"
				/>
				<div className="relative z-20 flex h-full flex-col items-center justify-center text-center">
					<Logo size="xl" className="mb-8 invert" />
					<blockquote className="max-w-md space-y-4">
						<p className="font-serif text-2xl italic leading-relaxed">
							"Raunk Butik ile tarzınızı keşfedin, modayı yakalayın."
						</p>
						<footer className="text-sm opacity-60">— Raunk Team</footer>
					</blockquote>
				</div>
			</div>

			{/* Right Side: Form */}
			<div className="flex flex-1 items-center justify-center p-6 sm:p-12">
				<div className="fade-in slide-in-from-bottom-4 w-full max-w-[400px] animate-in space-y-8 duration-700">
					<div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
						<div className="mb-4 lg:hidden">
							<Logo size="lg" />
						</div>
						<h1 className="font-bold font-serif text-3xl tracking-tight">
							Yeni Hesap Oluşturun
						</h1>
						<p className="text-muted-foreground">
							Ayrıcalıklı koleksiyonlarımızı keşfetmek için aramıza katılın.
						</p>
					</div>
					<SignupForm />
				</div>
			</div>
		</div>
	);
}
