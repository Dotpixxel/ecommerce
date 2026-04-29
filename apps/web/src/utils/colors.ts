/**
 * Turkish color names to hex codes mapping
 */
export const COLOR_MAP: Record<string, string> = {
	Siyah: "#000000",
	Beyaz: "#FFFFFF",
	Kırmızı: "#FF0000",
	Mavi: "#0000FF",
	Yeşil: "#008000",
	Sarı: "#FFFF00",
	Turuncu: "#FFA500",
	Mor: "#800080",
	Pembe: "#FFC0CB",
	Gri: "#808080",
	Kahverengi: "#A52A2A",
	Lacivert: "#000080",
	Bej: "#F5F5DC",
	Ekru: "#F5F5F5",
	Antrasit: "#2F4F4F",
	Bordo: "#800000",
	Haki: "#BDB76B",
	Vizon: "#AF9483",
	Lila: "#C8A2C8",
	Turkuaz: "#40E0D0",
	Hardal: "#E1AD01",
	Petrol: "#005F69",
	Mürdüm: "#6A0DAD",
	Kiremit: "#B22222",
	Taba: "#734222",
};

/**
 * Returns a hex code for a given color name.
 * Uses simple matching to handle variations like "Açık Mavi" -> "Mavi"
 */
export function getColorHex(colorName: string): string {
	if (!colorName) return "#FFFFFF";

	// 1. Direct match
	if (COLOR_MAP[colorName]) return COLOR_MAP[colorName];

	// 2. Case-insensitive direct match
	const normalized =
		colorName.charAt(0).toUpperCase() + colorName.slice(1).toLowerCase();
	if (COLOR_MAP[normalized]) return COLOR_MAP[normalized];

	// 3. Partial matching (e.g., "Açık Mavi" contains "Mavi")
	const entry = Object.entries(COLOR_MAP).find(([key]) =>
		colorName.toLowerCase().includes(key.toLowerCase()),
	);

	if (entry) return entry[1];

	// 4. Fallback to the colorName itself if it looks like a hex/rgb, else white
	if (colorName.startsWith("#") || colorName.startsWith("rgb"))
		return colorName;

	return "#FFFFFF";
}
