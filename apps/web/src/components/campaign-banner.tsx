import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/utils/orpc";

export function CampaignBanner() {
	const [isVisible, setIsVisible] = useState(true);
	const { data: campaigns } = useQuery(orpc.campaign.getActive.queryOptions());

	const activeCampaign = campaigns?.[0];

	if (!isVisible || !activeCampaign || activeCampaign.showBanner === false)
		return null;

	return (
		<div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-red-600 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<p className="text-[13px] text-white leading-6 tracking-tight antialiased">
					<strong className="font-medium">{activeCampaign.title}</strong>
					<svg
						viewBox="0 0 2 2"
						className="mx-2 inline h-0.5 w-0.5 fill-current opacity-50"
						aria-hidden="true"
					>
						<circle cx="1" cy="1" r="1" />
					</svg>
					<span className="opacity-90">{activeCampaign.description}</span>
				</p>
				{activeCampaign.linkUrl && (
					<a
						href={activeCampaign.linkUrl}
						className="flex-none rounded-full bg-white px-3.5 py-1 font-semibold text-red-600 text-sm shadow-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
					>
						Hemen İncele <span aria-hidden="true">&rarr;</span>
					</a>
				)}
			</div>
			<div className="flex flex-1 justify-end">
				<button
					type="button"
					className="-m-3 p-3 focus-visible:-outline-offset-4"
					onClick={() => setIsVisible(false)}
				>
					<span className="sr-only">Kapat</span>
					<X className="h-5 w-5 text-white" aria-hidden="true" />
				</button>
			</div>
		</div>
	);
}
