
export type MarkType = 1 | 2 | 3 | 4;
export type ModelChoice = "gemini" | "claude" | "deepseek";
export type ModelAvailability = "available" | "not-listed" | "unknown";

export interface MathResult {
  question: string;
  given: string;
  solution: string;
  answer: string;
  fullText: string;
  latexCode: string;
  startQNum: string; 
}

export interface AppState {
  images: string[];
  marks: MarkType;
  loading: boolean;
  result: MathResult | null;
  error: string | null;
  statusMessage: string;
  isCropping: boolean;
  pendingImage: string | null;
}
