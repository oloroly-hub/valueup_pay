const MODEL = "gemini-3.5-flash-lite";

const schema = {
  type: "OBJECT",
  properties: {
    amount: { type: "INTEGER", nullable: true },
    date: { type: "STRING", nullable: true },
    place: { type: "STRING", nullable: true },
  },
  required: ["amount", "date", "place"],
};

function buildPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `이 사진은 영수증이야. 아래 세 가지를 읽어서 JSON으로만 답해.
- amount: 손님이 최종적으로 결제한 합계 금액(원, 정수). 부가세·공급가액·할인 전 금액·받은 돈·거스름돈이 아니라 "결제금액/합계/승인금액"에 해당하는 최종 금액이야.
- date: 결제 날짜. YYYY-MM-DD 형식. 연도가 보이지 않으면 오늘(${today}) 기준으로 추정하지 말고 null.
- place: 상호명(가게 이름).
사진에서 확실하게 읽히지 않는 항목은 추측하지 말고 null로 둬.`;
}

export async function POST(request) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return Response.json({ error: "서버에 Gemini API 키가 설정되지 않았어요" }, { status: 500 });

  let image, mimeType;
  try {
    ({ image, mimeType } = await request.json());
  } catch {
    return Response.json({ error: "요청을 읽지 못했어요" }, { status: 400 });
  }
  if (!image || !/^image\/(jpeg|png|webp)$/.test(mimeType || "")) {
    return Response.json({ error: "지원하지 않는 사진이에요" }, { status: 400 });
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt() }, { inline_data: { mime_type: mimeType, data: image } }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: schema },
    }),
  });

  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text());
    return Response.json({ error: "영수증을 분석하지 못했어요" }, { status: 502 });
  }

  let parsed = {};
  try {
    const data = await res.json();
    parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
  } catch {
    // 응답을 해석하지 못하면 모든 항목을 못 읽은 것으로 처리
  }

  const amount = Number.isInteger(parsed.amount) && parsed.amount > 0 ? parsed.amount : null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(parsed.date ?? "") && !Number.isNaN(Date.parse(parsed.date)) ? parsed.date : null;
  const place = typeof parsed.place === "string" && parsed.place.trim() ? parsed.place.trim() : null;

  return Response.json({ amount, date, place });
}
