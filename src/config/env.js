import "dotenv/config";

const required = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const optional = (name) => process.env[name]?.trim() || null;

export const env = Object.freeze({
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  port: Number(process.env.PORT || 3000),
  ownerId: optional("OWNER_ID") || "1521900880222490743",
  levelUpChannelId: required("LEVEL_UP_CHANNEL_ID"),
  generalChannelId: optional("GENERAL_CHANNEL_ID"),
  rulesChannelId: optional("RULES_CHANNEL_ID"),
  
  // إضافة مفاتيح التذاكر متوافق مع ticketHandler.js
  ticketCategoryId: optional("TICKET_CATEGORY_ID"),
  supportRoleId: optional("SUPPORT_ROLE_ID"),
  ticketChannelId: optional("TICKET_CHANNEL_ID"),

  firebase: Object.freeze({
    databaseUrl: required("FIREBASE_DATABASE_URL"),
    projectId: required("FIREBASE_PROJECT_ID"),
    clientEmail: required("FIREBASE_CLIENT_EMAIL"),
    privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
  }),
  ai: Object.freeze({
    geminiApiKey: optional("GEMINI_API_KEY"),
    groqApiKey: optional("GROQ_API_KEY"),
    openRouterApiKey: optional("OPENROUTER_API_KEY"),
    groqModel: optional("GROQ_MODEL") || "llama-3.1-8b-instant",
    openRouterModel: optional("OPENROUTER_MODEL") || "openrouter/free",
  }),
});

if (!env.ai.geminiApiKey && !env.ai.groqApiKey && !env.ai.openRouterApiKey) {
  throw new Error(
    "Missing AI API keys. Add at least one of GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY.",
  );
}

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
