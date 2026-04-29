import { X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TagInputProps {
	id?: string;
	value: string[] | null;
	onChange: (value: string[] | null) => void;
	placeholder?: string;
	className?: string;
}

export function TagInput({
	id,
	value,
	onChange,
	placeholder = "Yazıp Enter'a basın...",
	className,
}: TagInputProps) {
	const [inputValue, setInputValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const tags = value ?? [];

	const addTag = (tag: string) => {
		const trimmed = tag.trim();
		if (!trimmed || tags.includes(trimmed)) return;
		const next = [...tags, trimmed];
		onChange(next.length > 0 ? next : null);
	};

	const removeTag = (tag: string) => {
		const next = tags.filter((t) => t !== tag);
		onChange(next.length > 0 ? next : null);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTag(inputValue);
			setInputValue("");
		} else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
			removeTag(tags[tags.length - 1]);
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Wrapper delegating focus to hidden input
		<div
			className={cn(
				"flex min-h-14 cursor-text flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-lg shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
				className,
			)}
			onClick={() => inputRef.current?.focus()}
			onKeyDown={() => inputRef.current?.focus()}
		>
			{tags.map((tag) => (
				<span
					key={tag}
					className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary text-sm"
				>
					{tag}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							removeTag(tag);
						}}
						className="ml-0.5 rounded-full text-primary/60 hover:text-primary"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				</span>
			))}
			<input
				ref={inputRef}
				id={id}
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={() => {
					if (inputValue.trim()) {
						addTag(inputValue);
						setInputValue("");
					}
				}}
				placeholder={tags.length === 0 ? placeholder : ""}
				className="min-w-[120px] flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
			/>
		</div>
	);
}
