import { cn } from "@/lib/utils";

interface PriceProps {
	amount: number;
	className?: string;
	currency?: string;
	size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Price({
	amount,
	className,
	currency = "₺",
	size = "md",
}: PriceProps) {
	// Format to 2 decimal places and split
	const formatted = new Intl.NumberFormat("tr-TR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);

	const [lira, kurus] = formatted.split(",");

	const sizeClasses = {
		sm: "text-sm",
		md: "text-base",
		lg: "text-lg md:text-xl",
		xl: "text-2xl md:text-3xl",
		"2xl": "text-4xl md:text-6xl",
	};

	const kurusSizeClasses = {
		sm: "text-[10px]",
		md: "text-xs",
		lg: "text-sm",
		xl: "text-lg",
		"2xl": "text-2xl",
	};

	return (
		<div
			className={cn(
				"inline-flex items-baseline font-price font-semibold tabular-nums tracking-tight",
				sizeClasses[size],
				className,
			)}
		>
			<span className="text-primary">{lira}</span>
			<span
				className={cn(
					"ml-0.5 self-start font-semibold text-primary/80 opacity-80",
					kurusSizeClasses[size],
				)}
			>
				,{kurus}
			</span>
			<span
				className={cn(
					"ml-1 font-medium font-price opacity-70",
					kurusSizeClasses[size],
				)}
			>
				{currency}
			</span>
		</div>
	);
}
