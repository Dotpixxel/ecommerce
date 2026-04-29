import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { orpc } from "@/utils/orpc";

export default function WhatsAppButton() {
	const { data: settings } = useQuery(
		orpc.settings.getPublicSettings.queryOptions(),
	);

	const phoneNumber =
		settings?.whatsappNumber?.replace(/\+/g, "").replace(/\s/g, "") ||
		"905000000000";
	const message = "Merhaba! Bir sorum olacaktı.";

	const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

	if (!settings?.whatsappNumber) return null;

	return (
		<a
			href={whatsappUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
			aria-label="WhatsApp Destek"
		>
			<MessageCircle className="h-7 w-7 fill-current" />
		</a>
	);
}
