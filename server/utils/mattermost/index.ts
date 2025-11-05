import { joinURL } from "ufo";
import { consola } from "consola";
import { v7, v4 } from "uuid";
import { eq } from "drizzle-orm";
import { sendWelcomeMessage } from "../messages/welcome";

export interface MattermostUserCreateResponse {
  id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  username: string;
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  email_verified: boolean;
  auth_service: string;
  roles: string;
  locale: string;
  notify_props: NotifyProps;
  props: {};
  last_password_update: number;
  last_picture_update: number;
  failed_attempts: number;
  mfa_active: boolean;
  timezone: Timezone;
  terms_of_service_id: string;
  terms_of_service_create_at: number;
}

export interface NotifyProps {
  email: string;
  push: string;
  desktop: string;
  desktop_sound: string;
  mention_keys: string;
  channel: string;
  first_name: string;
  auto_responder_message: string;
  push_threads: string;
  comments: string;
  desktop_threads: string;
  email_threads: string;
}

export interface MMUser {
  id: string;
  create_at: number;
  update_at: number;
  delete_at: number;
  username: string;
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  email_verified: boolean;
  auth_service: string;
  roles: string;
  locale: string;
  notify_props: NotifyProps;
  props: {};
  last_password_update: number;
  last_picture_update: number;
  failed_attempts: number;
  mfa_active: boolean;
  timezone: Timezone;
  terms_of_service_id: string;
  terms_of_service_create_at: number;
}

export interface NotifyProps {
  email: string;
  push: string;
  desktop: string;
  desktop_sound: string;
  mention_keys: string;
  channel: string;
  first_name: string;
  auto_responder_message: string;
  push_threads: string;
  comments: string;
  desktop_threads: string;
  email_threads: string;
}

export interface Timezone {
  useAutomaticTimezone: string;
  manualTimezone: string;
  automaticTimezone: string;
}

export function getMatterMostUserById(id: string) {
  const config = useRuntimeConfig();
  return $fetch<MMUser[]>(joinURL(config.public.mmUrl, "/api/v4/users/ids"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.mattermost.token}`,
      "Content-Type": "application/json",
    },
    body: [id],
  })
    .then((data) => {
      return data?.[0];
    })
    .catch((e) => {
      consola.fatal(e);
      return undefined;
    });
}

export function getMatterMostUserByEmail(email: string) {
  const config = useRuntimeConfig();

  return $fetch<MMUser>(
    joinURL(
      config.public.mmUrl,
      `/api/v4/users/email/${encodeURIComponent(email)}`
    ),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.mattermost.token}`,
        "Content-Type": "application/json",
      },
    }
  ).catch((e) => {
    return undefined;
  });
}

export async function getMatterMostUserByUsername(username: string) {
  if (!username) {
    return undefined;
  }

  const config = useRuntimeConfig();
  const results = await $fetch<MMUser>(
    joinURL(config.public.mmUrl, `/api/v4/users/username/${username}`),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.mattermost.token}`,
      },
    }
  ).catch((e) => {
    console.log(e);
    if (e?.response?.status === 404) {
      return undefined;
    }

    consola.fatal(e);
  });

  if (!results) {
    return undefined;
  }

  if (Array.isArray(results) && !results.length) {
    return undefined;
  }

  return results;
}

export async function getNewUsername(email: string) {
  let username = email.split("@")[0];
  if (!username) {
    throw createError("Unable to obtain username from: " + email);
  }

  const exists = await getMatterMostUserByUsername(username);
  if (!exists || !exists.length) {
    return username;
  }

  const [name, number] = username.split("_");
  if (number) {
    var count = toNumber(number) + 1;
  } else {
    var count = 1;
  }

  username = `${name}_${count}`;
  return getNewUsername(username);
}

export function addUserToTeam(userId: string, teamId: string) {
  const config = useRuntimeConfig();
  return $fetch(
    joinURL(config.public.mmUrl, `/api/v4/teams/${teamId}/members`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.mattermost.token}`,
        "Content-Type": "application/json",
      },
      body: { team_id: teamId, user_id: userId },
    }
  );
}

export function createMagicLink(token: string, email: string) {
  const config = useRuntimeConfig();
  return joinURL(config.public.appUrl, `/token?it=${token}&email=${email}`);
}

export function getUserByEmail(email: string) {
  return useDrizzle().query.waitlist.findFirst({
    where: (user, { eq }) => eq(user.email, email),
  });
}

export async function createMattermostUser(_user: {
  password: string;
  email: string;
}) {
  const config = useRuntimeConfig();
  const token = v7();
  const user = await $fetch<MattermostUserCreateResponse>(
    joinURL(config.public.mmUrl, "/api/v4/users"),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.mattermost.token}`,
      },
      body: {
        email: _user.email,
        password: _user.password,
        username: await getNewUsername(_user.email).catch((e) => {
          console.error(e);
          return undefined;
        }),
      },
      onResponseError({ response }) {
        consola.error(response._data);
      },
    }
  );

  if (!user) {
    consola.fatal("Could not create mattermost user");
    return undefined;
  }

  addUserToTeam(user.id, config.mattermost.team_id).catch((e) => {
    consola.error(e);
    consola.fatal("Could not add mattermost user to finueva team");
  });

  const publicChannels = config.mattermost.public_channel_ids
    .split(",")
    .filter(Boolean);
  for (const channel of publicChannels) {
    execute(addUsersToMMChannel, [user.id], channel).then(({ error }) => {
      if (error) {
        consola.warn("Unable to add user to channel", user.id);
        consola.fatal(error);
      }
    });
  }

  const link = createMagicLink(token, user.email);
  sendWelcomeMessage(user.id, config.mattermost.bots.welcome.version);
  sendInviteKnowhowMessage(user.id, config.mattermost.bots.invite.version);
  return {
    user,
    link,
  };
}

export function normalisePassword(pswd: string): string {
  if (typeof pswd !== "string") {
    throw new TypeError("Password must be a string");
  }

  // Trim whitespace
  const clean = pswd.trim();

  // Truncate to max bcrypt-supported length
  return clean.length > 72 ? clean.slice(0, 72) : clean;
}

export function normaliseUsername(name: string): string {
  if (typeof name !== "string") {
    throw new TypeError("Username must be a string");
  }

  // 1. Lowercase the username
  let clean = name.toLowerCase().trim();

  // 2. Remove invalid characters (allow only [a-z0-9._-])
  clean = clean.replace(/[^a-z0-9._-]/g, "");

  // 3. Ensure it doesn't start with a dot
  clean = clean.replace(/^\.+/, "");

  // 4. Enforce length: minimum 3, maximum 22
  if (clean.length < 3) {
    clean = clean.padEnd(3, "0"); // Pad with '0' to reach minimum length
  } else if (clean.length > 22) {
    clean = clean.slice(0, 22);
  }

  return clean;
}
