import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { Price } from "./price";

interface CartSheetProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CartSheet({ isOpen, onClose }: CartSheetProps) {
	const { items, removeItem, updateQuantity, totalPrice } = useCart();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const { data: settings } = useQuery(
		orpc.settings.getPublicSettings.queryOptions(),
	);

	if (!mounted) return null;

	const freeShippingThreshold = settings?.freeShippingThreshold
		? Number(settings.freeShippingThreshold)
		: null;
	const remainingForFreeShipping = freeShippingThreshold
		? freeShippingThreshold - totalPrice
		: null;

	return (
		<>
			{/* Backdrop */}
			{isOpen && (
				<button
					type="button"
					className="fixed inset-0 z-50 h-full w-full cursor-default bg-black/50 backdrop-blur-sm transition-opacity"
					onClick={onClose}
					aria-label="Close cart"
				/>
			)}

			{/* Sidebar */}
			<div
				className={cn(
					"fixed inset-y-0 right-0 z-50 h-full w-full max-w-md bg-background shadow-xl transition-transform duration-300 ease-in-out sm:max-w-lg",
					isOpen ? "translate-x-0" : "translate-x-full",
				)}
			>
				<div className="flex h-full flex-col">
					<div className="flex items-center justify-between border-b px-6 py-4">
						<h2 className="flex items-center gap-2 font-semibold font-serif text-lg">
							<ShoppingBag className="h-5 w-5" /> Sepetim ({items.length})
						</h2>
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="h-5 w-5" />
						</Button>
					</div>

					<div className="flex-1 space-y-6 overflow-y-auto p-6">
						{items.length === 0 ? (
							<div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
								<ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
								<p className="text-lg text-muted-foreground">Sepetiniz boş.</p>
								<Button variant="outline" onClick={onClose}>
									Alışverişe Başla
								</Button>
							</div>
						) : (
							<div className="space-y-6">
								{items.map((item) => (
									<div
										key={`${item.productId}-${item.size}-${item.color}`}
										className="flex gap-4"
									>
										<div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
											<img
												src={item.image}
												alt={item.name}
												className="h-full w-full object-cover"
											/>
										</div>
										<div className="flex flex-1 flex-col justify-between">
											<div className="flex justify-between space-x-2">
												<div>
													<h3 className="line-clamp-2 font-medium text-sm">
														{item.name}
													</h3>
													<p className="mt-1 text-muted-foreground text-xs">
														{item.size} / {item.color}
													</p>
												</div>
												<p className="font-medium text-sm">
													<Price amount={item.price} size="sm" />
												</p>
											</div>
											<div className="flex items-center justify-between">
												<div className="flex items-center rounded-md border">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 rounded-none border-r"
														onClick={() =>
															updateQuantity(item.id, item.quantity - 1)
														}
														disabled={item.quantity <= 1}
													>
														<Minus className="h-3 w-3" />
													</Button>
													<span className="w-8 text-center text-sm">
														{item.quantity}
													</span>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 rounded-none border-l"
														onClick={() => {
															if (item.quantity < item.stock) {
																updateQuantity(item.id, item.quantity + 1);
															} else {
																toast.error("Üzgünüz, daha fazla stok yok.");
															}
														}}
														disabled={item.quantity >= item.stock}
													>
														<Plus className="h-3 w-3" />
													</Button>
												</div>
												{item.stock <= 5 && (
													<span className="font-bold text-[10px] text-amber-600 uppercase">
														Son {item.stock} Adet!
													</span>
												)}
												<Button
													variant="ghost"
													size="sm"
													className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
													onClick={() => removeItem(item.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{items.length > 0 && (
						<div className="space-y-4 border-t bg-background p-6">
							<div className="flex items-center justify-between font-medium text-base">
								<span>Ara Toplam</span>
								<Price amount={totalPrice} size="lg" />
							</div>

							{freeShippingThreshold && remainingForFreeShipping !== null ? (
								<div className="mt-2 text-center font-medium text-sm">
									{remainingForFreeShipping > 0 ? (
										<p className="text-muted-foreground">
											Kargo bedava için{" "}
											<span className="font-bold text-primary">
												<Price
													amount={remainingForFreeShipping}
													size="sm"
													className="text-primary"
												/>
											</span>{" "}
											daha Sepete Ekle
										</p>
									) : (
										<p className="font-bold text-emerald-600">
											Kargo BİZDEN! Siparişiniz ücretsiz kargolanacak.
										</p>
									)}
								</div>
							) : (
								<p className="text-muted-foreground text-xs">
									Kargo ve vergiler ödeme adımında hesaplanır.
								</p>
							)}

							<Link to="/checkout" onClick={onClose}>
								<Button
									className="h-12 w-full text-lg"
									disabled={items.length === 0}
								>
									Ödemeye Geç
								</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
