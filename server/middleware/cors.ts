export default defineEventHandler((event) => {
	handleCors(event, {
		origin: [
			/^https?:\/\/localhost(:\d+)?$/,
			/^https?:\/\/([a-zA-Z0-9-]+\.)?ifkafin\.com$/,
			/^https?:\/\/([a-zA-Z0-9-]+\.)?finueva\.com$/,
		],
		methods: "*",
		preflight: {
			statusCode: 204,
		},
		allowHeaders: "*",
	});
});
