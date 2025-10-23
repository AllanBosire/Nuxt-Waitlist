import { consola } from "consola";
import type { H3Event } from "h3";
import { joinURL } from "ufo";

export async function deleteUser(email: string) {
    const user = await useDrizzle()
        .delete(tables.waitlist)
        .where(eq(tables.waitlist.email, email))
        .returning()
        .execute()
        .catch(consola.fatal);

    user?.forEach((user) => {
        sendMail({
            to: user.email,
            subject: "Account Deletion",
            text: "Your account has been deleted successfully",
        });
    });
}

const getMMUserFromCookie = defineCachedFunction(
    (cookie: string) => {
        const config = useRuntimeConfig();
        return $fetch<MMUser | undefined>(
            joinURL(config.public.mmUrl, "/api/v4/users/me"),
            {
                headers: {
                    Authorization: `Bearer ${cookie}`,
                },
            },
        );
    },
    {
        maxAge: 60,
    },
);

export function isAdmin(user: { email: string; roles?: string }) {
    const config = useRuntimeConfig();

    if (user.roles?.includes("admin")) {
        return true;
    }

    const admins = config.mattermost.admins.split(",").filter(Boolean);
    if (!admins.includes(user.email)) {
        return false;
    }

    return true;
}

export function isModerator(user: { email: string; roles?: string }) {
    const config = useRuntimeConfig();

    const moderators = config.mattermost.bots.moderator.persons
        .split(",")
        .filter(Boolean);
    if (!moderators.includes(user.email)) {
        return false;
    }

    return true;
}

/**
 * @throws When user is not admin
 */
export async function ensureAdmin(event: H3Event) {
    const cookie = getCookie(event, "MMAUTHTOKEN");
    if (!cookie) {
        throw createError({
            status: 404,
            message: "No MMAUTHTOKEN cookie",
        });
    }

    const user = await getMMUserFromCookie(cookie);
    if (!user) {
        throw createError({
            statusCode: 404,
        });
    }

    if (!isAdmin(user)) {
        throw createError({ statusCode: 401 });
    }

    return user;
}

export async function* getAllUsers(page: number = 0) {
    const config = useRuntimeConfig();
    while (true) {
        const users = await $fetch<MMUser[]>(
            joinURL(config.public.mmUrl, "/api/v4/users"),
            {
                headers: {
                    Authorization: `Bearer ${config.mattermost.token}`,
                },
                query: {
                    page,
                    active: true,
                },
            },
        ).catch((e) => {
            consola.fatal(e);
            return undefined;
        });

        if (!users || !users.length) {
            break;
        }

        yield users;
        page = page + 1;
    }
}

export async function addUsersToMMChannel(
    user_ids: string[] | string,
    channelID: string,
) {
    const config = useRuntimeConfig();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return $fetch(
        joinURL(config.public.mmUrl, "api/v4/channels/", channelID, "/members"),
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.mattermost.token}`,
            },
            body: {
                user_ids: Array.isArray(user_ids) ? user_ids : [user_ids],
            },
        },
    );
}
