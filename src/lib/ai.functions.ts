import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const requestSchema = z.object({
  description: z.string().min(20),
  site: z.string().min(1),
  activity: z.string().min(1),
  reportType: z.string().min(1),
});

const analysisSchema = z.object({
  sif_potential: z.boolean(),
  sif_level: z.enum(["High", "Medium", "Low"]),
  life_saving_rule: z.string().min(1),
  activity: z.string().min(1),
  location: z.string().min(1),
  hazard: z.string().min(1),
  barrier_failure: z.string().min(1),
  potential_consequence: z.string().min(1),
  evidence: z.array(z.string()).max(5),
  explanation: z.string().min(1),
  recommended_focus: z.string().min(1),
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
  const prompt = `You are an HSE classification assistant for Oil India Limited. Assess this safety report for credible Serious Injury or Fatality potential. Return JSON only with exactly these keys: sif_potential (boolean), sif_level (High|Medium|Low), life_saving_rule, activity, location, hazard, barrier_failure, potential_consequence, evidence (array of concise report-supported phrases), explanation, recommended_focus. Use Unknown when the report does not support a field. Do not reveal hidden reasoning or invent facts. Consider energy isolation, hot work, confined space, line of fire, working at height, lifting, driving, and permit controls. ${correction}

Metadata: site=${input.site}; activity=${input.activity}; type=${input.reportType}
Report: ${input.description}`;
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "openai/gpt-5-mini", input: prompt, stream: false }),
  });
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
        return await requestAssessment(data, "Your first response was invalid. Correct the JSON schema and return only valid JSON.");
      }
      throw error;
    }
  });
