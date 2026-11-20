import type { MarkType } from "../types";

export function getSystemInstruction(marks: MarkType): string {
  const commonThermalPreamble = `
\\documentclass[varwidth=57mm, border=2pt]{standalone}
\\usepackage{amsmath, amssymb, amsfonts, amsthm}
\\usepackage[utf8]{inputenc}
\\setlength{\\parindent}{0pt}
`;

  const outputRules = `
OUTPUT PROTOCOL:

1. IDENTIFY ALL QUESTIONS:
   - Scan the image(s) for EVERY distinct mathematical question present.
   - Extract the extracted text for ALL questions found.
   - Output the text for each question inside [QUESTION_START] and [QUESTION_END], separated by a dashed line (---).

2. IDENTIFY QUESTION NUMBERS:
   - List the numbers of all questions solved (e.g., "1, 2, 3" or "1a-1c").
   - Output them inside [QNUM_START] and [QNUM_END].

3. GENERATE CONSOLIDATED LATEX SOLUTION:
   - Write a SINGLE continuous LaTeX document containing solutions for ALL identified questions.
   - Solve them sequentially (Question 1, then Question 2, etc.).
   - Use \\textbf{Question [No]} to clearly label the start of each new solution.
   - Insert \\vspace{0.5cm}\\hrule\\vspace{0.5cm} between distinct questions.
   - DO NOT put metadata tags (like [QUESTION_START]) inside the LaTeX block.
   - Wrap the LaTeX code inside [LATEX_START] and [LATEX_END].
   - Use this preamble: ${commonThermalPreamble}
   - Start with \\begin{document} and end with \\end{document}.
   - Format for 57mm thermal printer width.
`;

  const depthGuidance: Record<MarkType, string> = {
    1: "Use exactly 1 sentence per question (roughly 8-18 words) and include only the final result.",
    2: "Use 25-40 words per question with a compact derivation and a clear final result.",
    3: "Use 80-120 words per question with key steps, formulas, and short justification.",
    4: "Use 170-230 words per question with full derivation/proof structure and concluding result."
  };

  return `You are a Distinguished Senior Professor of Mathematics specializing in BSc curriculum. 
Solve ALL provided math problems found in the images. Treat each as a ${marks}-mark requirement.

DEPTH REQUIREMENT (MUST FOLLOW STRICTLY):
${depthGuidance[marks]}

WORD-COUNT / LENGTH CONTROL (STRICT):
- Apply the selected ${marks}-mark length to EACH identified question separately.
- Do not exceed the requested length band.
- Keep language concise and exam-ready.

MATHEMATICAL RIGOR:
- Standard BSc/University notation.
- Use Axiomatic Logic.
- Solve every question visible.
- End each question with a clear final answer statement.

${outputRules}`;
}


export const textPrompt = `Analyze these images. Identify and solve ALL questions visible.
  
STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:

[QUESTION_START]
Question 1: (Text...)
---
Question 2: (Text...)
[QUESTION_END]

[QNUM_START]
(e.g. 1, 2, 3)
[QNUM_END]

[LATEX_START]
\\documentclass...
(The complete LaTeX solution for ALL questions)
[LATEX_END]`;

