import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const requestSchema = z.object({
  description: z.string().min(20),
  site: z.string().min(1),
  activity: z.string().min(1),
  reportType: z.string().min(1),
  location: z.string().optional(),
});

const analysisSchema = z.object({
  sif_potential: z.boolean(),
  sif_level: z.enum(["High", "Medium", "Low"]),
  life_saving_rule: z.string().min(1),
  activity: z.string().min(1),
  location: z.string().min(1),
  hazard: z.string().min(1),
  unsafe_act_condition: z.string().min(1),
  barrier_failure: z.string().min(1),
  potential_consequence: z.string().min(1),
  evidence: z.array(z.string()).max(6),
  explanation: z.string().min(1),
  why_flagged: z.string().min(1),
  recommended_focus: z.string().min(1),
  suggested_action: z.string().min(1),
  review_priority: z.enum(["High", "Medium", "Low"]),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

function extractJson(value: string): unknown {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? value;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The assessment returned an invalid format.");
  return JSON.parse(candidate.slice(start, end + 1));
}

function outputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as { output_text?: unknown; output?: unknown };
  if (typeof record.output_text === "string") return record.output_text;
  if (!Array.isArray(record.output)) return "";
  return record.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) return [];
      return content.flatMap((part) => {
        if (!part || typeof part !== "object") return [];
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? [text] : [];
      });
    })
    .join("\n");
}

async function requestAssessment(input: z.infer<typeof requestSchema>, correction = "") {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("The assessment service is not configured yet.");
  const prompt = `You are an HSE classification assistant for Oil India Limited. Assess this unsafe act, unsafe condition, near miss or incident report for credible Serious Injury or Fatality (SIF) precursors. SIF potential depends on credible energy and barrier exposure, not on whether an injury occurred.

Return JSON only with exactly these keys:
sif_potential (boolean), sif_level (High|Medium|Low), life_saving_rule, activity, location, hazard, unsafe_act_condition, barrier_failure, potential_consequence, evidence (array of short phrases quoted or closely paraphrased from the report), explanation, why_flagged, recommended_focus, suggested_action, review_priority (High|Medium|Low).

Rules:
- life_saving_rule must be exactly one of: Energy Isolation, Hot Work, Confined Space, Line of Fire, Working at Height, Lifting Operations, or "Not mapped" when none credibly applies.
- why_flagged must state the concrete signals detected in this report text (activity, hazard, unsafe act or condition, barrier failure, potential consequence). Never invent facts.
- suggested_action is a single practical preventive action for HSE review.
- Use "Unknown" for any field the report does not support.
- No hidden reasoning, no chain-of-thought, JSON only.
${correction}

Metadata: site=${input.site}; activity=${input.activity}; type=${input.reportType}; location=${input.location ?? "Unknown"}
Report: ${input.description}`;
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "openai/gpt-5-mini", input: prompt, stream: false }),
  });
  if (response.status === 429) throw new Error("The assessment service is busy. Try again in a moment.");
  if (response.status === 402) throw new Error("AI usage credits are exhausted for this workspace.");
  if (!response.ok) throw new Error("The assessment service could not be reached.");
  const parsed = extractJson(outputText(await response.json()));
  return analysisSchema.parse(parsed);
}

export const analyzeSafetyReport = createServerFn({ method: "POST" })
  .inputValidator((data) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      return await requestAssessment(data);
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) {
        return await requestAssessment(
          data,
          "Your first response was invalid. Correct the JSON schema and return only valid JSON with every required key.",
        );
      }
      throw error;
    }
  });
