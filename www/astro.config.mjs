import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
	devToolbar: {
		enabled: false,
	},
	integrations: [
		starlight({
			title: "OpenAuth",
			description: "Universal, standards-based auth provider.",
			head: [
				{
					tag: "meta",
					attrs: {
						property: "og:image",
						content: "/social-share.png",
					},
				},
			],
			social: {
				discord: "https://sst.dev/discord",
				github: "https://github.com/openauthjs/openauthjs",
			},
			pagefind: false,
			components: {
				Hero: "./src/components/Hero.astro",
				Footer: "./src/components/Footer.astro",
			},
			customCss: [
				"@fontsource/ibm-plex-mono/400.css",
				"@fontsource/ibm-plex-mono/400-italic.css",
				"@fontsource/ibm-plex-mono/500.css",
				"@fontsource/ibm-plex-mono/600.css",
				"@fontsource/ibm-plex-mono/700.css",
				"./src/custom.css",
			],
		}),
	],
});
