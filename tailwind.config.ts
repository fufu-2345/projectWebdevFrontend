// tailwind config is required for editor support

import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config";

const config: Pick<Config, "content" | "presets"> = {
  content: ["./app/**/*.{tsx,ts}", "./components/**/*.{tsx,ts}"],
  presets: [sharedConfig],
};

export default config;
