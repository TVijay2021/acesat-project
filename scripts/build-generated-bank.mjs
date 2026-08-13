/**
 * Builds an original, deterministic question bank.
 *
 * Every item is generated from a parameterised template: the stem, the correct
 * answer, and all three distractors are computed. Distractors come from real
 * student error patterns (sign flips, radius/diameter, forgetting to square)
 * rather than random noise, so a wrong answer means something diagnostically.
 *
 * No model call, no API key, no third-party content. Seeded, so the same
 * command always produces the same bank.
 *
 *   node scripts/build-generated-bank.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AUTHORED } from "./authored-reading-writing.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../src/data/questions.generated.json");

/** Deterministic PRNG so the bank is reproducible across machines. */
function mulberry32(seed) {
  return function rng() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/** Trim floating point noise without turning integers into "3.00". */
function num(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

const money = (v) => `$${Number.isInteger(v) ? v : v.toFixed(2)}`;

/**
 * Each template returns a stem, the correct answer, three wrong answers, and
 * an explanation. `wrong` entries describe the misconception they encode.
 */
const TEMPLATES = [
  {
    key: "linear-combination",
    section: "math",
    domain: "Algebra",
    skill: "Linear functions",
    difficulty: "Easy",
    count: 14,
    make(rng) {
      const b = int(rng, 3, 12);
      const c = int(rng, 2, 9);
      const k = int(rng, 2, 5);
      const x = int(rng, 2, 6);
      const f = x + b;
      const g = c * x;
      const answer = k * f - g;
      return {
        stem: `If f(x) = x + ${b} and g(x) = ${c}x, what is the value of ${k}f(${x}) − g(${x})?`,
        correct: num(answer),
        wrong: [
          num(k * f + g), // subtracted the wrong way round
          num(f * k - g * x), // applied x twice to g
          num(k * (f - g)), // distributed k across both terms
        ],
        explanation: `f(${x}) = ${x} + ${b} = ${f} and g(${x}) = ${c}(${x}) = ${g}, so ${k}(${f}) − ${g} = ${answer}.`,
      };
    },
  },
  {
    key: "y-intercept",
    section: "math",
    domain: "Algebra",
    skill: "Linear equations in two variables",
    difficulty: "Easy",
    count: 10,
    make(rng) {
      const m = int(rng, 2, 9) * (rng() < 0.5 ? -1 : 1);
      const b = int(rng, 8, 40) * (rng() < 0.5 ? -1 : 1);
      return {
        stem: `The graph of y = ${m}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} in the xy-plane has y-intercept (0, y). What is the value of y?`,
        correct: num(b),
        wrong: [num(-b), num(m), num(m + b)],
        explanation: `Substituting x = 0 gives y = ${m}(0) ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${b}. The constant term is the y-intercept.`,
      };
    },
  },
  {
    key: "slope-meaning",
    section: "math",
    domain: "Algebra",
    skill: "Linear functions",
    difficulty: "Medium",
    count: 8,
    make(rng) {
      const base = int(rng, 60, 180);
      const per = int(rng, 8, 40);
      const item = pick(rng, [
        { thing: "video game system", unit: "game" },
        { thing: "printer", unit: "ink cartridge" },
        { thing: "bicycle", unit: "repair kit" },
        { thing: "camera body", unit: "lens filter" },
      ]);
      return {
        stem: `A linear function models the total cost y, in dollars, of a ${item.thing} plus x ${item.unit}s. From x = 0 to x = 1, y rises from ${money(base)} to ${money(base + per)}. What is the best interpretation of the slope?`,
        correct: `Each ${item.unit} costs ${money(per)}.`,
        wrong: [
          `The ${item.thing} costs ${money(base)}.`,
          `The ${item.thing} costs ${money(per)}.`,
          `Each ${item.unit} costs ${money(base)}.`,
        ],
        explanation: `Slope is the change in cost per additional ${item.unit}: ${base + per} − ${base} = ${per}. The ${money(base)} is the y-intercept, not the slope.`,
      };
    },
  },
  {
    key: "inequality-point",
    section: "math",
    domain: "Algebra",
    skill: "Linear inequalities in one or two variables",
    difficulty: "Medium",
    count: 12,
    make(rng) {
      const m = int(rng, 2, 6) * -1;
      const b = int(rng, 2, 9);
      const sat = { x: int(rng, -6, -2), y: 0 };
      const satisfies = (p) => p.y < m * p.x + b;
      if (!satisfies(sat)) sat.y = m * sat.x + b - int(rng, 1, 5);
      const bad = [
        { x: 2, y: -1 },
        { x: 2, y: 1 },
        { x: 0, y: b + int(rng, 1, 4) },
      ].map((p) => (satisfies(p) ? { ...p, y: m * p.x + b + int(rng, 1, 4) } : p));
      return {
        stem: `Which point (x, y) is a solution to the inequality y < ${m}x + ${b}?`,
        correct: `(${sat.x}, ${sat.y})`,
        wrong: bad.map((p) => `(${p.x}, ${p.y})`),
        explanation: `At (${sat.x}, ${sat.y}): ${m}(${sat.x}) + ${b} = ${m * sat.x + b}, and ${sat.y} < ${m * sat.x + b} is true. The other points all fail the inequality.`,
      };
    },
  },
  {
    key: "system-two-stores",
    section: "math",
    domain: "Algebra",
    skill: "Systems of two linear equations in two variables",
    difficulty: "Hard",
    count: 10,
    make(rng) {
      const a1 = int(rng, 3, 7) + 0.5;
      const b1 = int(rng, 2, 5);
      const a2 = a1 + int(rng, 1, 2);
      const b2 = b1 + int(rng, 3, 6);
      const r = int(rng, 2, 7);
      const q = int(rng, 3, 9);
      const totalA = a1 * r + b1 * q;
      const totalB = a2 * r + b2 * q;
      const fruit = pick(rng, [
        ["raspberries", "blackberries"],
        ["almonds", "walnuts"],
        ["tulips", "daffodils"],
      ]);
      return {
        stem: `Store A sells ${fruit[0]} for ${money(a1)} per pint and ${fruit[1]} for ${money(b1)} per pint. Store B sells ${fruit[0]} for ${money(a2)} per pint and ${fruit[1]} for ${money(b2)} per pint. A purchase costs ${money(totalA)} at store A or ${money(totalB)} at store B. How many pints of ${fruit[1]} are in the purchase?`,
        correct: num(q),
        wrong: [num(r), num(q + r), num(Math.max(1, q - 2))],
        explanation: `Let r and q be the pints of ${fruit[0]} and ${fruit[1]}. Then ${a1}r + ${b1}q = ${totalA} and ${a2}r + ${b2}q = ${totalB}. Eliminating r gives q = ${q}.`,
      };
    },
  },
  {
    key: "parabola-minimum",
    section: "math",
    domain: "Advanced Math",
    skill: "Nonlinear functions",
    difficulty: "Easy",
    count: 10,
    make(rng) {
      const c = int(rng, 12, 90);
      return {
        stem: `g(x) = x² + ${c}. What is the minimum value of g?`,
        correct: num(c),
        wrong: [num(c * c), num(2 * c), "0"],
        explanation: `A square is never negative, so x² + ${c} is smallest when x = 0, giving ${c}.`,
      };
    },
  },
  {
    key: "no-real-solutions",
    section: "math",
    domain: "Advanced Math",
    skill: "Nonlinear equations in one variable",
    difficulty: "Medium",
    count: 8,
    make(rng) {
      const h = int(rng, 1, 9);
      const k = int(rng, 2, 16);
      return {
        stem: `How many distinct real solutions does (x − ${h})² = −${k} have?`,
        correct: "Zero",
        wrong: ["Exactly one", "Exactly two", "Infinitely many"],
        explanation: `The square of a real number is never negative, so no real x satisfies (x − ${h})² = −${k}.`,
      };
    },
  },
  {
    key: "exponential-decay",
    section: "math",
    domain: "Advanced Math",
    skill: "Nonlinear functions",
    difficulty: "Medium",
    count: 10,
    make(rng) {
      const a = int(rng, 40, 300);
      const drop = pick(rng, [20, 25, 40, 50, 60, 75, 80]);
      const keep = (100 - drop) / 100;
      const n = pick(rng, [2, 3]);
      const answer = a * Math.pow(keep, n);
      return {
        stem: `For a function f, f(0) = ${a}, and each increase in x by 1 decreases f(x) by ${drop}%. What is the value of f(${n})?`,
        correct: num(answer),
        wrong: [
          num(a * keep), // stopped one step early
          num(a * (1 - (drop / 100) * n)), // treated the decay as linear
          num(a * Math.pow(drop / 100, n)), // kept the lost share instead
        ],
        explanation: `Dropping ${drop}% means keeping ${100 - drop}%. So f(x) = ${a}(${keep})^x, and f(${n}) = ${num(answer)}.`,
      };
    },
  },
  {
    key: "percent-of-percent",
    section: "math",
    domain: "Problem-Solving and Data Analysis",
    skill: "Percentages",
    difficulty: "Easy",
    count: 10,
    make(rng) {
      const p = pick(rng, [20, 25, 30, 40, 50, 60]);
      const q = pick(rng, [10, 20, 25, 30, 40, 50]);
      const trait = pick(rng, [
        ["red", "stripes"],
        ["glass", "a chip"],
        ["hardcover", "a torn jacket"],
      ]);
      const answer = (p * q) / 100;
      return {
        stem: `In a group, ${p}% of the items are ${trait[0]}. Of all the ${trait[0]} items, ${q}% also have ${trait[1]}. What percentage of the items in the group are ${trait[0]} and have ${trait[1]}?`,
        correct: `${num(answer)}%`,
        // A negative percentage is never a tempting wrong answer, so the
        // "subtracted instead of multiplying" error is taken as a magnitude.
        wrong: [`${num(Math.abs(p - q))}%`, `${num(p + q)}%`, `${num(q)}%`],
        explanation: `"${q}% of ${p}%" multiplies: 0.${String(q).padStart(2, "0")} × 0.${String(p).padStart(2, "0")} = ${num(answer / 100)}, or ${num(answer)}%. The percentages multiply, they don't subtract.`,
      };
    },
  },
  {
    key: "similar-triangles",
    section: "math",
    domain: "Geometry and Trigonometry",
    skill: "Lines, angles, and triangles",
    difficulty: "Medium",
    count: 10,
    make(rng) {
      const h1 = int(rng, 6, 30);
      const s1 = int(rng, 2, 10);
      const s2 = int(rng, 2, 9);
      const answer = (h1 / s1) * s2;
      return {
        stem: `Two trees stand perpendicular to flat ground. One tree is ${h1} feet tall and casts a shadow ${s1} feet long. At the same moment, the second tree casts a shadow ${s2} feet long. How tall, in feet, is the second tree?`,
        correct: num(answer),
        wrong: [
          num((s1 / h1) * s2), // inverted the ratio
          num(h1 - (s1 - s2)), // subtracted the shadow difference
          num(h1 * s2), // forgot to divide
        ],
        explanation: `The sun's angle is the same, so the triangles are similar: ${h1}/${s1} = h/${s2}, giving h = ${num(answer)} feet.`,
      };
    },
  },
  {
    key: "rectangle-diagonal",
    section: "math",
    domain: "Geometry and Trigonometry",
    skill: "Right triangles and trigonometry",
    difficulty: "Medium",
    count: 8,
    make(rng) {
      const short = int(rng, 3, 12);
      const long = int(rng, short + 2, short + 20);
      const diagSq = short * short + long * long;
      return {
        stem: `A rectangle has a diagonal of length √${diagSq} and a shorter side of length ${short}. What is the length of the longer side?`,
        correct: num(long),
        wrong: [
          num(diagSq - short * short), // stopped before the square root
          num(Math.round(Math.sqrt(diagSq) - short)), // subtracted the lengths
          num(short * 2),
        ],
        explanation: `By the Pythagorean theorem, ${diagSq} − ${short}² = ${diagSq - short * short}, and √${diagSq - short * short} = ${long}.`,
      };
    },
  },
  {
    key: "arc-circumference",
    section: "math",
    domain: "Geometry and Trigonometry",
    skill: "Circles",
    difficulty: "Medium",
    count: 10,
    make(rng) {
      const deg = pick(rng, [30, 36, 40, 45, 60, 72, 90]);
      const arc = int(rng, 2, 9);
      const answer = arc * (360 / deg);
      return {
        stem: `A circle has center O, with points A and B on the circle. Arc AB measures ${deg}° and has length ${arc} inches. What is the circumference of the circle, in inches?`,
        correct: num(answer),
        wrong: [
          num(arc * deg), // multiplied by the angle itself
          num(answer / 2), // used a half turn
          num(arc + deg),
        ],
        explanation: `${deg}° is ${deg}/360 of the circle, so the circumference is ${arc} × (360/${deg}) = ${num(answer)} inches.`,
      };
    },
  },
];

const rng = mulberry32(20260813);
const questions = [];
const seenStems = new Set();
const problems = [];

for (const template of TEMPLATES) {
  let made = 0;
  let guard = 0;

  while (made < template.count && guard < template.count * 40) {
    guard += 1;
    const item = template.make(rng);

    if (seenStems.has(item.stem)) continue;

    const all = [item.correct, ...item.wrong].map(String);
    // A template that collides with itself would ship two identical choices,
    // or a distractor that is silently correct. Skip rather than emit.
    if (new Set(all).size !== 4) continue;
    if (all.some((v) => v === "" || v.includes("NaN") || v.includes("Infinity"))) {
      continue;
    }

    seenStems.add(item.stem);
    made += 1;

    // Rotate the correct answer's position so it isn't always in one slot.
    const position = questions.length % 4;
    const ordered = [...item.wrong];
    ordered.splice(position, 0, item.correct);
    const labels = ["A", "B", "C", "D"];

    questions.push({
      id: `gen-${template.key}-${made}`,
      section: template.section,
      number: questions.length + 1,
      domain: template.domain,
      skill: template.skill,
      difficulty: template.difficulty,
      stem: item.stem,
      choices: ordered.map((text, i) => ({ label: labels[i], text: String(text) })),
      format: "multiple-choice",
      answer: labels[position],
      explanation: item.explanation,
      distractorExplanation: null,
      origin: "generated",
    });
  }

  if (made < template.count) {
    problems.push(`${template.key}: produced ${made} of ${template.count}`);
  }
}

// Reading items are authored rather than generated, but they join the same
// bank and face the same validation.
const LABELS = ["A", "B", "C", "D"];
let authoredIndex = 0;

for (const item of AUTHORED) {
  const body = item.notes
    ? `While researching a topic, a student has taken the following notes:\n${item.notes
        .map((n) => `• ${n}`)
        .join("\n")}`
    : item.passage;

  if (!body || !item.stem || item.choices.length !== 4) {
    problems.push(`${item.key}: malformed authored item`);
    continue;
  }
  if (new Set(item.choices).size !== 4) {
    problems.push(`${item.key}: duplicate choices`);
    continue;
  }
  if (item.answer < 0 || item.answer > 3) {
    problems.push(`${item.key}: answer index out of range`);
    continue;
  }

  // Authoring by hand clusters correct answers — B far more often than D. Rotate
  // each item so the key lands in every position equally often, and no student
  // can score by guessing a letter. Explanations never refer to a position.
  const target = authoredIndex % 4;
  authoredIndex += 1;
  const ordered = item.choices.filter((_, i) => i !== item.answer);
  ordered.splice(target, 0, item.choices[item.answer]);

  questions.push({
    id: `auth-${item.key}`,
    section: "reading-writing",
    number: questions.length + 1,
    domain: item.domain,
    skill: item.skill,
    difficulty: item.difficulty,
    stem: `${body}\n\n${item.stem}`,
    choices: ordered.map((text, i) => ({ label: LABELS[i], text })),
    format: "multiple-choice",
    answer: LABELS[target],
    explanation: item.explanation,
    distractorExplanation: null,
    origin: "authored",
  });
}

// Match the source bank's philosophy: fail loudly rather than ship a thin bank.
if (problems.length) {
  console.error("Templates fell short:\n  " + problems.join("\n  "));
  process.exit(1);
}

const mislabelled = questions.filter((q) => {
  const answer = q.choices.find((c) => c.label === q.answer);
  return !answer || q.choices.length !== 4;
});
if (mislabelled.length) {
  console.error(`Malformed questions: ${mislabelled.map((q) => q.id).join(", ")}`);
  process.exit(1);
}

const bank = {
  source:
    "Generated by scripts/build-generated-bank.mjs. Original items, computed from parameterised templates. No third-party content.",
  generatedAt: new Date().toISOString().slice(0, 10),
  questions,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(bank, null, 2) + "\n");

const byDomain = questions.reduce((acc, q) => {
  acc[q.domain] = (acc[q.domain] ?? 0) + 1;
  return acc;
}, {});
console.log(`Wrote ${questions.length} generated questions to ${OUT}`);
for (const [domain, count] of Object.entries(byDomain).sort()) {
  console.log(`  ${domain}: ${count}`);
}
