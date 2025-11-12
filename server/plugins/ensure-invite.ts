import { consola } from "consola";
import { sendInviteEmail } from "../utils/messages/invite";

const emailRegex =
  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;

export default defineEventHandler(async () => {
  const db = useDrizzle();
  const { version } = useRuntimeConfig().mattermost.bots.invite;
  if (import.meta.dev) {
    return;
  }
  const needLinks = await db.query.waitlist.findMany({
    where(fields, { sql, or, isNull, eq }) {
      return or(
        isNull(fields.sent_bot_messages),
        eq(fields.sent_bot_messages, sql`'{}'::jsonb`),
        sql`(${fields.sent_bot_messages}->'invite') = '{}'::jsonb`,
        sql`
				EXISTS (
					SELECT 1
					FROM jsonb_each_text(${
            fields.sent_bot_messages
          }->'invite') AS elem(version_key, value)
					WHERE version_key ~ '^[0-9]+$'
					AND (version_key)::int < ${toNumber(version)}
				)
			`
      );
    },
  });

  needLinks.forEach(async (user) => {
    const { result, error } = await execute(
      getMatterMostUserByEmail,
      user.email
    );
    if (error) {
      consola.fatal(error);
      return;
    }

    if (!result) {
      consola.fatal("No such mattermost user");
      return;
    }

    sendInviteKnowhowMessage(result.id, version);
  });

  const inviteBot = useMatterClient("invite");

  const BOT_ID = await inviteBot.userId();
  // const adminEmails = useRuntimeConfig().mattermost.admins.split(",").filter(Boolean);
  // const admins = await settle(adminEmails.map((email) => getMatterMostUserByEmail(email)));
  inviteBot.getWebSocket().on("posted", async (data) => {
    const { message, user_id } = tryParse<Post>(data.post);
    console.log(message);
    if (user_id === BOT_ID) {
      return;
    }

    const emails = String(message.toLowerCase()).matchAll(emailRegex);
    for (let [email] of emails) {
      email = email.trim();
      const hasInvite = await useDrizzle().query.invites.findFirst({
        where(fields, operators) {
          return operators.eq(fields.for_email, email);
        },
      });

      if (hasInvite) {
        console.info("Invite already exists for: ", email, hasInvite.code);
      }

      const { markdown: invitingMessage } = await getMarkdown(
        "sending-invite",
        {
          email,
        }
      );
      const dm = await getOrCreateDM({
        bot: "invite",
        user_id,
        message: invitingMessage,
      });
      const url = await showTyping(
        "invite",
        dm.id,
        (async function () {
          let url: string;

          if (hasInvite) {
            url = getInviteLink(hasInvite.code);
          } else {
            url = await sendInviteEmail(user_id, email);
          }

          // sleeep for 3 seconds
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return url;
        })()
      );

      if (!url) {
        consola.warn("There seems to have been an error of some kind");
        return;
      }

      const { markdown: sentMessage } = await getMarkdown("invite-sent", {
        email,
        url,
      });

      await getOrCreateDM({
        bot: "invite",
        user_id,
        message: sentMessage,
      });
    }
  });
});
