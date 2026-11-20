import type { ModelChoice } from "./types";

export const MODEL_LABELS: Record<ModelChoice, string> = {
  gemini: "Gemini 2.5 Flash",
  claude: "Claude Sonnet 4.5 (High)",
  deepseek: "DeepSeek V4 (Flash High)",
};

export const MODEL_CHOICES: ModelChoice[] = ["gemini", "claude", "deepseek"];
