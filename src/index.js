import { Events } from "discord.js";

import {
  client,
  registerCommands,
} from "./config/discord.js";

import { env } from "./config/env.js";
import { commands } from "./commands/definitions.js";

import {
  handleInteraction,
} from "./handlers/interactionHandler.js";

import {
  createMessageHandler,
} from "./handlers/messageHandler.js";

import {
  startHourlyReminders,
} from "./handlers/hourlyHandler.js";

import {
  handleWelcome,
} from "./handlers/welcomeHandler.js";

import {
  handleGuildMemberRemove,
} from "./handlers/guildMemberRemove.js"; // <-- أضفنا استيراد ملف المغادرة

import {
  setupActivityTracking,
} from "./handlers/activityHandler.js";

import { webServer } from "./server.js";

import {
  cacheCreatedInvite,
  initializeInviteCache,
  recordInvite,
  removeCachedInvite,
  resolveInviter,
} from "./services/inviteService.js";

client.once(
  Events.ClientReady,
  async (readyClient) => {
    console.info(
      `Ready as ${readyClient.user.tag}.`,
    );

    console.info(
      `Bot owner configured: ${env.ownerId}.`,
    );

    await initializeInviteCache(client);

    startHourlyReminders(client);

    setupActivityTracking(client);
  },
);

client.on(
  Events.InviteCreate,
  cacheCreatedInvite,
);

client.on(
  Events.InviteDelete,
  removeCachedInvite,
);

client.on(
  Events.InteractionCreate,
  async (interaction) => {
    try {
      await handleInteraction(interaction);
    } catch (error) {
      console.error(
        "Interaction handler failed.",
        error,
      );
    }
  },
);

client.on(
  Events.MessageCreate,
  createMessageHandler(client),
);

client.on(
  Events.GuildMemberAdd,
  async (member) => {
    console.info(
      `New member joined: ${member.user.tag} (${member.id})`,
    );

    let inviter = null;

    try {
      inviter = await resolveInviter(member);

      if (inviter) {
        await recordInvite(
          member.guild.id,
          inviter,
          member,
        );
      }
    } catch (error) {
      console.error(
        `Invite tracking failed for ${member.user.tag}.`,
        error,
      );
    }

    try {
      await handleWelcome(
        member,
        inviter,
      );

      console.info(
        `Welcome card completed for ${member.user.tag}.`,
      );
    } catch (error) {
      console.error(
        `Welcome handler failed for ${member.user.tag}.`,
        error,
      );
    }
  },
);

client.on(
  Events.GuildMemberRemove,
  async (member) => {
    console.info(
      `Member left: ${member.user.tag} (${member.id})`,
    );

    try {
      await handleGuildMemberRemove(member);

      console.info(
        `Goodbye message sent for ${member.user.tag}.`,
      );
    } catch (error) {
      console.error(
        `GuildMemberRemove handler failed for ${member.user.tag}.`,
        error,
      );
    }
  },
);

async function shutdown(signal) {
  console.info(
    `Received ${signal}; shutting down.`,
  );

  try {
    client.destroy();

    await new Promise((resolve) => {
      if (!webServer.listening) {
        resolve();
        return;
      }

      webServer.close(() => resolve());
    });

    console.info(
      "Bot and web server shut down successfully.",
    );
  } catch (error) {
    console.error(
      "Shutdown failed.",
      error,
    );
  } finally {
    process.exit(0);
  }
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "Unhandled promise rejection.",
      error,
    );
  },
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught exception.",
      error,
    );
  },
);

try {
  await registerCommands(commands);

  await client.login(env.discordToken);

  console.info(
    "Discord bot successfully logged in.",
  );
} catch (error) {
  console.error(
    "Discord bot failed to start.",
    error,
  );

  if (webServer.listening) {
    webServer.close();
  }

  process.exitCode = 1;
}
