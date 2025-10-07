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

export interface Post {
	id: string;
	create_at: number;
	update_at: number;
	edit_at: number;
	delete_at: number;
	is_pinned: boolean;
	user_id: string;
	channel_id: string;
	root_id: string;
	original_id: string;
	message: string;
	type: string;
	props: Props;
	hashtags: string;
	file_ids: any[];
	pending_post_id: string;
	remote_id: string;
	reply_count: number;
	last_reply_at: number;
	participants: null;
	metadata: Metadata;
}

export interface Metadata {}

export interface Props {
	disable_group_highlight: boolean;
}

export interface IncomingPostEvent {
	channel_display_name: string;
	channel_name: string;
	channel_type: "O" | "P" | "D";
	mentions: string;
	post: string; // raw
	sender_name: string;
	set_online: boolean;
	team_id: string;
}
