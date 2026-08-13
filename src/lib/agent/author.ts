import Anthropic from "@anthropic-ai/sdk";
import type { Decision } from "../types";

/**
 * Rewrites a computed decision into the two sentences the student reads.
 *
 * Deliberately narrow: the model never decides the focus, never picks the
 * questions, and never grades a prediction. Those all happen in code, so the
 * ledger stays reproducible and a model that is having an off day can only
 * make the copy worse, not the coaching wrong.
 *
 * Returns null on any failure — the caller keeps the template copy.
 */
export async function authorCopy(
  decision: Pick<Decision, "focus" | "evidence" | "action" | "prediction">
): Promise<{ evidence: string; prediction: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system:
        "You write for Beacon, an SAT coaching app. You rewrite one coaching " +
        "decision into plain, warm, second-person copy for a high school student. " +
        "Never invent numbers, never change the meaning, never add advice that is " +
        "not in the input. Keep each field to one or two short sentences.",
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              evidence: { type: "string" },
              prediction: { type: "string" },
            },
            required: ["evidence", "prediction"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: [
            `Focus: ${decision.focus}`,
            `Evidence: ${decision.evidence}`,
            `Action: ${decision.action}`,
            `Prediction: ${decision.prediction}`,
            "",
            "Rewrite the evidence and the prediction. Keep every number exactly as given.",
          ].join("\n"),
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;

    const text = response.content.find((block) => block.type === "text");
    if (!text || text.type !== "text") return null;

    const parsed = JSON.parse(text.text) as {
      evidence?: unknown;
      prediction?: unknown;
    };
    if (
      typeof parsed.evidence !== "string" ||
      typeof parsed.prediction !== "string"
    ) {
      return null;
    }
    return { evidence: parsed.evidence, prediction: parsed.prediction };
  } catch {
    // Copy is a nicety. A sync must never fail because the model did.
    return null;
  }
}
