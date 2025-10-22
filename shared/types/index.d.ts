export interface Analytics {
	deviceType: string;
	browser: {
		name: any;
		version: any;
	};
	os: string;
	referrer: string;
	timestamp: string;
	screen: {
		width: number;
		height: number;
	};
	language: string;
	utm: Record<string, string | null>;
	timezone: string;
	sessionId: string;
	scrollDepth: number;
	interactions: {
		type: string;
		target: any;
		time: number;
	}[];
	performance: {
		deviceMemory: any;
		hardwareConcurrency: number;
	};
	network: {
		downlink: any;
		effectiveType: any;
		rtt: any;
	};
	adBlock: boolean;
	accessibility: {
		prefersReducedMotion: boolean;
		prefersColorScheme: string;
	};
	multiTab: boolean;
	incognito: unknown;
}

