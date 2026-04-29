import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] w-full flex-col lg:grid lg:grid-cols-2">
			{/* Left Side: Image & Quote (Hidden on Mobile) */}
			<div className="relative hidden bg-muted lg:flex lg:flex-col lg:p-12 lg:text-white">
				<div className="absolute inset-0 bg-neutral-900" />
				<img
					src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?q=80&w=1000&auto=format&fit=crop"
					alt="Login Cover"
					className="absolute inset-0 h-full w-full object-cover opacity-40"
				/>
				<div className="relative z-20 flex h-full flex-col items-center justify-center text-center">
					<Logo size="xl" className="mb-8 invert" />
					<blockquote className="max-w-md space-y-4">
						<p className="font-serif text-2xl italic leading-relaxed">
							"Moda geçer, stil kalır. Raunk Butik ile özgün stilinizi
							keşfedin."
						</p>
						<footer className="text-sm opacity-60">— Raunk Team</footer>
					</blockquote>
				</div>
			</div>

			{/* Right Side: Form */}
			<div className="flex flex-1 items-center justify-center p-6 sm:p-12">
				<div className="fade-in slide-in-from-bottom-4 w-full max-w-[380px] animate-in space-y-8 duration-700">
					<div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
						<div className="mb-4 lg:hidden">
							<Logo size="lg" />
						</div>
						<h1 className="font-bold font-serif text-3xl tracking-tight">
							Hesabınıza Giriş Yapın
						</h1>
						<p className="text-muted-foreground">
							Koleksiyonlarımızı keşfetmek için hesabınıza dönün.
						</p>
					</div>
					<LoginForm />
				</div>
			</div>
		</div>
	);
}
