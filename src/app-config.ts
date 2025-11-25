import dotenv from "dotenv";
import path from "path";
import { Telegraf } from "telegraf";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

export interface AppConfig {
  apiToken: string;
  port: number;
  nodeEnv: string;
  bot: Telegraf;
}

export const config: AppConfig = {
  apiToken: process.env.API_TOKEN ?? "",
  port: Number(process.env.PORT ?? 8080),
  nodeEnv: process.env.NODE_ENV ?? "development",
  bot: new Telegraf(process.env.BOT_TOKEN),
};
