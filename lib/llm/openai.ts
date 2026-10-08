const DISCLOSURE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    disclosures: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          corp_name: { type: "string" },
          stock_code: { type: "string" },
          rcept_no: { type: "string" },
          in_top10: { type: "boolean" },
          type: { type: "string", enum: ["실적", "배당", "증자·감자", "지분변동", "주요계약", "기타"] },
          importance: { type: "string", enum: ["high", "medium", "low"] },
          one_line: { type: "string" },
        },
        required: ["corp_name", "stock_code", "rcept_no", "in_top10", "type", "importance", "one_line"],
      },
    },
  },
  required: ["disclosures"],
} as const;

export async function askOpenAI(system: string, user: string, schemaName?: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY가 없습니다.");
  const model = process.env.OPENAI_MODEL?.trim();
  if (!model) throw new Error("OPENAI_MODEL이 없습니다.");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: schemaName
        ? { type: "json_schema", json_schema: { name: schemaName, strict: true, schema: DISCLOSURE_SCHEMA } }
        : { type: "json_object" },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(body.error?.message || `OpenAI 호출 실패 (${response.status})`);
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI 응답이 비어 있습니다.");
  return text;
}
