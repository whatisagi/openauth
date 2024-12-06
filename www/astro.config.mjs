import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import config from "./config";

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
					tag: 'link',
					attrs: {
						rel: 'icon',
						href: '/favicon.ico',
						sizes: '48x48',
					},
				},
			],
			social: {
				github: config.github,
				discord: config.discord,
			},
			pagefind: false,
			components: {
				Hero: "./src/components/Hero.astro",
				Head: "./src/components/Head.astro",
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
