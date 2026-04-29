import { Ruler } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export function SizeGuideModal() {
	return (
		<Dialog>
			<DialogTrigger
				render={
					<button
						type="button"
						className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					/>
				}
			>
				<Ruler className="h-4 w-4" />
				<span>Beden Tablosu</span>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Beden Tablosu</DialogTitle>
					<DialogDescription>
						Doğru bedeni bulmak için ölçülerinizi aşağıdaki tabloyla
						karşılaştırabilirsiniz. (Ölçüler cm cinsindendir)
					</DialogDescription>
				</DialogHeader>

				<div className="mt-4 overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50">
								<TableHead className="w-[100px] font-bold">Beden</TableHead>
								<TableHead className="text-center font-bold">Göğüs</TableHead>
								<TableHead className="text-center font-bold">Bel</TableHead>
								<TableHead className="text-center font-bold">Basen</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">XS</TableCell>
								<TableCell className="text-center">82-86</TableCell>
								<TableCell className="text-center">62-66</TableCell>
								<TableCell className="text-center">88-92</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">S</TableCell>
								<TableCell className="text-center">86-90</TableCell>
								<TableCell className="text-center">66-70</TableCell>
								<TableCell className="text-center">92-96</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">M</TableCell>
								<TableCell className="text-center">90-94</TableCell>
								<TableCell className="text-center">70-74</TableCell>
								<TableCell className="text-center">96-100</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">L</TableCell>
								<TableCell className="text-center">94-98</TableCell>
								<TableCell className="text-center">74-78</TableCell>
								<TableCell className="text-center">100-104</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">XL</TableCell>
								<TableCell className="text-center">98-102</TableCell>
								<TableCell className="text-center">78-82</TableCell>
								<TableCell className="text-center">104-108</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</DialogContent>
		</Dialog>
	);
}
