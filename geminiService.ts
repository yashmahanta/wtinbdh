
import { MarkType, MathResult, ModelChoice } from "./types";

const THERMAL_PREAMBLE = `\\documentclass[varwidth=57mm, border=2pt]{standalone}
\\usepackage{amsmath, amssymb, amsfonts, amsthm}
\\usepackage[utf8]{inputenc}
\\setlength{\\parindent}{0pt}`;

function extractBodyContent(latex: string): string {
  return latex
    .replace(/\\documentclass[^\n]*\n?/g, "")
    .replace(/\\usepackage(?:\[[^\]]*\])?\{[^}]*\}\n?/g, "")
    .replace(/\\setlength\{\\parindent\}\{[^}]*\}\n?/g, "")
    .replace(/\\begin\{document\}/g, "")
    .replace(/\\end\{document\}/g, "")
    .trim();
}

function normalizeLatex(rawLatex: string): string {
  let latex = rawLatex;

  // Remove accidental metadata tags that break compilation
  latex = latex.replace(/\[QUESTION_START\][\s\S]*?\[QUESTION_END\]/g, "");
  latex = latex.replace(/\[QNUM_START\][\s\S]*?\[QNUM_END\]/g, "");
  latex = latex.replace(/\[QNUM_START\]|\[QNUM_END\]|\[QUESTION_START\]|\[QUESTION_END\]/g, "");

  // Remove markdown fences and common pasted comments
  latex = latex.replace(/^```(?:latex)?\n?/i, "").replace(/\n?```$/, "");
  latex = latex.replace(/%+\s*[\r\n]+%\s*Welcome to Overleaf[\s\S]*?%+\s*[\r\n]+/gi, "");

  // Remove invisible/control chars that can cause parser issues
  latex = latex
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  // Guarantee a compilable standalone structure
  const hasDocClass = /\\documentclass/.test(latex);
  const body = extractBodyContent(latex);

  latex = hasDocClass
    ? `${THERMAL_PREAMBLE}\n\\begin{document}\n${body}\n\\end{document}`
    : `${THERMAL_PREAMBLE}\n\\begin{document}\n${latex}\n\\end{document}`;

  return latex.trim();
}

export async function analyzeMathQuestion(
  base64Images: string[],
  marks: MarkType,
  model: ModelChoice
): Promise<MathResult> {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: base64Images, marks, model }),
    });

    const data: { text?: string; error?: string } = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Gateway request failed (HTTP ${response.status}).`);
    }

    const text = data.text || "";
    // Extract metadata
    const questionMatch = text.match(/\[QUESTION_START\]([\s\S]*?)\[QUESTION_END\]/);
    const qNumMatch = text.match(/\[QNUM_START\]([\s\S]*?)\[QNUM_END\]/);
    const latexMatch = text.match(/\[LATEX_START\]([\s\S]*?)\[LATEX_END\]/);
    
    const questionText = questionMatch ? questionMatch[1].trim() : "Question text unavailable.";
    // Allow commas in QNum for lists like "1,2"
    const startQNum = qNumMatch ? qNumMatch[1].trim().replace(/[^0-9a-zA-Z,\-]/g, '') : "All";
    let latexCode = latexMatch ? latexMatch[1].trim() : "";

    // Fallback if LaTeX tags are missing
    if (!latexCode && text.includes("\\documentclass")) {
        const start = text.indexOf("\\documentclass");
        const end = text.lastIndexOf("\\end{document}");
        if (start !== -1 && end !== -1) {
            latexCode = text.substring(start, end + 14);
        } else if (start !== -1) {
             latexCode = text.substring(start);
        }
    }

    if (!latexCode.trim()) {
      throw new Error("Model response did not contain a LaTeX solution. Try again or choose a different model.");
    }

    latexCode = normalizeLatex(latexCode);

    const cleanedBody = extractBodyContent(latexCode);
    if (!cleanedBody) {
      throw new Error("Could not generate valid LaTeX content from the model response. Please upload a clearer crop and try again.");
    }

    return {
      question: questionText,
      given: "",
      solution: latexCode, // Cleaned LaTeX
      answer: "",
      fullText: text,
      latexCode: latexCode,
      startQNum
    };
  } catch (error: any) {
    console.error("AI gateway request error:", error);
    throw error;
  }
}
