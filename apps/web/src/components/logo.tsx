import { cn } from "@/lib/utils";

interface LogoProps {
	className?: string;
	showText?: boolean;
	size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
	const sizes = {
		sm: "h-6",
		md: "h-8",
		lg: "h-10",
		xl: "h-12",
	};

	const iconSizes = {
		sm: "h-6 w-6 text-sm",
		md: "h-8 w-8 text-lg",
		lg: "h-10 w-10 text-xl",
		xl: "h-12 w-12 text-2xl",
	};

	const textSizes = {
		sm: "text-[10px] tracking-[0.15em]",
		md: "text-xs tracking-[0.2em]",
		lg: "text-sm tracking-[0.25em]",
		xl: "text-base tracking-[0.3em]",
	};

	return (
		<div
			className={cn(
				"flex items-center gap-3 font-serif",
				sizes[size],
				className,
			)}
		>
			{/* Icon: Modern Minimalist Font-based "R" */}
			<div
				className={cn(
					"flex items-center justify-center border-2 border-foreground bg-foreground font-bold text-background transition-all duration-300 hover:bg-background hover:text-foreground",
					iconSizes[size],
				)}
			>
				R
			</div>

			{showText && (
				<div
					className={cn(
						"flex items-baseline gap-1 uppercase transition-colors duration-300",
						textSizes[size],
					)}
				>
					<span className="font-extrabold text-foreground">Raunk</span>
					<span className="font-light text-muted-foreground/80">Butik</span>
				</div>
			)}
		</div>
	);
}
