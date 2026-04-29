import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

interface Coupon {
	id: string;
	code: string;
	discountType: "percentage" | "fixed";
	discountAmount: number;
	minOrderAmount: number;
	usedCount: number;
	isActive: boolean;
}

export const Route = createFileRoute("/admin/coupons")({
	component: CouponsPage,
});

function CouponsPage() {
	const [isOpen, setIsOpen] = useState(false);
	const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

	const queryClient = useQueryClient();

	const { data: coupons, isLoading } = useQuery(
		orpc.admin.getCoupons.queryOptions(),
	);

	const saveMutation = useMutation(
		orpc.admin.saveCoupon.mutationOptions({
			onSuccess: () => {
				toast.success(
					editingCoupon ? "Kupon güncellendi" : "Kupon oluşturuldu",
				);
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getCoupons.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getDashboardStats.queryKey({}),
				});
				setIsOpen(false);
				form.reset();
			},
			onError: (error) => toast.error(error.message || "İşlem başarısız"),
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.deleteCoupon.mutationOptions({
			onSuccess: () => {
				toast.success("Kupon silindi");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getCoupons.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getDashboardStats.queryKey({}),
				});
			},
			onError: (error) =>
				toast.error(error.message || "Silme işlemi başarısız"),
		}),
	);

	const form = useForm({
		defaultValues: {
			code: "",
			discountType: "percentage" as "percentage" | "fixed",
			discountAmount: 0,
			minOrderAmount: 0,
			startDate: null as Date | null,
			endDate: null as Date | null,
			usageLimit: null as number | null,
			isActive: true,
		},
		onSubmit: async ({ value }) => {
			saveMutation.mutate({
				id: editingCoupon?.id,
				...value,
			});
		},
	});

	const handleEdit = (coupon: Coupon) => {
		setEditingCoupon(coupon);
		form.setFieldValue("code", coupon.code);
		form.setFieldValue("discountType", coupon.discountType);
		form.setFieldValue("discountAmount", coupon.discountAmount);
		form.setFieldValue("minOrderAmount", coupon.minOrderAmount);
		setIsOpen(true);
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 lg:p-8">
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Kuponlar</h1>
					<p className="mt-1 text-muted-foreground">
						Müşterileriniz için indirim kodlarını yönetin.
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingCoupon(null);
						form.reset();
						setIsOpen(true);
					}}
					className="h-10 gap-2 px-5"
				>
					<Plus className="h-4 w-4" /> Yeni Kupon
				</Button>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="font-semibold text-lg">
						Aktif Kuponlar
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50 hover:bg-muted/50">
								<TableHead className="pl-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Kupon Kodu
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									İndirim
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Alt Limit
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Kullanım
								</TableHead>
								<TableHead className="pr-6 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
									İşlemler
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{(coupons as Coupon[])?.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="h-32 text-center text-muted-foreground text-sm"
									>
										Henüz kupon oluşturulmamış.
									</TableCell>
								</TableRow>
							) : (
								(coupons as Coupon[])?.map((coupon) => (
									<TableRow
										key={coupon.id}
										className="transition-colors hover:bg-muted/30"
									>
										<TableCell className="pl-6 font-bold font-mono tracking-wider">
											{coupon.code}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className="rounded-md border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 font-medium text-[11px] text-emerald-700"
											>
												{coupon.discountType === "percentage"
													? `%${coupon.discountAmount} İndirim`
													: `${coupon.discountAmount.toLocaleString("tr-TR")} TL İndirim`}
											</Badge>
										</TableCell>
										<TableCell className="text-sm">
											{coupon.minOrderAmount > 0
												? `${coupon.minOrderAmount.toLocaleString("tr-TR")} TL ve üzeri`
												: "Limit yok"}
										</TableCell>
										<TableCell className="font-mono text-sm tabular-nums">
											{coupon.usedCount}
										</TableCell>
										<TableCell className="pr-6 text-right">
											<div className="flex justify-end gap-1">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 text-muted-foreground"
													onClick={() => handleEdit(coupon)}
												>
													<Pen className="h-3.5 w-3.5" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 text-muted-foreground hover:text-destructive"
													onClick={() => {
														if (
															confirm(
																"Bu kuponu silmek istediğinize emin misiniz?",
															)
														) {
															deleteMutation.mutate({ id: coupon.id });
														}
													}}
													disabled={deleteMutation.isPending}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog
				open={isOpen}
				onOpenChange={(open) => {
					setIsOpen(open);
					if (!open) {
						setEditingCoupon(null);
						form.reset();
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<DialogHeader>
							<DialogTitle>
								{editingCoupon ? "Kuponu Düzenle" : "Yeni Kupon"}
							</DialogTitle>
							<DialogDescription>
								Kupon detaylarını belirleyin.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<form.Field name="code">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Kupon Kodu
										</FieldLabel>
										<Input
											className="h-10 font-bold uppercase"
											placeholder="ÖRN: MEVSIM20"
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(e.target.value.toUpperCase())
											}
										/>
									</div>
								)}
							</form.Field>
							<div className="grid grid-cols-2 gap-4">
								<form.Field name="discountType">
									{(field) => (
										<div className="grid gap-2">
											<FieldLabel className="font-medium text-sm">
												Tür
											</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={(val) =>
													field.handleChange(val as "percentage" | "fixed")
												}
											>
												<SelectTrigger className="h-10">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="percentage">Yüzde (%)</SelectItem>
													<SelectItem value="fixed">Sabit (TL)</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</form.Field>
								<form.Field name="discountAmount">
									{(field) => (
										<div className="grid gap-2">
											<FieldLabel className="font-medium text-sm">
												Miktar
											</FieldLabel>
											<Input
												className="h-10"
												type="number"
												value={field.state.value}
												onChange={(e) =>
													field.handleChange(
														Number.parseFloat(e.target.value) || 0,
													)
												}
											/>
										</div>
									)}
								</form.Field>
							</div>
							<form.Field name="minOrderAmount">
								{(field) => (
									<div className="grid gap-2">
										<FieldLabel className="font-medium text-sm">
											Minimum Sipariş Tutarı
										</FieldLabel>
										<Input
											className="h-10"
											type="number"
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(
													Number.parseFloat(e.target.value) || 0,
												)
											}
										/>
									</div>
								)}
							</form.Field>
						</div>
						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
							>
								Vazgeç
							</Button>
							<Button type="submit" disabled={saveMutation.isPending}>
								{saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
