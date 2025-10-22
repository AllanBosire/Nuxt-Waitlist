import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const cwd = dirname(fileURLToPath(import.meta.url));

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
		"nuxt-echarts",
		"@nuxt/scripts",
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
			mmUrl: "https://community.finueva.com",
			media: {
				tutorial: {
					landingVideo: "mRW_PwNKZ_E",
				},
			},
		},
		mattermost: {
			token: "",
			/** The default team to add the user to */
			team_id: "",
			bots: {
				welcome: {
					version: 1,
					token: "",
				},
				invite: {
					version: 1,
					token: "",
				},
				notifications: {
					token: "",
				},
				surveys: {
					token: "",
				},
			},
			/** comma separated admin emails */
			admins: "",
			public_channel_ids: "",
		},
		jellyfin: {
			apiKey: "",
			url: "",
		},
		nodemailer: {
			email: "",
			password: "",
			host: "",
			port: 587,
		},
		dev: {
			email: "",
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
				dir: "./templates/markdown",
			},
		],
	},
	echarts: {
		components: [
			"LegendComponent",
			"GridComponent",
			"DataZoomComponent",
			"MarkLineComponent",
			"MarkPointComponent",
			"TooltipComponent",
			"TitleComponent",
			"GraphicComponent",
			"PolarComponent",
		],
		charts: ["LineChart", "BarChart", "PieChart"],
	},
	$development: {
		runtimeConfig: {
			public: {
				mmUrl: "http://localhost:8065",
			},
		},
	},
	icon: {
		size: "24px",
		customCollections: [
			{
				dir: join(cwd, "app/assets/icons"),
				prefix: "local",
			},
			{
				dir: join(cwd, "app/assets/logos"),
				prefix: "logo",
			},
			{
				dir: join(cwd, "app/assets/insignias"),
				prefix: "insignia",
			},
			{
				dir: join(cwd, "app/assets/illustrations"),
				prefix: "ill",
			},
		],
		class: "icon",
		mode: "svg",
	},
});
