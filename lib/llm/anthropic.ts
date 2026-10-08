export async function askClaude(system: string, user: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new Error("ANTHROPIC_API_KEY가 없습니다.");
  const model = process.env.ANTHROPIC_MODEL?.trim();
  if (!model) throw new Error("ANTHROPIC_MODEL이 없습니다.");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const body = (await response.json()) as {
    content?: { type?: string; text?: string }[];
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(body.error?.message || `Claude 호출 실패 (${response.status})`);
  const text = body.content
    ?.filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Claude 응답이 비어 있습니다.");
  return text;
}
