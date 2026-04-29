import type { InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "@raunk-butik/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export interface CartItem {
	id: string;
	productId: string;
	name: string;
	price: number;
	image: string;
	quantity: number;
	size?: string;
	color?: string;
	slug: string;
	stock: number;
}

type ServerCartItem = InferRouterOutputs<AppRouter>["cart"]["getCart"][number];

export function useCart() {
	const queryClient = useQueryClient();

	const { data: cartItems = [], isLoading } = useQuery(
		orpc.cart.getCart.queryOptions({}),
	);

	const addItemMutation = useMutation(
		orpc.cart.addItem.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.cart.getCart.queryKey({}),
				});
				toast.success("Ürün sepete eklendi");
			},
			onError: (error) => {
				toast.error("Ürün eklenirken bir hata oluştu");
				console.error(error);
			},
		}),
	);

	const updateQuantityMutation = useMutation(
		orpc.cart.updateQuantity.mutationOptions({
			onMutate: async (variables) => {
				// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
				await queryClient.cancelQueries({
					queryKey: orpc.cart.getCart.queryKey({}),
				});

				// Snapshot the previous value
				const previousCart = queryClient.getQueryData<ServerCartItem[]>(
					orpc.cart.getCart.queryKey({}),
				);

				// Optimistically update to the new value
				if (previousCart) {
					queryClient.setQueryData<ServerCartItem[]>(
						orpc.cart.getCart.queryKey({}),
						previousCart.map((item) =>
							item.id === variables.id
								? { ...item, quantity: variables.quantity }
								: item,
						),
					);
				}

				return { previousCart };
			},
			onError: (_err, _variables, context) => {
				// If the mutation fails, use the context returned from onMutate to roll back
				if (context?.previousCart) {
					queryClient.setQueryData(
						orpc.cart.getCart.queryKey({}),
						context.previousCart,
					);
				}
				toast.error("Miktar güncellenirken bir hata oluştu");
			},
			onSettled: () => {
				// Always refetch after error or success to promise the server state is synced
				queryClient.invalidateQueries({
					queryKey: orpc.cart.getCart.queryKey({}),
				});
			},
		}),
	);

	const removeItemMutation = useMutation(
		orpc.cart.removeItem.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.cart.getCart.queryKey({}),
				});
				toast.success("Ürün sepetten çıkarıldı");
			},
		}),
	);

	const clearCartMutation = useMutation(
		orpc.cart.clearCart.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.cart.getCart.queryKey({}),
				});
			},
		}),
	);

	// Transforming server data to match the UI's CartItem interface
	const items: CartItem[] = cartItems.map((item) => ({
		id: item.id,
		productId: item.productId,
		name: item.product.name,
		price: item.product.price,
		image: item.product.images[0],
		quantity: item.quantity,
		size: item.size ?? undefined,
		color: item.color ?? undefined,
		slug: item.product.slug,
		stock: item.product.stock,
	}));

	const totalItems = items.reduce((total, item) => total + item.quantity, 0);
	const totalPrice = items.reduce(
		(total, item) => total + item.price * item.quantity,
		0,
	);

	const { data: session } = authClient.useSession();
	const [pendingItem, setPendingItem] = useState<{
		productId: string;
		quantity?: number;
		size?: string;
		color?: string;
	} | null>(null);

	const addItem = (item: {
		productId: string;
		quantity?: number;
		size?: string;
		color?: string;
	}) => {
		if (!session) {
			setPendingItem(item);
			return;
		}
		addItemMutation.mutate(item);
	};

	const confirmAddItem = () => {
		if (pendingItem) {
			addItemMutation.mutate(pendingItem);
			setPendingItem(null);
		}
	};

	return {
		items,
		isLoading,
		addItem,
		confirmAddItem,
		pendingItem,
		clearPendingItem: () => setPendingItem(null),
		removeItem: (id: string) => removeItemMutation.mutate({ id }),
		updateQuantity: (id: string, quantity: number) =>
			updateQuantityMutation.mutate({ id, quantity }),
		clearCart: () => clearCartMutation.mutate({}),
		totalItems,
		totalPrice,
		isAddingItem: addItemMutation.isPending,
	};
}
