import { defineConfig } from "astro/config"
import starlight from "@astrojs/starlight"
import { rehypeHeadingIds } from "@astrojs/markdown-remark"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import config from "./config"

// https://astro.build/config
export default defineConfig({
  site: "https://openauth.js.org",
  devToolbar: {
    enabled: false,
  },
  integrations: [
    starlight({
      title: "OpenAuth",
      description: "Universal, standards-based auth provider.",
      head: [
        {
          tag: "link",
          attrs: {
            rel: "icon",
            href: "/favicon.ico",
            sizes: "48x48",
          },
        },
        // Add light/dark mode favicon
        {
          tag: "link",
          attrs: {
            rel: "icon",
            href: "/favicon.svg",
            media: "(prefers-color-scheme: light)",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "icon",
            href: "/favicon-dark.svg",
            media: "(prefers-color-scheme: dark)",
          },
        },
      ],
      pagination: false,
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: true,
      },
      social: {
        github: config.github,
        discord: config.discord,
      },
      lastUpdated: true,
      editLink: {
        baseUrl: `${config.github}/edit/master/www/`,
      },
      components: {
        Hero: "./src/components/Hero.astro",
        Head: "./src/components/Head.astro",
        Header: "./src/components/Header.astro",
        Footer: "./src/components/Footer.astro",
        PageTitle: "./src/components/PageTitle.astro",
      },
      customCss: [
        "@fontsource/ibm-plex-mono/400.css",
        "@fontsource/ibm-plex-mono/400-italic.css",
        "@fontsource/ibm-plex-mono/500.css",
        "@fontsource/ibm-plex-mono/600.css",
        "@fontsource/ibm-plex-mono/700.css",
        "./src/custom.css",
        "./src/styles/tsdoc.css",
        "./src/styles/lander.css",
        "./src/styles/markdown.css",
        "./src/styles/headings.css",
      ],
      sidebar: [
        { label: "Intro", slug: "docs" },
        {
          label: "Core",
          items: [
            "docs/client",
            { label: "Session", slug: "docs/session" },
            { label: "Authorizer", slug: "docs/authorizer" },
          ],
        },
        {
          label: "Providers",
          items: [
            { label: "Apple", slug: "docs/adapter/apple" },
            { label: "Google", slug: "docs/adapter/google" },
          ],
        },
        {
          label: "UI",
          items: [
            "docs/ui/theme",
            "docs/ui/select",
            "docs/ui/code",
            "docs/ui/password",
          ],
        },
        {
          label: "Storage",
          items: ["docs/storage/memory", "docs/storage/dynamo", "docs/storage/cloudflare"],
        },
      ],
    }),
  ],
  markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
  },
})
