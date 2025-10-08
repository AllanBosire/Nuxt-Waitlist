import { consola } from "consola";
import { Bot } from "./client";

type SurveyQuestion =
	| {
			type: "poll"; // single or multi select
			question: string;
			options: string[];
			multiple?: boolean; // allow multiple choice
			flags?: string[]; // any matterpoll flags, e.g. ["--anonymous", "--progress"]
	  }
	| {
			type: "text"; // open text answer
			question: string;
			instructions?: string;
	  };

type Survey = {
	id: string;
	title: string;
	created_at: string;
	creator_bot: Bot;
	channel_id: string;
	questions: SurveyQuestion[];
};

/**
 * Create a survey (parent post) and for each question create a poll post or text-post.
 * Returns mapping of question index -> created post id so you can later collect stats.
 */
export async function sendSurvey(
	bot: Bot,
	channelId: string,
	title: string,
	questions: SurveyQuestion[]
) {
	const client = useMatterClient(bot);

	// simple unique survey id
	const surveyId = `survey-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	const createdAt = new Date().toISOString();

	// Create parent survey post (so we have one canonical post to reference)
	const parentPost: Parameters<typeof client.createPost>[number] = {
		channel_id: channelId,
		message: `**Survey:** ${title}\n\n_This survey contains ${questions.length} questions. Reply in-thread_\n\n**Survey ID:** ${surveyId}`,
		props: {
			survey: {
				id: surveyId,
				title,
				questionsCount: questions.length,
				creator: bot,
				created_at: createdAt,
			},
		},
	};

	const { result: parentResult, error: parentError } = await execute(
		client.createPost,
		parentPost
	);
	if (parentError || !parentResult) {
		throw createError({ message: "Unable to create survey parent post", cause: parentError });
	}
	const parentPostId = parentResult.id;

	// For each question create a poll (via /poll) or a normal post for text question.
	const questionToPostId: Record<number, { postId: string; type: string }> = {};

	for (let i = 0; i < questions.length; i++) {
		const q = questions[i];
		if (q.type === "poll") {
			const flags = Array.isArray(q.flags) ? [...q.flags] : [];

			if (q.multiple && !flags.some((f) => f.includes("--votes"))) {
				flags.push(`--votes=${q.options.length}`);
			}

			// Build command - all options wrapped in quotes
			const command = `/poll "${q.question}" ${q.options
				.map((o) => `"${o}"`)
				.join(" ")} ${flags.join(" ")}`.trim();

			// Execute the slash command in the channel (this will create a poll post)
			const { result: commandResult, error: cmdError } = await execute(
				client.executeCommand,
				command,
				{ channel_id: channelId, root_id: parentPostId }
			);

			if (cmdError || !commandResult) {
				consola.error(`Failed to create poll question ${i}:`, cmdError);
				continue;
			}

			const pollPostId = commandResult.trigger_id;
			if (pollPostId) {
				questionToPostId[i] = { postId: pollPostId, type: "poll" };
			} else {
				consola.warn(
					"Could not locate created poll post id for command result:",
					commandResult
				);
			}
		} else {
			// text question: create a normal post that instructs users to reply in-thread
			const message = `**Q${i + 1}: ${q.question}**\n\n${
				(q as any).instructions ?? "Reply to this message with your answer."
			}\n\n*(Survey ID: ${surveyId})*`;

			const { result: textPost, error: textError } = await execute(client.createPost, {
				channel_id: channelId,
				message,
				root_id: parentPostId, // link it to parent as a thread child (if you want)
				props: { survey: { id: surveyId, questionIndex: i, type: "text" } },
			});

			if (textError || !textPost) {
				consola.error(`Failed to create text question ${i}:`, textError);
				continue;
			}

			questionToPostId[i] = { postId: textPost.id, type: "text" };
		}
	}

	return {
		surveyId,
		parentPostId,
		questionToPostId,
		created_at: createdAt,
	};
}

/**
 * Get stats for a single poll post (uses post.props.poll)
 * Returns: { question, options, votes: {optionText:count}, total_votes }
 */
export async function getPollStats(bot: Bot, pollPostId: string) {
	const client = useMatterClient(bot);
	const { result: post, error } = await execute(client.getPost, pollPostId);
	if (error || !post) {
		throw createError({ message: "Unable to fetch poll post", cause: error });
	}

	const props = post.props || {};
	consola.info(post);
	// plugin stores the poll data in props.poll or in attachments - best-effort
	const poll =
		props.poll ||
		(props.attachments && props.attachments[0] && props.attachments[0].poll) ||
		{};
	if (!poll || !poll.options) {
		throw createError("Post does not appear to be a matterpoll poll post");
	}

	const votes: Record<string, number> = {};
	for (const opt of poll.options) {
		// votes may be stored in poll.votes keyed by option text or index; be resilient
		const count =
			poll.votes && poll.votes[opt]
				? poll.votes[opt].length
				: poll.votes_count
				? poll.votes_count[opt] ?? 0
				: 0;
		votes[opt] = count || 0;
	}

	const total_votes = Object.values(votes).reduce((a, b) => a + b, 0);

	return {
		post_id: pollPostId,
		question: poll.question,
		options: poll.options,
		votes,
		total_votes,
	};
}

/**
 * Get responses for a text question post (thread replies)
 * Returns array of replies (user, message, create_at)
 */
export async function getTextResponses(bot: Bot, textPostId: string) {
	const client = useMatterClient(bot);
	// try getPostThread (convenience) or fallback to fetching recent posts and filtering by root_id
	try {
		if (typeof client.getPostThread === "function") {
			const { result: threadRes, error } = await execute(client.getPostThread, textPostId);
			if (error) throw error;
			// threadRes.posts is an object keyed by post id
			return Object.values(threadRes.posts)
				.filter((p: any) => p.id !== textPostId)
				.map((p: any) => ({
					user_id: p.user_id,
					message: p.message,
					create_at: p.create_at,
					id: p.id,
				}));
		}
	} catch (err) {
		consola.debug(
			"getPostThread not available or failed; falling back to scanning channel posts",
			err
		);
	}

	// Fallback: getPosts for channel and filter by root_id
	const { result: post, error: postErr } = await execute(client.getPost, textPostId);
	if (postErr || !post)
		throw createError({ message: "Unable to fetch text post", cause: postErr });
	const channelId = post.channel_id;

	const { result: postsRes, error: postsErr } = await execute(client.getPosts, channelId);
	if (postsErr || !postsRes)
		throw createError({ message: "Unable to fetch channel posts", cause: postsErr });

	return Object.values(postsRes.posts)
		.filter((p: any) => p.root_id === textPostId)
		.map((p: any) => ({
			user_id: p.user_id,
			message: p.message,
			create_at: p.create_at,
			id: p.id,
		}));
}

/**
 * Given a parent survey post id, collect and aggregate stats from all questions in that survey.
 * Returns structured data for dashboarding.
 */
export async function getSurveyStats(bot: Bot, parentSurveyPostId: string) {
	const client = useMatterClient(bot);
	const { result: parentPost, error } = await execute(client.getPost, parentSurveyPostId);
	if (error || !parentPost) {
		throw createError({ message: "Unable to fetch parent survey post", cause: error });
	}

	const props = parentPost.props || {};
	const surveyMeta = props.survey || {};
	const mapping: Record<number, { postId: string; type: string }> = surveyMeta.questionsMap || {};

	const results: Array<any> = [];

	for (const idxStr of Object.keys(mapping)) {
		const idx = Number(idxStr);
		const entry = mapping[idx];
		if (!entry) continue;

		try {
			if (entry.type === "poll") {
				const pollStats = await getPollStats(bot, entry.postId);
				results.push({ index: idx, type: "poll", stats: pollStats });
			} else {
				const textResponses = await getTextResponses(bot, entry.postId);
				results.push({ index: idx, type: "text", responses: textResponses });
			}
		} catch (err) {
			consola.warn(`Failed to collect stats for question ${idx}:`, err);
		}
	}

	// aggregate simple totals
	const aggregate = {
		totalQuestions: Object.keys(mapping).length,
		totalPollVotes: results
			.filter((r) => r.type === "poll")
			.reduce((s, r) => s + (r.stats?.total_votes ?? 0), 0),
		totalTextResponses: results
			.filter((r) => r.type === "text")
			.reduce((s, r) => s + (r.responses?.length ?? 0), 0),
	};

	return {
		surveyId: surveyMeta.id ?? null,
		title: surveyMeta.title ?? parentPost.message?.split("\n")[0],
		parentPostId: parentSurveyPostId,
		results,
		aggregate,
	};
}

/**
 * Collect all polls from a channel and prepare analytics
 * @param bot - The Mattermost bot name (from RuntimeConfig.mattermost.bots)
 * @param channelId - The Mattermost channel ID
 * @returns Aggregated analytics data (for dashboard visualization)
 */
export async function collectPollAnalytics(bot: Bot, channelId: string) {
	const client = useMatterClient(bot);

	// Fetch recent posts from the channel
	const { result: postsRes, error } = await execute(client.getPosts, channelId);
	if (error || !postsRes) {
		throw createError({
			message: "Unable to fetch posts for analytics",
			cause: error,
		});
	}

	// Filter posts that look like Matterpoll polls
	const posts = Object.values(postsRes.posts);
	const pollPosts = posts.filter((p) => p.props?.poll || p.message?.startsWith("#### Poll"));

	const stats = [];

	for (const post of pollPosts) {
		try {
			const pollStats = await getSurveyStats(bot, post.id);
			stats.push(pollStats);
		} catch (err) {
			consola.debug(`Skipping non-poll post ${post.id}`);
		}
	}

	consola.info(stats);

	const aggregated = {
		totalPolls: stats.length,
		totalVotes: stats.reduce((sum, s) => sum + toNumber(s.total_votes), 0),
	};

	return {
		channelId,
		polls: stats,
		aggregated,
	};
}
