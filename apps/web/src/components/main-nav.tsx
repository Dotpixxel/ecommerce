import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { orpc } from "@/utils/orpc";
import { buildTree } from "@/utils/tree";

interface Category {
	id: string;
	name: string;
	slug: string;
	parentId: string | null;
	order: number;
	isActive: boolean;
	imageUrl: string | null;
	children: Category[];
}

export function MainNav() {
	const { data: categories } = useQuery(
		orpc.product.getCategories.queryOptions(),
	);

	// Group categories by parent using buildTree utility
	const tree = React.useMemo(() => {
		if (!categories) return [];
		return buildTree(categories as Category[]);
	}, [categories]);

	const MAX_VISIBLE_CATEGORIES = 4;
	const visibleCategories = tree.slice(0, MAX_VISIBLE_CATEGORIES);
	const overflowCategories = tree.slice(MAX_VISIBLE_CATEGORIES);

	return (
		<NavigationMenu className="hidden md:flex">
			<NavigationMenuList className="gap-2">
				<NavigationMenuItem>
					<Link
						to="/products"
						className={cn(
							navigationMenuTriggerStyle(),
							"bg-transparent hover:bg-transparent hover:text-primary focus:bg-transparent",
						)}
					>
						YENİ GELENLER
					</Link>
				</NavigationMenuItem>

				{visibleCategories.map((parent) => (
					<NavigationMenuItem key={parent.id}>
						{parent.children && parent.children.length > 0 ? (
							<>
								<NavigationMenuTrigger className="bg-transparent font-medium hover:bg-transparent hover:text-primary focus:bg-transparent data-[state=open]:bg-transparent">
									{parent.name.toUpperCase()}
								</NavigationMenuTrigger>
								<NavigationMenuContent>
									<ul className="flex w-[200px] flex-col gap-1 p-3">
										{parent.children?.map((child) => (
											<ListItem
												key={child.id}
												title={child.name}
												href={`/products?categoryId=${child.id}`}
											/>
										))}
									</ul>
								</NavigationMenuContent>
							</>
						) : (
							<Link
								to="/products"
								search={{ categoryId: parent.id }}
								className={cn(
									navigationMenuTriggerStyle(),
									"bg-transparent font-medium hover:bg-transparent hover:text-primary focus:bg-transparent",
								)}
							>
								{parent.name.toUpperCase()}
							</Link>
						)}
					</NavigationMenuItem>
				))}

				{overflowCategories.length > 0 && (
					<NavigationMenuItem>
						<NavigationMenuTrigger className="bg-transparent font-medium hover:bg-transparent hover:text-primary focus:bg-transparent data-[state=open]:bg-transparent">
							DAHA FAZLA
						</NavigationMenuTrigger>
						<NavigationMenuContent>
							<ul className="grid w-[400px] grid-cols-2 gap-3 p-4">
								{overflowCategories.map((parent) => (
									<ListItem
										key={parent.id}
										title={parent.name}
										href={`/products?categoryId=${parent.id}`}
									>
										{parent.children && parent.children.length > 0
											? `${parent.children.length} alt kategori`
											: undefined}
									</ListItem>
								))}
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>
				)}

				<NavigationMenuItem className="ml-2">
					<Link
						to="/"
						className={cn(
							navigationMenuTriggerStyle(),
							"whitespace-nowrap bg-transparent font-bold text-red-600 hover:bg-transparent hover:text-red-700 focus:bg-transparent",
						)}
					>
						ÇOK SATANLAR
					</Link>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

const ListItem = React.forwardRef<
	React.ElementRef<"a">,
	React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
	return (
		<li>
			<NavigationMenuLink asChild>
				<a
					ref={ref}
					className={cn(
						"group block select-none rounded-sm px-4 py-1.5 text-sm no-underline outline-none transition-all hover:bg-muted/30 focus:bg-muted/30",
						className,
					)}
					{...props}
				>
					<div className="font-medium leading-none transition-colors group-hover:text-primary">
						{title}
					</div>
					{children && (
						<div className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-snug">
							{children}
						</div>
					)}
				</a>
			</NavigationMenuLink>
		</li>
	);
});
ListItem.displayName = "ListItem";
