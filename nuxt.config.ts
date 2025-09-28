import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";

export default defineNuxtConfig({
	compatibilityDate: "2025-09-19",
	devtools: { enabled: true },
	css: ["~/assets/css/main.css"],
	modules: [
		"@nuxt/ui",
		"nuxt-security",
		"@nuxt/fonts",
		"@nuxt/image",
		"@stefanobartoletti/nuxt-social-share",
	],
	security: {
		headers: {
			contentSecurityPolicy: {
				"img-src": ["'self'", "data:", "https:"],
			},
		},
	},
	ui: {
		colorMode: false,
	},
	routeRules: {
		"/api/join-waitlist": {
			security: {
				rateLimiter: {
					tokensPerInterval: 25,
				},
			},
		},
	},
	extends: ["github:kgarchie/nuxt-starter"],
	app: {
		head: {
			link: [{ rel: "icon", type: "image/svg+xml", href: "/finueva.svg" }],
		},
	},
	runtimeConfig: {
		public: {
			socialShare: {
				baseUrl: "http://localhost:3000",
			},
			appUrl: "http://localhost:3000",
			mmUrl: "https://chat.ifkafin.com",
		},
		mattermost: {
			url: "https://chat.ifkafin.com",
			token: "",
			/** The default team to add the user to */
			team_id: "",
			bots: {
				welcome: {
					version: 1,
					token: "",
				},
			},
		},
		nodemailer: {
			email: "",
			password: "",
			host: "",
			port: 587,
		},
	},
	vite: {
		plugins: [tailwindcss()],
		build: {
			sourcemap: false,
		},
	},
	nitro: {
		rollupConfig: {
			plugins: [vue()],
		},
		serverAssets: [
			{
				baseName: "markdown",
				dir: "./server/templates/markdown",
			},
		],
	},
});
