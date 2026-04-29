import type { InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "@raunk-butik/api";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Star, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

type AdminReview =
	InferRouterOutputs<AppRouter>["admin"]["getReviews"]["items"][number];

export const Route = createFileRoute("/admin/reviews")({
	component: ReviewsPage,
});

const statusConfig: Record<string, { label: string; className: string }> = {
	approved: {
		label: "Onaylandı",
		className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
	},
	pending: {
		label: "Bekliyor",
		className: "bg-amber-500/15 text-amber-700 border-amber-500/25",
	},
	rejected: {
		label: "Reddedildi",
		className: "bg-red-500/15 text-red-700 border-red-500/25",
	},
};

function ReviewsPage() {
	const queryClient = useQueryClient();
	const { ref, inView } = useInView();

	const {
		data: reviewsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery(
		orpc.admin.getReviews.infiniteOptions({
			input: () => ({ limit: 20 }),
			getNextPageParam: (lastPage: { nextCursor?: number }) =>
				lastPage.nextCursor,
			initialPageParam: 0,
		}),
	);

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const allReviews =
		reviewsData?.pages.flatMap(
			(page: { items: AdminReview[] }) => page.items,
		) || [];

	const updateStatusMutation = useMutation(
		orpc.admin.updateReviewStatus.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getReviews.infiniteKey({
						input: () => ({ limit: 20 }),
						initialPageParam: 0,
					}),
				});
				toast.success("Yorum durumu güncellendi");
			},
		}),
	);

	const deleteMutation = useMutation(
		orpc.admin.deleteReview.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.admin.getReviews.infiniteKey({
						input: () => ({ limit: 20 }),
						initialPageParam: 0,
					}),
				});
				toast.success("Yorum silindi");
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const reviews = allReviews;

	return (
		<div className="space-y-6 p-6 lg:p-8">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Yorum Yönetimi</h1>
				<p className="mt-1 text-muted-foreground">
					Müşterilerinizden gelen ürün yorumlarını inceleyin ve onaylayın.
				</p>
			</div>

			<Card className="border-none shadow-sm">
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="font-semibold text-lg">Son Yorumlar</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50 hover:bg-muted/50">
								<TableHead className="pl-6 font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Müşteri
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Ürün
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Puan
								</TableHead>
								<TableHead className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Yorum
								</TableHead>
								<TableHead className="text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Durum
								</TableHead>
								<TableHead className="pr-6 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">
									İşlemler
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{reviews.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="h-32 text-center text-muted-foreground text-sm"
									>
										Henüz yorum yapılmamış.
									</TableCell>
								</TableRow>
							) : (
								reviews.map((review) => {
									const status =
										statusConfig[review.status] || statusConfig.pending;

									return (
										<TableRow
											key={review.id}
											className="transition-colors hover:bg-muted/30"
										>
											<TableCell className="pl-6">
												<p className="font-medium text-sm">
													{review.user?.name}
												</p>
												<p className="text-muted-foreground text-xs">
													{review.user?.email}
												</p>
											</TableCell>
											<TableCell className="max-w-[180px]">
												<p className="truncate text-sm">
													{review.product?.name}
												</p>
											</TableCell>
											<TableCell>
												<div className="flex gap-0.5">
													{[1, 2, 3, 4, 5].map((star) => (
														<Star
															key={star}
															className={cn(
																"h-3.5 w-3.5",
																star <= review.rating
																	? "fill-amber-400 text-amber-400"
																	: "text-muted-foreground/20",
															)}
														/>
													))}
												</div>
											</TableCell>
											<TableCell className="max-w-sm">
												<p className="line-clamp-2 text-sm">{review.comment}</p>
												<p className="mt-0.5 text-muted-foreground text-xs">
													{new Date(review.createdAt).toLocaleDateString(
														"tr-TR",
													)}
												</p>
											</TableCell>
											<TableCell className="text-center">
												<Badge
													variant="outline"
													className={cn(
														"rounded-md px-2 py-0.5 font-medium text-[11px]",
														status.className,
													)}
												>
													{status.label}
												</Badge>
											</TableCell>
											<TableCell className="pr-6 text-right">
												<div className="flex justify-end gap-1">
													{review.status !== "approved" && (
														<Button
															variant="ghost"
															size="sm"
															className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
															onClick={() =>
																updateStatusMutation.mutate({
																	id: review.id,
																	status: "approved",
																})
															}
															disabled={updateStatusMutation.isPending}
														>
															<Check className="h-4 w-4" />
														</Button>
													)}
													{review.status !== "rejected" && (
														<Button
															variant="ghost"
															size="sm"
															className="h-8 w-8 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
															onClick={() =>
																updateStatusMutation.mutate({
																	id: review.id,
																	status: "rejected",
																})
															}
															disabled={updateStatusMutation.isPending}
														>
															<X className="h-4 w-4" />
														</Button>
													)}
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 text-muted-foreground hover:text-destructive"
														onClick={() => {
															if (
																confirm(
																	"Yorumu tamamen silmek istediğinize emin misiniz?",
																)
															) {
																deleteMutation.mutate({ id: review.id });
															}
														}}
														disabled={deleteMutation.isPending}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
					<div ref={ref} className="flex justify-center py-8">
						{isFetchingNextPage ? (
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						) : hasNextPage ? (
							<Button
								variant="outline"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
							>
								Daha Fazla Yükle
							</Button>
						) : reviews.length > 0 ? (
							<p className="text-muted-foreground text-sm">
								Tüm yorumlar yüklendi
							</p>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
