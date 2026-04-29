import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AddressSelectItem {
	id: string;
	name: string;
}

interface AddressSelectProps {
	items: AddressSelectItem[];
	value: string;
	onSelect: (id: string, name: string) => void;
	placeholder: string;
	disabled?: boolean;
	className?: string;
}

export function AddressSelect({
	items,
	value,
	onSelect,
	placeholder,
	disabled,
	className,
}: AddressSelectProps) {
	const [open, setOpen] = useState(false);
	const selectedItem = items.find((item) => item.id === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className={cn("w-full justify-between font-normal", className)}
						disabled={disabled}
					/>
				}
			>
				{selectedItem ? selectedItem.name : placeholder}
				<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</PopoverTrigger>
			<PopoverContent className="w-(--radix-popover-trigger-width) border border-border p-0 shadow-md">
				<Command>
					<CommandInput placeholder="Ara..." />
					<CommandList>
						<CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
						<CommandGroup>
							<ScrollArea className="h-64">
								{items.map((item) => (
									<CommandItem
										key={item.id}
										value={item.name}
										onSelect={() => {
											onSelect(item.id, item.name);
											setOpen(false);
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === item.id ? "opacity-100" : "opacity-0",
											)}
										/>
										{item.name}
									</CommandItem>
								))}
							</ScrollArea>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
