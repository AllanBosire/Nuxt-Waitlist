import {consola} from "consola";
import {Bot} from "./client";
import {joinURL} from "ufo";

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

    const {result: parentResult, error: parentError} = await execute(
        client.createPost,
        parentPost
    );
    if (parentError || !parentResult) {
        throw createError({message: "Unable to create survey parent post", cause: parentError});
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
            const {result: commandResult, error: cmdError} = await execute(
                client.executeCommand,
                command,
                {channel_id: channelId, root_id: parentPostId}
            );

            if (cmdError || !commandResult) {
                consola.error(`Failed to create poll question ${i}:`, cmdError);
                continue;
            }

            const pollPostId = commandResult.trigger_id;
            if (pollPostId) {
                questionToPostId[i] = {postId: pollPostId, type: "poll"};
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

            const {result: textPost, error: textError} = await execute(client.createPost, {
                channel_id: channelId,
                message,
                root_id: parentPostId, // link it to parent as a thread child (if you want)
                props: {survey: {id: surveyId, questionIndex: i, type: "text"}},
            });

            if (textError || !textPost) {
                consola.error(`Failed to create text question ${i}:`, textError);
                continue;
            }

            questionToPostId[i] = {postId: textPost.id, type: "text"};
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
    const {result: post, error} = await execute(client.getPost, pollPostId);
    if (error || !post) {
        throw createError({message: "Unable to fetch poll post", cause: error});
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
            const {result: threadRes, error} = await execute(client.getPostThread, textPostId);
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
    const {result: post, error: postErr} = await execute(client.getPost, textPostId);
    if (postErr || !post)
        throw createError({message: "Unable to fetch text post", cause: postErr});
    const channelId = post.channel_id;

    const {result: postsRes, error: postsErr} = await execute(client.getPosts, channelId);
    if (postsErr || !postsRes)
        throw createError({message: "Unable to fetch channel posts", cause: postsErr});

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
    const {result: parentPost, error} = await execute(client.getPost, parentSurveyPostId);
    if (error || !parentPost) {
        throw createError({message: "Unable to fetch parent survey post", cause: error});
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
                results.push({index: idx, type: "poll", stats: pollStats});
            } else {
                const textResponses = await getTextResponses(bot, entry.postId);
                results.push({index: idx, type: "text", responses: textResponses});
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

type Team = {
    id: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    display_name: string;
    name: string;
    description: string;
    email: string;
    type: string;
    allowed_domains: string;
    invite_id: string;
    allow_open_invite: boolean;
    policy_id: string;
};

type Teams = Team[];

export async function* getAllTeams(page = 0) {
    const config = useRuntimeConfig()
    while (true) {
        const teams = await $fetch<Teams>(joinURL(config.public.mmUrl, "api/v4/teams"), {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.mattermost.token}`
            },
            query: {
                page
            }
        })

        if (!teams || !teams.length) {
            break;
        }

        yield teams
        page = page + 1
    }
}

type Channel = {
    id: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    team_id: string;
    type: string;
    display_name: string;
    name: string;
    header: string;
    purpose: string;
    last_post_at: number;
    total_msg_count: number;
    extra_update_at: number;
    creator_id: string;
    team_display_name: string;
    team_name: string;
    team_update_at: number;
    policy_id: string;
};

type Channels = Channel[];

async function* getAllChannels(page: number = 0) {
    const config = useRuntimeConfig()
    while (true) {
        const channels = await $fetch<Channels>(joinURL(config.public.mmUrl, "api/v4/channels"), {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.mattermost.token}`
            },
            query: {
                page
            }
        })

        if (!channels || !channels.length) {
            break;
        }

        yield channels;
        page = page + 1;
    }
}
export interface Posts {
    order: string[];
    posts: Record<string, Post>;
    next_post_id: string;
    prev_post_id: string;
    has_next: boolean;
}

export interface Post {
    id: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    edit_at: number;
    user_id: string;
    channel_id: string;
    root_id: string;
    original_id: string;
    message: string;
    type: string;
    props: Record<string, unknown>;
    hashtag: string;
    file_ids: string[];
    pending_post_id: string;
    metadata: Metadata;
}

interface Metadata {
    embeds: Embed[];
    emojis: Emoji[];
    files: FileMetadata[];
    images: Record<string, unknown>;
    reactions: Reaction[];
    priority: Priority;
    acknowledgements: Acknowledgement[];
}

export interface Embed {
    type: string;
    url: string;
    data: Record<string, unknown>;
}

export interface Emoji {
    id: string;
    creator_id: string;
    name: string;
    create_at: number;
    update_at: number;
    delete_at: number;
}

export interface FileMetadata {
    id: string;
    user_id: string;
    post_id: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    name: string;
    extension: string;
    size: number;
    mime_type: string;
    width: number;
    height: number;
    has_preview_image: boolean;
}

export interface Reaction {
    user_id: string;
    post_id: string;
    emoji_name: string;
    create_at: number;
}

export interface Priority {
    priority: string;
    requested_ack: boolean;
}

export interface Acknowledgement {
    user_id: string;
    post_id: string;
    acknowledged_at: number;
}
export async function* getAllPosts(client: CustomBotClient, channelIds: string[] | string, page: number = 0) {
    channelIds = toArray(channelIds)
    const config = useRuntimeConfig()
    for (const id of channelIds) {
        while (true) {
            const postList = await $fetch<Posts>(joinURL(config.public.mmUrl, `/api/v4/channels/${id}/posts`), {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.mattermost.token}`
                },
                query: {
                    page
                }
            })

            if (!postList || !isEmpty(postList.posts)) {
                break;
            }

            yield postList;
            page = page + 1;
        }
    }
}

/**
 * Collect all polls from a channel and prepare analytics
 * @param bot - The Mattermost bot name (from RuntimeConfig.mattermost.bots)
 * @param channelIds - The Mattermost channel ID
 * @returns Aggregated analytics data (for dashboard visualization)
 */
export async function collectPollAnalytics(bot: Bot, channelIds?: string | string[]) {
    const client = useMatterClient(bot);
    if (!channelIds) {
        channelIds = []
        for await(const channels of getAllChannels()) {
            channels.forEach((channel) => {
                // @ts-expect-error
                channelIds.push(channel.id);
            })
        }
    }
    channelIds = toArray(channelIds)

    const postsGen = await getAllPosts(client, channelIds);
    const stats = [];
    for await (const {posts} of postsGen) {
        const pollPosts = values(posts).filter((p) => p.props?.poll || p.message?.startsWith("#### Poll"));
        for (const post of pollPosts) {
            try {
                const pollStats = await getSurveyStats(bot, post.id);
                stats.push(pollStats);
            } catch (err) {
                consola.debug(`Skipping non-poll post ${post.id}`);
            }
        }
    }

    consola.info(stats);

    const aggregated = {
        totalPolls: stats.length,
        totalVotes: stats.reduce((sum, s) => sum + toNumber(s.total_votes), 0),
    };

    return {
        channels: channelIds,
        polls: stats,
        aggregated,
    };
}
