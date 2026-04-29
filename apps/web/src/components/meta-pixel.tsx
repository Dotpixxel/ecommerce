const PIXEL_ID = "1625266505387033";

export function MetaPixel() {
	if (import.meta.env.MODE !== "production") return null;

	// Meta Pixel automatically tracks PageView on SPA route changes
	// via the HTML5 History State API listener — no manual tracking needed.
	return (
		<noscript>
			<img
				height="1"
				width="1"
				style={{ display: "none" }}
				src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
				alt=""
			/>
		</noscript>
	);
}

// Add TypeScript types for window.fbq
declare global {
	interface Window {
		fbq: (...args: unknown[]) => void;
		_fbq: (...args: unknown[]) => void;
	}
}
