import {
  Collection,
  PermissionsBitField,
} from "discord.js";

import { db } from "../config/firebase.js";

const inviteSnapshots = new Map();
const guildQueues = new Map();
const warnedGuilds = new Set();

const wait = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

function inviteUses(invite) {
  return Number(invite?.uses) || 0;
}

function queueGuildTask(guildId, task) {
  const previousTask =
    guildQueues.get(guildId) ??
    Promise.resolve();

  const nextTask = previousTask
    .catch(() => {})
    .then(task);

  guildQueues.set(guildId, nextTask);

  return nextTask.finally(() => {
    if (guildQueues.get(guildId) === nextTask) {
      guildQueues.delete(guildId);
    }
  });
}

async function fetchInvites(guild) {
  const botMember = guild.members.me;

  if (
    botMember &&
    !botMember.permissions.has(
      PermissionsBitField.Flags.ManageGuild,
    )
  ) {
    if (!warnedGuilds.has(guild.id)) {
      warnedGuilds.add(guild.id);

      console.error(
        `[3RB] لا يمكن معرفة الداعي في سيرفر ${guild.name}. يجب إعطاء البوت صلاحية Manage Server / إدارة السيرفر.`,
      );
    }

    return null;
  }

  try {
    return await guild.invites.fetch({
      cache: false,
    });
  } catch (error) {
    if (!warnedGuilds.has(guild.id)) {
      warnedGuilds.add(guild.id);

      console.error(
        `[3RB] فشل جلب دعوات سيرفر ${guild.name}. تأكد من صلاحية Manage Server / إدارة السيرفر.`,
        error,
      );
    }

    return null;
  }
}

export async function initializeInviteCache(client) {
  for (const guild of client.guilds.cache.values()) {
    const invites = await fetchInvites(guild);

    if (invites) {
      inviteSnapshots.set(guild.id, invites);

      console.info(
        `[3RB] تم تحميل ${invites.size} دعوة من سيرفر ${guild.name}.`,
      );
    }
  }
}

export function cacheCreatedInvite(invite) {
  if (!invite.guild) return;

  const invites =
    inviteSnapshots.get(invite.guild.id) ??
    new Collection();

  invites.set(invite.code, invite);

  inviteSnapshots.set(
    invite.guild.id,
    invites,
  );
}

export function removeCachedInvite(invite) {
  if (!invite.guild) return;

  const invites =
    inviteSnapshots.get(invite.guild.id);

  if (invites) {
    invites.delete(invite.code);
  }
}

function findIncreasedInvite(previous, current) {
  const candidates = [];

  for (const invite of current.values()) {
    const oldInvite = previous.get(invite.code);

    const oldUses = inviteUses(oldInvite);
    const newUses = inviteUses(invite);

    if (newUses > oldUses) {
      candidates.push({
        invite,
        increase: newUses - oldUses,
      });
    }
  }

  candidates.sort(
    (first, second) =>
      second.increase - first.increase,
  );

  return candidates[0]?.invite ?? null;
}

export async function resolveInviter(member) {
  return queueGuildTask(
    member.guild.id,
    async () => {
      const previous =
        inviteSnapshots.get(member.guild.id);

      if (!previous) {
        console.warn(
          `[3RB] لا يوجد كاش للدعوات في سيرفر ${member.guild.name}; لا يمكن تحديد الداعي لهذا العضو.`,
        );

        return null;
      }

      // إعادة المحاولة لأن Discord قد يتأخر في تحديث uses.
      for (
        let attempt = 0;
        attempt < 4;
        attempt += 1
      ) {
        await wait(
          attempt === 0 ? 1500 : 1000,
        );

        const current =
          await fetchInvites(member.guild);

        if (!current) {
          return null;
        }

        const usedInvite =
          findIncreasedInvite(
            previous,
            current,
          );

        inviteSnapshots.set(
          member.guild.id,
          current,
        );

        if (usedInvite?.inviter) {
          console.info(
            `[3RB] تم تحديد الداعي ${usedInvite.inviter.tag} عبر الدعوة ${usedInvite.code}.`,
          );

          return usedInvite.inviter;
        }
      }

      console.info(
        `[3RB] لم يتم تحديد داعٍ للعضو ${member.user.tag}. قد يكون الدخول عبر رابط مخصص أو رابط لم يعد موجودًا.`,
      );

      return null;
    },
  );
}

export async function recordInvite(
  guildId,
  inviter,
  invitedMember,
) {
  if (
    !inviter ||
    !invitedMember ||
    inviter.id === invitedMember.id
  ) {
    return {
      counted: false,
      count: 0,
    };
  }

  // يمنع احتساب نفس العضو مرتين.
  const referralRef = db.ref(
    `inviteMembers/${guildId}/${invitedMember.id}`,
  );

  const referralTransaction =
    await referralRef.transaction(
      (current) =>
        current ?? {
          inviterId: inviter.id,
          inviterTag: inviter.tag,
          memberId: invitedMember.id,
          counted: false,
          createdAt: new Date().toISOString(),
        },
    );

  const referral =
    referralTransaction.snapshot.val();

  if (
    !referral ||
    referral.inviterId !== inviter.id
  ) {
    return {
      counted: false,
      count: 0,
    };
  }

  // قفل ذري لمنع التكرار.
  const countedTransaction =
    await referralRef
      .child("counted")
      .transaction((current) =>
        current === true
          ? undefined
          : true,
      );

  if (!countedTransaction.committed) {
    const existingInviter =
      await db
        .ref(`invites/${inviter.id}`)
        .once("value");

    const existingData =
      existingInviter.val();

    return {
      counted: false,
      count:
        Number(
          existingData?.guilds?.[guildId]
            ?.invitedCount ??
            existingData?.invitedCount,
        ) || 0,
    };
  }

  const inviterRef = db.ref(
    `invites/${inviter.id}`,
  );

  const inviterSnapshot =
    await inviterRef.once("value");

  const legacyCount =
    Number(
      inviterSnapshot.val()?.invitedCount,
    ) || 0;

  // عداد خاص بالسيرفر.
  const guildCountRef =
    inviterRef.child(
      `guilds/${guildId}/invitedCount`,
    );

  const guildCountTransaction =
    await guildCountRef.transaction(
      (current) =>
        current === null ||
        current === undefined
          ? legacyCount + 1
          : (Number(current) || 0) + 1,
    );

  // تحديث العداد القديم للمحافظة على البيانات القديمة.
  await inviterRef
    .child("invitedCount")
    .transaction(
      (current) =>
        (Number(current) || 0) + 1,
    );

  await inviterRef.update({
    userId: inviter.id,
    tag: inviter.tag,
  });

  const count =
    Number(
      guildCountTransaction.snapshot.val(),
    ) || 0;

  console.info(
    `[3RB] تم تسجيل دعوة جديدة للداعي ${inviter.tag}. المجموع في هذا السيرفر: ${count}.`,
  );

  return {
    counted: true,
    count,
  };
}

export async function getInviteCount(
  guildId,
  userId,
) {
  const snapshot = await db
    .ref(`invites/${userId}`)
    .once("value");

  const data = snapshot.val();

  const guildCount =
    data?.guilds?.[guildId]?.invitedCount;

  return {
    userId,
    tag: data?.tag ?? null,
    count:
      Number(
        guildCount ?? data?.invitedCount,
      ) || 0,
  };
}

export async function getInviteLeaderboard(
  guildId,
  limit = 3,
) {
  const snapshot = await db
    .ref("invites")
    .once("value");

  const data = snapshot.val();

  if (!data) {
    return [];
  }

  return Object.entries(data)
    .map(([userId, userInfo]) => ({
      userId,
      tag: userInfo?.tag ?? null,
      count:
        Number(
          userInfo?.guilds?.[guildId]
            ?.invitedCount ??
            userInfo?.invitedCount,
        ) || 0,
    }))
    .filter((item) => item.count > 0)
    .sort(
      (first, second) =>
        second.count - first.count,
    )
    .slice(0, limit);
}
