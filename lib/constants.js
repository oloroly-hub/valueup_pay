export const CATEGORIES = ["식비", "카페", "교통", "쇼핑", "구독", "기타"];
export const EMOJI = { 식비: "🍚", 카페: "☕", 교통: "🚌", 쇼핑: "🛍️", 구독: "📺", 기타: "📦" };

export const pad = (n) => String(n).padStart(2, "0");
export const won = (n) => `${n.toLocaleString("ko-KR")}원`;
