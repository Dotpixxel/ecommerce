export const seo = ({
	title,
	description,
	keywords,
	image,
	canonical,
}: {
	title: string;
	description?: string;
	image?: string;
	keywords?: string;
	canonical?: string;
}) => {
	const siteName = "Raunk Butik";
	const fullTitle = title === siteName ? title : `${title} | ${siteName}`;

	const tags = [
		{ title: fullTitle },
		{ name: "description", content: description },
		{ name: "keywords", content: keywords },
		...(canonical ? [{ rel: "canonical", href: canonical }] : []),
		// Raunk Butik Socials
		{ name: "og:site_name", content: siteName },
		{ name: "og:url", content: "https://raunkbutik.com" }, // Placeholder domain
		{ name: "og:type", content: "website" },
		{ name: "og:title", content: fullTitle },
		{ name: "og:description", content: description },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: fullTitle },
		{ name: "twitter:description", content: description },
		...(image
			? [
					{ name: "twitter:image", content: image },
					{ name: "og:image", content: image },
				]
			: []),
		// Instagram (Placeholder links)
		{ name: "instagram:title", content: fullTitle },
		{ name: "instagram:description", content: description },
		{
			name: "instagram:url",
			content: "https://www.instagram.com/raunkbutik/",
		},
	];

	return tags.filter((tag) => {
		if ("content" in tag) return !!tag.content;
		if ("href" in tag) return !!tag.href;
		return true;
	});
};
