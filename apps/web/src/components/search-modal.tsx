import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { orpc } from "@/utils/orpc";
import { Price } from "./price";

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery] = useDebounce(searchQuery, 300);

	const { data, isLoading } = useQuery(
		orpc.product.list.queryOptions({
			input: { q: debouncedQuery, limit: 5 },
			query: { enabled: debouncedQuery.length > 1 },
		}),
	);

	const handleSelect = (slug: string) => {
		onClose();
		setSearchQuery("");
		navigate({ to: "/products/$slug", params: { slug } });
	};

	const handleSeeAll = () => {
		onClose();
		navigate({
			to: "/products",
			search: { q: debouncedQuery },
		});
		setSearchQuery("");
	};

	const products = data?.items || [];

	return (
		<CommandDialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
			title="Ürün Ara"
			description="Sitemizdeki ürünler arasında arama yapın"
		>
			<CommandInput
				placeholder="Ürün ara..."
				value={searchQuery}
				onValueChange={setSearchQuery}
			/>
			<CommandList>
				{isLoading && (
					<div className="flex h-24 items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				)}
				{!isLoading && debouncedQuery.length > 1 && products.length === 0 && (
					<CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
				)}
				{!isLoading && products.length > 0 && (
					<CommandGroup heading="Ürünler">
						{products.map((product) => (
							<CommandItem
								key={product.id}
								onSelect={() => handleSelect(product.slug)}
								className="flex cursor-pointer items-center gap-3 py-3"
							>
								{product.images?.[0] ? (
									<img
										src={product.images[0]}
										alt={product.name}
										className="h-12 w-12 rounded-md border object-cover"
									/>
								) : (
									<div className="h-12 w-12 rounded-md bg-muted" />
								)}
								<div className="flex flex-col gap-1">
									<span className="font-medium text-foreground text-sm">
										{product.name}
									</span>
									<span className="font-semibold">
										<Price
											amount={product.price}
											size="sm"
											className="text-muted-foreground"
										/>
									</span>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}
				{debouncedQuery.length > 1 && products.length > 0 && (
					<CommandGroup>
						<CommandItem
							onSelect={handleSeeAll}
							className="cursor-pointer justify-center py-3 font-medium text-primary text-sm transition-colors hover:text-primary/90"
						>
							Tüm sonuçları gör
						</CommandItem>
					</CommandGroup>
				)}
			</CommandList>
		</CommandDialog>
	);
}
