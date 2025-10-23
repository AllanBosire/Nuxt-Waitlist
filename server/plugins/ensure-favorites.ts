import { joinURL } from "ufo";

type CategoryType = "favorites" | "channels" | "direct_messages" | "custom";

type CategoryId<
    T extends CategoryType,
    U extends string,
    TEAM extends string,
> = `${T}_${U}_${TEAM}`;

interface ChannelCategory<
    T extends CategoryType = CategoryType,
    U extends string = string,
    TEAM extends string = string,
> {
    /** e.g. "favorites_tthzheik5prt3cgc8esim3mqye_1y55y81nopf8mccyq1jffgwmwc" */
    id: CategoryId<T, U, TEAM>;
    user_id: U;
    team_id: TEAM;
    sort_order: number;
    sorting: string;
    type: T;
    display_name: string;
    muted: boolean;
    collapsed: boolean;
    channel_ids: string[];
}

export default defineNitroPlugin(async () => {
    const config = useRuntimeConfig();
    const favoriteChannelIds = config.mattermost.favorite_channel_ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    const favoriteBotIds = config.mattermost.favorite_channel_ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

    const usersGenerator = getAllUsers();
    const team = config.mattermost.team_id;
    for await (const users of usersGenerator) {
        users.forEach(async (user) => {
            await $fetch(
                joinURL(
                    config.public.mmUrl,
                    `/api/v4/users/${user.id}/preferences`,
                ),
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${config.mattermost.token}`,
                    },
                    body: favoriteChannelIds.map((i) => {
                        return {
                            user_id: user.id,
                            category: "favorite_channel",
                            name: i,
                            value: "true",
                        };
                    }),
                },
            ).catch((error) => {
                const message = `Error setting favorite channels for user ${user.id}: ${error.message}`;
                console.error(message);
                sendEmergencyEmailToDev(user.id, message);
            });
        });
    }
});
