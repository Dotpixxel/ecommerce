import type { QueryClient } from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { Session, User } from "better-auth";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import type { orpc } from "@/utils/orpc";
import { seo } from "@/utils/seo";
import Footer from "../components/footer";
import Header from "../components/header";
import appCss from "../index.css?url";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
	auth?: {
		session: Session | null;
		user: User | null;
	};
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			...seo({
				title: "Raunk Butik",
				description:
					"Raunk Butik - Modern silüetler ve zamansız parçalarla stilinizi yenileyin. En yeni moda trendleri, elbiseler ve aksesuarlar.",
				keywords: "raunk butik, moda, giyim, aksesuar, kadın giyim",
			}),
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/logo/favicon.svg",
			},
			{
				rel: "icon",
				type: "image/png",
				href: "/logo/favicon.png",
			},
			{
				rel: "apple-touch-icon",
				href: "/logo/favicon.png",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
		],
		scripts:
			import.meta.env.MODE === "production"
				? [
						{
							type: "text/javascript",
							children: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1625266505387033');
fbq('track', 'PageView');
							`,
						},
					]
				: [],
	}),

	component: RootDocument,
	errorComponent: ({ error }) => {
		console.error("Root error:", error);
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
				<h1 className="mb-4 font-serif text-4xl">Bir Hata Oluştu</h1>
				<p className="mb-8 max-w-md text-muted-foreground">
					Üzgünüz, bir sorunla karşılaştık. Lütfen sayfayı yenilemeyi deneyin.
				</p>
				<Button onClick={() => window.location.reload()}>Yeniden Dene</Button>
			</div>
		);
	},
	notFoundComponent: () => {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
				<h1 className="mb-4 font-serif text-4xl">Sayfa Bulunamadı</h1>
				<p className="mb-8 text-muted-foreground">
					Aradığınız sayfa mevcut değil veya taşınmış olabilir.
				</p>
				<Link to="/">
					<Button>Ana Sayfaya Dön</Button>
				</Link>
			</div>
		);
	},
});

import { MetaPixel } from "../components/meta-pixel";
import WhatsAppButton from "../components/whatsapp-button";

function RootDocument() {
	return (
		<html lang="tr" className="font-sans">
			<head>
				<HeadContent />
			</head>
			<body>
				<Header />
				<main className="min-h-[80vh]">
					<Outlet />
				</main>
				<WhatsAppButton />
				<Footer />
				<Toaster richColors />
				<TanStackRouterDevtools position="bottom-left" />
				<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
				<Scripts />
				<MetaPixel />
			</body>
		</html>
	);
}
