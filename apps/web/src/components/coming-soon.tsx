import { Link } from "@tanstack/react-router";
import { ArrowLeft, Construction, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ComingSoonProps {
	title: string;
	description?: string;
}

export function ComingSoon({
	title,
	description = "Bu sayfa şu anda yapım aşamasında. Çok yakında harika özelliklerle burada olacağız!",
}: ComingSoonProps) {
	return (
		<div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
			<div className="relative mb-8">
				<div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-primary/50 to-primary/30 blur-xl" />
				<div className="relative flex h-24 w-24 items-center justify-center rounded-full border bg-background shadow-xl">
					<Construction className="h-10 w-10 animate-bounce text-primary" />
				</div>
				<Sparkles className="absolute -top-2 -right-2 h-6 w-6 animate-pulse text-yellow-500" />
			</div>

			<h1 className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl">
				{title} <span className="text-primary italic">yakında</span> burada!
			</h1>

			<p className="mb-10 max-w-[500px] text-lg text-muted-foreground leading-relaxed">
				{description}
			</p>

			<div className="flex flex-col gap-4 sm:flex-row">
				<Link to="/">
					<Button size="lg" className="group h-12 px-8">
						<ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
						Ana Sayfaya Dön
					</Button>
				</Link>
				<Button
					variant="outline"
					size="lg"
					className="h-12 px-8"
					onClick={() => window.history.back()}
				>
					Geri Git
				</Button>
			</div>

			<div className="mt-16 flex items-center gap-2 font-medium text-muted-foreground text-sm">
				<span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
				Geliştirme Devam Ediyor
			</div>
		</div>
	);
}
