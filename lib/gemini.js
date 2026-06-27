// Thin wrapper around the Google Gemini (Generative Language) REST API.
// Auth uses the x-goog-api-key header so it works for any API key format.
// Default model is gemini-2.5-flash (gemini-2.0-flash has no free-tier quota on
// some keys). Override with GEMINI_MODEL.

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function model() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

function headers() {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": process.env.GEMINI_API_KEY || ""
  };
}

// Map our {role: user|assistant, content} messages to Gemini's contents shape.
function toContents(messages = []) {
  return messages
    .filter((m) => m && m.content)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.toString() }]
    }));
}

function buildBody({ system, messages, temperature = 0.7, maxOutputTokens = 1024, json = false }) {
  return {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents: toContents(messages),
    generationConfig: {
      temperature,
      maxOutputTokens,
      // Disable "thinking" on 2.5 flash for fast, direct replies.
      thinkingConfig: { thinkingBudget: 0 },
      ...(json ? { responseMimeType: "application/json" } : {})
    }
  };
}

// Streaming generator: yields text chunks as they arrive (SSE).
export async function* geminiStream({ system, messages, temperature, maxOutputTokens, signal }) {
  const res = await fetch(`${BASE}/models/${model()}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(buildBody({ system, messages, temperature, maxOutputTokens })),
    signal
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      try {
        const obj = JSON.parse(json);
        const text = (obj?.candidates?.[0]?.content?.parts || [])
          .map((p) => p.text || "")
          .join("");
        if (text) yield text;
      } catch {
        // Ignore partial/non-JSON keepalive lines.
      }
    }
  }
}

// Non-streaming single response.
export async function geminiGenerate({ system, messages, temperature = 0.4, maxOutputTokens = 512, json = false }) {
  const res = await fetch(`${BASE}/models/${model()}:generateContent`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(buildBody({ system, messages, temperature, maxOutputTokens, json }))
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
}

const CATEGORIES = [
  "Technology",
  "Career",
  "Education",
  "Housing",
  "Finance",
  "Food",
  "Lifestyle",
  "Auto",
  "Travel",
  "Health",
  "General"
];

// Auto-classify a submitted experience so the Experience page groups it under a
// clean topic and category. Best-effort: returns null on any failure so the
// caller falls back to the user-provided values.
export async function classifyReview({ title, summary, category }) {
  if (!geminiConfigured()) return null;

  const system = `You organise Nepali community experiences for KastoChha.
Return ONLY JSON: {"category": string, "topic": string}.
- "category" MUST be exactly one of: ${CATEGORIES.join(", ")}.
- "topic" is a short canonical subject in Title Case (2-4 words) that similar experiences should group under, e.g. "iPhone 15", "Kathmandu Rent", "eSewa", "Pathao Job". Keep brand/place names; drop filler words.`;

  const user = `Title: ${title}\nUser category hint: ${category || "(none)"}\nExperience: ${(summary || "").slice(0, 800)}`;

  try {
    const out = await geminiGenerate({
      system,
      messages: [{ role: "user", content: user }],
      json: true,
      temperature: 0.1,
      maxOutputTokens: 120
    });
    const parsed = JSON.parse(out);
    const cat = CATEGORIES.find((c) => c.toLowerCase() === (parsed.category || "").toLowerCase());
    const topic = (parsed.topic || "").toString().trim().slice(0, 80);
    if (!topic) return null;
    return { category: cat || category || "General", topic };
  } catch (error) {
    console.error("classifyReview failed:", error?.message || error);
    return null;
  }
}
