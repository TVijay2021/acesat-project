// Parses the College Board "Digital SAT Sample Questions" text dump into the
// typed JSON bank the app ships. Run with `npm run seed`.
//
// Source: publicly released College Board sample questions. Attribution lives
// in the generated file and the README.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, "../../sat-questions-extracted.txt");
const OUT = resolve(here, "../src/data/questions.json");

// Page furniture that the PDF extractor interleaved into the prose. These lines
// appear mid-sentence, so they are removed before any parsing happens.
const PAGE_NOISE = [
  /^-- \d+ of \d+ --$/,
  /^\d*\s*THE DIGITAL SAT SAMPLE QUESTIONS.*$/,
  /^Digital\s+SAT®$/,
  /^Sample Questions and$/,
  /^Answer Explanations$/,
];

const QUESTION_START = /^(RW|Math) question (\d+)$/;
const CHOICE_START = /^([A-D])\)\s*(.*)$/;
const FIELD = /^(Keys?|Domain|Skill)\s+(.+)$/;

function clean(raw) {
  return raw
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").replace(/\s+$/, ""))
    .filter((line) => !PAGE_NOISE.some((re) => re.test(line.trim())))
    .join("\n");
}

// Splits the document into one text block per question.
function splitQuestions(text) {
  const blocks = [];
  let current = null;
  for (const line of text.split("\n")) {
    const start = QUESTION_START.exec(line.trim());
    if (start) {
      if (current) blocks.push(current);
      current = {
        section: start[1] === "RW" ? "reading-writing" : "math",
        number: Number(start[2]),
        lines: [],
      };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

// Joins wrapped lines into a paragraph, preserving intentional breaks.
function joinLines(lines) {
  return lines
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// The answer key is the only field that can be confused with body text: a
// grid-in question has no choices, so "Key −32" sits directly after the stem.
// It is only a field when the metadata block follows it, so look ahead for the
// Domain line rather than guessing from the current phase.
function findFieldsStart(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (!/^Keys?\s+\S/.test(lines[i].trim())) continue;
    const following = lines
      .slice(i + 1)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 2);
    if (following.some((l) => /^Domain\s+\S/.test(l))) return i;
  }
  return -1;
}

function parseBlock(block) {
  const { lines } = block;
  const stem = [];
  const choices = [];
  const fields = {};
  const explanation = [];

  const fieldsStart = findFieldsStart(lines);

  // Phases move strictly forward: stem -> choices -> fields -> explanation.
  let phase = "stem";
  let activeChoice = null;

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (phase === "explanation") {
      explanation.push(trimmed);
      continue;
    }

    if (/^Key Explanation:/.test(trimmed)) {
      phase = "explanation";
      explanation.push(trimmed.replace(/^Key Explanation:\s*/, ""));
      continue;
    }

    if (index === fieldsStart) {
      phase = "fields";
      activeChoice = null;
    }

    if (phase === "fields") {
      const field = FIELD.exec(trimmed);
      // A Skill value can be followed by a wrapped description; keep the first.
      if (field && !fields[field[1].toLowerCase().replace(/^keys$/, "key")]) {
        fields[field[1].toLowerCase().replace(/^keys$/, "key")] = field[2].trim();
      }
      continue;
    }

    const choice = CHOICE_START.exec(trimmed);
    if (choice) {
      phase = "choices";
      activeChoice = { label: choice[1], lines: [choice[2]] };
      choices.push(activeChoice);
      continue;
    }

    if (phase === "choices" && activeChoice) {
      activeChoice.lines.push(trimmed);
      continue;
    }

    stem.push(trimmed);
  }

  const [keyExplanation, ...distractors] = joinLines(explanation).split(
    /Distractor Explanations:\s*/
  );

  return {
    id: `${block.section === "math" ? "math" : "rw"}-${block.number}`,
    section: block.section,
    number: block.number,
    domain: fields.domain ?? "Unknown",
    skill: fields.skill ?? "Unknown",
    stem: joinLines(stem),
    choices: choices.map((c) => ({ label: c.label, text: joinLines(c.lines) })),
    // Grid-in math questions have no choices; the key is the literal answer.
    format: choices.length ? "multiple-choice" : "grid-in",
    answer: fields.key ?? "",
    explanation: keyExplanation?.trim() ?? "",
    distractorExplanation: distractors.join(" ").trim() || null,
  };
}

const overrides = JSON.parse(
  readFileSync(resolve(here, "./notation-overrides.json"), "utf8")
);

const parsed = splitQuestions(clean(readFileSync(SOURCE, "utf8")))
  .map(parseBlock)
  .map((question) => {
    const stem = overrides.stems[question.id];
    return stem ? { ...question, stem } : question;
  });

// An override that no longer matches a question means the source text changed
// and the correction is silently doing nothing.
const ids = new Set(parsed.map((q) => q.id));
const orphaned = Object.keys(overrides.stems).filter((id) => !ids.has(id));
if (orphaned.length) {
  console.error(`Overrides target missing questions: ${orphaned.join(", ")}`);
  process.exit(1);
}

// Fail loudly rather than shipping a half-parsed bank.
const broken = parsed.filter(
  (q) => !q.stem || !q.answer || q.domain === "Unknown"
);
if (broken.length) {
  console.error(`Incomplete questions: ${broken.map((q) => q.id).join(", ")}`);
  process.exit(1);
}

const bank = {
  source:
    "College Board, Digital SAT Sample Questions and Answer Explanations (publicly released).",
  generatedAt: new Date().toISOString().slice(0, 10),
  questions: parsed,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(bank, null, 2) + "\n");

const byDomain = parsed.reduce((acc, q) => {
  acc[q.domain] = (acc[q.domain] ?? 0) + 1;
  return acc;
}, {});
console.log(`Wrote ${parsed.length} questions to ${OUT}`);
console.log(
  `  multiple choice: ${parsed.filter((q) => q.format === "multiple-choice").length}`
);
console.log(`  grid-in: ${parsed.filter((q) => q.format === "grid-in").length}`);
for (const [domain, count] of Object.entries(byDomain).sort()) {
  console.log(`  ${domain}: ${count}`);
}
