import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Briefcase,
	Edit,
	Home,
	Loader2,
	MapPin,
	Phone,
	Plus,
	Trash2,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddressSelect } from "@/components/ui/address-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	useDistricts,
	useNeighborhoods,
	useProvinces,
} from "@/hooks/use-turkish-address";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/addresses")({
	component: AddressesPage,
});

interface Address {
	id: string;
	userId: string;
	title: string;
	name: string;
	surname: string;
	phone: string;
	city: string;
	district: string;
	neighborhood: string;
	addressDetail: string;
	zipCode: string;
	createdAt: string | Date;
	updatedAt: string | Date;
}

function AddressesPage() {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);
	const [editingAddress, setEditingAddress] = useState<Address | null>(null);

	const { data: addresses, isLoading } = useQuery(
		orpc.user.getAddresses.queryOptions(),
	);

	const saveMutation = useMutation(
		orpc.user.saveAddress.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.user.getAddresses.queryKey(),
				});
				toast.success("Adres başarıyla kaydedildi");
				setIsOpen(false);
				setEditingAddress(null);
			},
			onError: (error) => {
				toast.error(error.message || "Adres kaydedilirken bir hata oluştu");
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.user.deleteAddress.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.user.getAddresses.queryKey(),
				});
				toast.success("Adres silindi");
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="animate-pulse space-y-6">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div className="space-y-2">
						<div className="h-10 w-48 rounded bg-muted/50" />
						<div className="h-4 w-64 rounded bg-muted/30" />
					</div>
					<div className="h-12 w-48 rounded bg-muted/50" />
				</div>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{[1, 2].map((i) => (
						<div key={i} className="h-48 rounded-xl border bg-muted/20" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="fade-in slide-in-from-bottom-2 animate-in space-y-8 duration-500">
			<div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
				<div className="space-y-1">
					<h1 className="font-bold font-serif text-3xl text-foreground tracking-tight md:text-4xl">
						Adreslerim
					</h1>
					<p className="font-medium text-muted-foreground">
						Kayıtlı teslimat adreslerinizi yönetin.
					</p>
				</div>
				<Button
					size="lg"
					className="h-12 rounded-lg px-6 font-bold shadow-md transition-all hover:bg-primary/90"
					onClick={() => {
						setEditingAddress(null);
						setIsOpen(true);
					}}
				>
					<Plus className="mr-2 h-5 w-5" /> Yeni Adres Ekle
				</Button>
			</div>

			{!addresses || addresses.length === 0 ? (
				<Card className="rounded-xl border-2 border-dashed bg-muted/5 py-20 text-center">
					<CardContent className="flex flex-col items-center">
						<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 text-muted-foreground/30">
							<MapPin className="h-8 w-8" />
						</div>
						<h3 className="font-bold font-serif text-2xl tracking-tight">
							Henüz adresiniz yok
						</h3>
						<p className="mx-auto mt-2 max-w-xs font-medium text-muted-foreground">
							Siparişlerinizi hızlandırmak için bir adres kaydedin.
						</p>
						<Button
							variant="outline"
							className="mt-8 rounded-lg px-6 font-bold"
							onClick={() => setIsOpen(true)}
						>
							İlk Adresimi Ekle
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{addresses.map((address) => {
						const isHome = address.title
							.toLocaleLowerCase("tr-TR")
							.includes("ev");
						const isWork =
							address.title.toLocaleLowerCase("tr-TR").includes("iş") ||
							address.title.toLocaleLowerCase("tr-TR").includes("is");

						return (
							<Card
								key={address.id}
								className="group overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
							>
								<CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 p-5">
									<CardTitle className="flex items-center gap-2 font-bold text-lg">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
											{isHome ? (
												<Home className="h-5 w-5" />
											) : isWork ? (
												<Briefcase className="h-5 w-5" />
											) : (
												<User className="h-5 w-5" />
											)}
										</div>
										{address.title}
									</CardTitle>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary"
											onClick={() => {
												setEditingAddress(address);
												setIsOpen(true);
											}}
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
											onClick={() => {
												if (
													confirm("Bu adresi silmek istediğinize emin misiniz?")
												) {
													deleteMutation.mutate({ id: address.id });
												}
											}}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>
								<CardContent className="p-6">
									<div className="space-y-4">
										<div>
											<p className="font-bold text-sm tracking-tight">
												{address.name} {address.surname}
											</p>
											<p className="mt-1 flex items-center gap-1.5 font-bold text-primary text-xs">
												<Phone className="h-3 w-3" /> {address.phone}
											</p>
										</div>

										<div className="rounded-lg border bg-muted/10 p-4">
											<p className="font-medium text-muted-foreground text-sm leading-relaxed">
												{address.addressDetail}
												<br />
												{address.neighborhood}, {address.district}
												<br />
												<span className="font-bold text-foreground">
													{address.city}, {address.zipCode}
												</span>
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			<AddressDialog
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onSave={(data) =>
					saveMutation.mutate(
						data as {
							id?: string;
							title: string;
							name: string;
							surname: string;
							phone: string;
							city: string;
							district: string;
							neighborhood: string;
							addressDetail: string;
							zipCode: string;
						},
					)
				}
				initialData={editingAddress}
				isPending={saveMutation.isPending}
			/>
		</div>
	);
}

interface AddressDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: Partial<Address>) => void;
	initialData: Address | null;
	isPending: boolean;
}

function AddressDialog({
	isOpen,
	onClose,
	onSave,
	initialData,
	isPending,
}: AddressDialogProps) {
	const [formData, setFormData] = useState<Partial<Address>>({
		title: "",
		name: "",
		surname: "",
		phone: "",
		city: "",
		district: "",
		neighborhood: "",
		addressDetail: "",
		zipCode: "",
	});

	const [provinceId, setProvinceId] = useState<string>("");
	const [districtId, setDistrictId] = useState<string>("");

	const { data: provinces = [] } = useProvinces();
	const { data: districts = [], isLoading: isDistrictsLoading } =
		useDistricts(provinceId);
	const { data: neighborhoods = [], isLoading: isNeighborhoodsLoading } =
		useNeighborhoods(districtId);

	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				setFormData(initialData);
				if (provinces.length > 0) {
					const province = provinces.find(
						(p) =>
							p.name.toLocaleLowerCase("tr-TR") ===
							initialData.city.toLocaleLowerCase("tr-TR"),
					);
					if (province) {
						setProvinceId(province.id.toString());
					}
				}
			} else {
				setFormData({
					title: "",
					name: "",
					surname: "",
					phone: "",
					city: "",
					district: "",
					neighborhood: "",
					addressDetail: "",
					zipCode: "",
				});
				setProvinceId("");
				setDistrictId("");
			}
		}
	}, [initialData, isOpen, provinces]);

	useEffect(() => {
		if (provinceId && districts.length > 0 && initialData && !districtId) {
			const district = districts.find(
				(d) =>
					d.name.toLocaleLowerCase("tr-TR") ===
					initialData.district.toLocaleLowerCase("tr-TR"),
			);
			if (district) {
				setDistrictId(district.id.toString());
			}
		}
	}, [provinceId, districts, initialData, districtId]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setFormData({ ...formData, [e.target.id]: e.target.value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSave(formData);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-[600px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle className="font-bold font-serif text-2xl tracking-tight">
							{initialData ? "Adresi Düzenle" : "Yeni Adres Ekle"}
						</DialogTitle>
						<DialogDescription className="font-medium text-muted-foreground">
							Teslimat bilgilerini doldurunuz.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-5 py-6">
						<div className="grid gap-2">
							<Label
								htmlFor="title"
								className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider"
							>
								Adres Başlığı
							</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={handleChange}
								required
								className="h-12 rounded-lg border-2 font-bold"
								placeholder="Örn: Ev, İş"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label
									htmlFor="name"
									className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider"
								>
									Ad
								</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={handleChange}
									required
									className="h-12 rounded-lg border-2 font-bold"
								/>
							</div>
							<div className="grid gap-2">
								<Label
									htmlFor="surname"
									className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider"
								>
									Soyad
								</Label>
								<Input
									id="surname"
									value={formData.surname}
									onChange={handleChange}
									required
									className="h-12 rounded-lg border-2 font-bold"
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor="phone"
								className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider"
							>
								Telefon
							</Label>
							<Input
								id="phone"
								value={formData.phone}
								onChange={handleChange}
								required
								className="h-12 rounded-lg border-2 font-bold font-mono"
								placeholder="05XX"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
									Şehir
								</Label>
								<AddressSelect
									items={provinces.map((p) => ({
										id: p.id.toString(),
										name: p.name,
									}))}
									value={provinceId}
									onSelect={(id, name) => {
										setProvinceId(id);
										setFormData((prev) => ({
											...prev,
											city: name,
											district: "",
											neighborhood: "",
										}));
										setDistrictId("");
									}}
									placeholder="Şehir Seçin"
								/>
							</div>
							<div className="grid gap-2">
								<Label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
									İlçe
								</Label>
								<AddressSelect
									items={districts.map((d) => ({
										id: d.id.toString(),
										name: d.name,
									}))}
									value={districtId}
									onSelect={(id, name) => {
										setDistrictId(id);
										setFormData((prev) => ({
											...prev,
											district: name,
											neighborhood: "",
										}));
									}}
									disabled={!provinceId || isDistrictsLoading}
									placeholder="İlçe Seçin"
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
									Mahalle
								</Label>
								<AddressSelect
									items={neighborhoods.map((n) => ({
										id: n.id.toString(),
										name: n.name,
									}))}
									value={
										neighborhoods
											.find((n) => n.name === formData.neighborhood)
											?.id.toString() || ""
									}
									onSelect={(_, name) => {
										setFormData((prev) => ({ ...prev, neighborhood: name }));
									}}
									disabled={!districtId || isNeighborhoodsLoading}
									placeholder="Mahalle Seçin"
								/>
							</div>
							<div className="grid gap-2">
								<Label
									htmlFor="zipCode"
									className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider"
								>
									Posta Kodu
								</Label>
								<Input
									id="zipCode"
									value={formData.zipCode}
									onChange={handleChange}
									required
									className="h-12 rounded-lg border-2 font-bold"
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor="addressDetail"
								className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider"
							>
								Adres Detayı
							</Label>
							<Textarea
								id="addressDetail"
								value={formData.addressDetail}
								onChange={handleChange}
								required
								className="min-h-[100px] rounded-lg border-2 font-medium"
								placeholder="Sokak, bina no..."
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="submit"
							className="h-12 w-full rounded-lg font-bold shadow-md"
							disabled={isPending}
						>
							{isPending ? (
								<Loader2 className="mr-2 h-5 w-5 animate-spin" />
							) : null}
							Adresi Kaydet
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
