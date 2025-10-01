import { ref, onMounted, onBeforeUnmount } from "vue";
import { useCookie } from "#app";

function getDeviceType() {
	const ua = navigator.userAgent;
	if (/mobile|android|touch|webos|hpwos/i.test(ua)) return "mobile";
	if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
	return "desktop";
}

function getBrowserInfo() {
	const ua = navigator.userAgent;
	let tem: any,
		M: any =
			ua.match(/(opera|chrome|safari|firefox|edge|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if (/trident/i.test(M[1] || "")) {
		tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
		return { name: "IE", version: tem[1] || "" };
	}
	if (M[1] === "Chrome") {
		tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
		if (tem != null) return { name: tem[1]?.replace("OPR", "Opera"), version: tem[2] };
	}

	M = M.length >= 3 ? M : [null, navigator.appName, navigator.appVersion, "-?"];
	tem = ua.match(/version\/(\d+)/i);
	if (tem != null) M[2] = tem[1];
	return { name: M[1], version: M[2] };
}

function getOS() {
	const ua = navigator.userAgent;
	if (/windows/i.test(ua)) return "Windows";
	if (/macintosh|mac os x/i.test(ua)) return "MacOS";
	if (/linux/i.test(ua)) return "Linux";
	if (/android/i.test(ua)) return "Android";
	if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
	return "Other";
}

function getUTMParams() {
	const params = new URLSearchParams(window.location.search);
	const utms = {} as Record<string, string | null>;
	for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
		if (params.has(key)) utms[key] = params.get(key);
	}
	return utms;
}

function getAccessibility() {
	return {
		prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
		prefersColorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light",
	};
}

function getNetworkInfo() {
	// @ts-expect-error
	const conn = navigator.connection || {};
	return {
		downlink: conn.downlink,
		effectiveType: conn.effectiveType,
		rtt: conn.rtt,
	};
}

function getDevicePerformance() {
	return {
		// @ts-expect-error
		deviceMemory: navigator?.deviceMemory,
		hardwareConcurrency: navigator.hardwareConcurrency,
	};
}

function detectAdBlock() {
	const ad = document.createElement("div");
	ad.className = "adsbox";
	ad.style.height = "1px";
	document.body.appendChild(ad);
	const blocked = window.getComputedStyle(ad).display === "none";
	document.body.removeChild(ad);
	return blocked;
}

function detectIncognito() {
	return new Promise((resolve) => {
		// @ts-expect-error
		const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
		if (!fs) return resolve(false);
		fs(
			// @ts-expect-error
			window.TEMPORARY,
			100,
			() => resolve(false),
			() => resolve(true)
		);
	}).catch(() => {
		return false;
	});
}

function getSessionId() {
	let sessionId = useCookie("session_id").value;
	if (!sessionId) {
		sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
		useCookie("session_id").value = sessionId;
	}
	return sessionId;
}

export function useAnalytics() {
	const startTime = Date.now();
	const scrollDepth = ref(0);
	const interactionEvents = ref<{ type: string; target: any; time: number }[]>([]);

	function handleScroll() {
		const scrolled = window.scrollY + window.innerHeight;
		const total = document.body.scrollHeight;
		scrollDepth.value = Math.round((scrolled / total) * 100);
	}

	function handleInteraction(e: Event) {
		interactionEvents.value.push({
			type: e.type,
			// @ts-expect-error
			target: e.target?.tagName,
			time: Date.now() - startTime,
		});
	}

	onMounted(() => {
		window.addEventListener("scroll", handleScroll);
		window.addEventListener("click", handleInteraction);
		window.addEventListener("focusin", handleInteraction);
	});

	onBeforeUnmount(() => {
		window.removeEventListener("scroll", handleScroll);
		window.removeEventListener("click", handleInteraction);
		window.removeEventListener("focusin", handleInteraction);
	});

	async function collectAnalytics() {
		const incognito = await detectIncognito();
		return {
			deviceType: getDeviceType(),
			browser: getBrowserInfo(),
			os: getOS(),
			referrer: document.referrer,
			timestamp: new Date().toISOString(),
			screen: { width: window.screen.width, height: window.screen.height },
			language: navigator.language,
			utm: getUTMParams(),
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			sessionId: getSessionId(),
			scrollDepth: scrollDepth.value,
			interactions: interactionEvents.value,
			performance: getDevicePerformance(),
			network: getNetworkInfo(),
			adBlock: detectAdBlock(),
			accessibility: getAccessibility(),
			multiTab: !!window.sessionStorage,
			incognito,
		};
	}

	async function sendAnalytics() {
		const data = await collectAnalytics();
		await fetch("/api/track-analytics", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
	}

	return { sendAnalytics };
}
