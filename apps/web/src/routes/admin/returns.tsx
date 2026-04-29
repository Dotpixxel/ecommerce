/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, Loader2, X } from "lucide-react";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/returns")({
	component: ReturnsPage,
});

const statusConfig: Record<string, { label: string; className: string }> = {
	pending: {
		label: "Bekliyor",
		className: "bg-amber-500/15 text-amber-700 border-amber-500/25",
	},
	approved: {
		label: "Onaylandı",
		className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
	},
	rejected: {
		label: "Reddedildi",
		className: "bg-red-500/15 text-red-700 border-red-500/25",
	},
};

function ReturnsPage() {
	const queryClient = useQueryClient();
	const { data: returnRequests, isLoading } = useQuery(
		orpc.admin.getReturnRequests.queryOptions(),
	);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState<{ id: string } | null>(
		null,
	);
	const [actionType, setActionType] = useState<"approve" | "reject" | null>(
		null,
	);
	const [adminNote, setAdminNote] = useState("");

	const statusMutation = useMutation(
		orpc.admin.updateReturnRequestStatus.mutationOptions({
			onSuccess: () => {
				toast.success("Talep durumu güncellendi");
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getReturnRequests.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.order.admin_getOrders.queryKey({
						input: {},
					}),
				});
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getDashboardStats.queryKey(),
				});
				setIsDialogOpen(false);
				setAdminNote("");
				setSelectedRequest(null);
			},
			onError: (error) => {
				toast.error(error.message || "İşlem başarısız");
			},
		}),
	);

	const handleAction = (
		request: { id: string },
		action: "approve" | "reject",
	) => {
		setSelectedRequest(request);
		setActionType(action);
		setAdminNote("");
		setIsDialogOpen(true);
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
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					İade ve İptal Talepleri
				</h1>
				<p className="mt-1 text-muted-foreground">
					Müşterilerden gelen iade ve iptal taleplerini yönetin.
				</p>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="font-semibold text-lg">Talep Listesi</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50 hover:bg-muted/50">
								<TableHead className="pl-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Müşteri & Tarih
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Tür
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Sipariş No
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Sebep
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Durum
								</TableHead>
								<TableHead className="pr-6 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
									İşlem
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{returnRequests?.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={6}
										className="h-32 text-center text-muted-foreground text-sm"
									>
										Henüz bir talep bulunmuyor.
									</TableCell>
								</TableRow>
							)}
							{returnRequests?.map((req) => {
								const st = statusConfig[req.status] || statusConfig.pending;

								return (
									<TableRow
										key={req.id}
										className="transition-colors hover:bg-muted/30"
									>
										<TableCell className="pl-6">
											<p className="font-medium text-sm">
												{req.order?.shippingAddress?.name &&
												req.order?.shippingAddress?.surname
													? `${req.order.shippingAddress.name} ${req.order.shippingAddress.surname}`
													: req.user?.name || "İsimsiz Müşteri"}
											</p>
											<p className="text-muted-foreground text-xs">
												{format(new Date(req.createdAt), "dd MMM yyyy HH:mm", {
													locale: tr,
												})}
											</p>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={cn(
													"rounded-md px-2 py-0.5 font-medium text-[11px]",
													req.type === "cancel"
														? "border-amber-500/25 bg-amber-500/15 text-amber-700"
														: "border-violet-500/25 bg-violet-500/15 text-violet-700",
												)}
											>
												{req.type === "cancel" ? "İptal" : "İade"}
											</Badge>
										</TableCell>
										<TableCell className="font-medium font-mono text-xs">
											#{req.orderId.toUpperCase().slice(0, 8)}
										</TableCell>
										<TableCell>
											<p
												className="max-w-[250px] truncate text-sm"
												title={req.reason}
											>
												{req.reason}
											</p>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={cn(
													"rounded-md px-2 py-0.5 font-medium text-[11px]",
													st.className,
												)}
											>
												{st.label}
											</Badge>
										</TableCell>
										<TableCell className="pr-6 text-right">
											{req.status === "pending" ? (
												<div className="flex justify-end gap-1">
													<Button
														size="sm"
														variant="ghost"
														className="h-8 gap-1 text-emerald-600 text-xs hover:bg-emerald-500/10"
														onClick={() => handleAction(req, "approve")}
													>
														<Check className="h-3.5 w-3.5" /> Onayla
													</Button>
													<Button
														size="sm"
														variant="ghost"
														className="h-8 gap-1 text-red-600 text-xs hover:bg-red-500/10"
														onClick={() => handleAction(req, "reject")}
													>
														<X className="h-3.5 w-3.5" /> Reddet
													</Button>
												</div>
											) : (
												<span className="text-muted-foreground text-xs">
													Tamamlandı
												</span>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							Talebi {actionType === "approve" ? "Onayla" : "Reddet"}
						</DialogTitle>
						<DialogDescription>
							Müşteriye iletilecek bir not ekleyebilirsiniz.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Textarea
							placeholder="Opsiyonel yönetici notu..."
							value={adminNote}
							onChange={(e) => setAdminNote(e.target.value)}
						/>
					</div>
					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							Vazgeç
						</Button>
						<Button
							variant={actionType === "approve" ? "default" : "destructive"}
							onClick={() => {
								if (selectedRequest && actionType) {
									statusMutation.mutate({
										id: selectedRequest.id,
										status: actionType === "approve" ? "approved" : "rejected",
										adminNote: adminNote || undefined,
									});
								}
							}}
							disabled={statusMutation.isPending}
						>
							{statusMutation.isPending ? "İşleniyor..." : "Onayla"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
