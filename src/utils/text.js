export function exemptChannelIds(value) {
  return (value ?? "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

export function isSalam(message) {
  return /(?:السلام|سلام)\s*[عع]ليكم|السَّلامُ?\s*عليكم/i.test(
    message.trim().replace(/[،.!؟?]/g, ""),
  );
}

export function containsLinkOrInvite(content) {
  return /https?:\/\/\S+|(?:discord\.gg|discord\.com\/invite)\/\S+/i.test(
    content,
  );
}

export function isLevelQuestion(content) {
  const text = content
    .toLocaleLowerCase()
    .replace(/[؟?!.,،]/g, "")
    .trim();

  return [
    "كم لفلي",
    "كم لفل",
    "كم مستواي",
    "ما هو مستواي",
    "وش لفلي",
    "وش مستواي",
    "لفلي كم",
    "مستواي كم",
  ].some((phrase) => text.includes(phrase));
}

export function splitDiscordMessage(content, maxLength = 1900) {
  return content.match(new RegExp(`[\\s\\S]{1,${maxLength}}`, "g")) ?? [];
}

export function normalizeKeyword(keyword) {
  return keyword.trim().toLocaleLowerCase();
}
