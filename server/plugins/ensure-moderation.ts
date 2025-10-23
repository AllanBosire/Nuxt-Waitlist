import { getAllTeamChannels } from "../utils/mattermost/matterpoll";

export default defineNitroPlugin(async () => {
    const config = useRuntimeConfig();
    const bot = useMatterClient("moderator");
    const websocket = bot.getWebSocket();
    const noMessageChannels = new Set(
        config.mattermost.bots.moderator.noMessageChannels
            .split(",")
            .filter(Boolean),
    );
    const noTopLevelMessageChannels = new Set(
        config.mattermost.bots.moderator.noTopLevelMessageChannels
            .split(",")
            .filter(Boolean),
    );

    const team = config.mattermost.team_id;
    const BOT_ID = await bot.userId();
    bot.addToTeam(team, BOT_ID).catch((error) => {
        console.error(error);
    });

    const chunkedTeams = getAllTeams();
    for await (const teams of chunkedTeams) {
        teams.forEach(async (team) => {
            const chunkedChannels = getAllTeamChannels(team.id);
            for await (const channels of chunkedChannels) {
                channels.forEach((channel) => {
                    bot.addToChannel(BOT_ID, channel.id);
                });
            }
        });
    }

    async function blockMessageIfNotAdmin({
        blockAll,
        user_id,
        channel_id,
        post_id,
        root_id,
    }: {
        blockAll: boolean;
        user_id: string;
        channel_id: string;
        post_id: string;
        root_id: string;
    }) {
        const user = await getMatterMostUserById(user_id);
        if (!user) return;

        if (isAdmin(user) || isModerator(user)) return;

        if (blockAll) {
            bot.createPostEphemeral(user_id, {
                channel_id: channel_id,
                message:
                    "You are not authorized to post a message in this channel.",
                root_id,
            });
            bot.deletePost(post_id);
            return;
        }

        if (root_id) {
            return;
        }
        
        bot.createPostEphemeral(user_id, {
            channel_id: channel_id,
            message:
                "You are not authorized to post a top-level message in this channel. Please contribute in a thread, it helps organize topics and discussions.",
        });
        bot.deletePost(post_id);
    }

    websocket.on("posted", async (data) => {
        const {
            user_id,
            channel_id,
            id: post_id,
            root_id,
        } = tryParse<Post>(data.post);
        if (user_id === BOT_ID) {
            return;
        }

        if (noTopLevelMessageChannels.has(channel_id)) {
            blockMessageIfNotAdmin({
                blockAll: false,
                channel_id,
                user_id,
                post_id,
                root_id,
            });
            return;
        }

        if (noMessageChannels.has(channel_id)) {
            blockMessageIfNotAdmin({
                blockAll: true,
                channel_id,
                user_id,
                post_id,
                root_id,
            });
            return;
        }
    });
});
