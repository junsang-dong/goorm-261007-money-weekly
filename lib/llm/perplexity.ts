export async function askPerplexity(prompt: string): Promise<{ text: string; citations: string[] }> {
  const key = process.env.PERPLEXITY_API_KEY?.trim();
  if (!key) throw new Error("PERPLEXITY_API_KEY가 없습니다.");
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.PERPLEXITY_MODEL?.trim() || "sonar-pro",
      temperature: 0.1,
      messages: [
        { role: "system", content: "요청된 JSON만 출력한다. 추측하지 않는다." },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    citations?: string[];
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(body.error?.message || `Perplexity 호출 실패 (${response.status})`);
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Perplexity 응답이 비어 있습니다.");
  return { text, citations: body.citations ?? [] };
}
