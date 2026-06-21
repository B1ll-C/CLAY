import { Config } from "drizzle-kit";

export default {
  schema: "./models/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "expo",
} satisfies Config;
