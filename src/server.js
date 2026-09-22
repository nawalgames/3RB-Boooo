import express from "express";
import { env } from "./config/env.js";

export const app = express();

app.get("/", (_request, response) => {
  response
    .status(200)
    .send("3RB Bot is Online with Firebase & AI Fallback System!");
});

export const webServer = app.listen(env.port, "0.0.0.0", () => {
  console.info(`Uptime server listening on port ${env.port}.`);
});
