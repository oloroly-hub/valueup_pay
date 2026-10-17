"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { CATEGORIES, EMOJI, pad, won } from "../lib/constants";
import Stats from "./Stats";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function dateLabel(str) {
  const [y, m, d] = str.split("-").map(Number);
  return `${m}월 ${d}일 ${DAYS[new Date(y, m - 1, d).getDay()]}요일`;
}

const emptyForm = { amount: "", place: "", category: CATEGORIES[0], date: "", memo: "" };

const fromRow = (r) => ({ id: r.id, amount: r.amount, place: r.place, category: r.category, date: r.spent_on, memo: r.memo });

export default function Ledger() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [today, setToday] = useState(null);
  const [tab, setTab] = useState("list");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setToday(new Date());
    supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError("내역을 불러오지 못했어요");
        else setItems(data.map(fromRow));
      });
  }, []);

  const monthKey = today ? `${today.getFullYear()}-${pad(today.getMonth() + 1)}` : "";
  const monthTotal = items
    .filter((i) => i.date.startsWith(monthKey))
    .reduce((s, i) => s + i.amount, 0);

  const groups = useMemo(() => {
    const map = {};
    for (const i of items) (map[i.date] ||= []).push(i);
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        list: map[date],
        total: map[date].reduce((s, i) => s + i.amount, 0),
      }));
  }, [items]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function openSheet() {
    setForm({ ...emptyForm, date: toDateStr(new Date()) });
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0 || !form.place.trim() || !form.date || saving) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("expenses")
      .insert({ amount, place: form.place.trim(), category: form.category, spent_on: form.date, memo: form.memo.trim() })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError("저장하지 못했어요. 다시 시도해주세요");
      return;
    }
    setError("");
    setItems((prev) => [fromRow(data), ...prev]);
    setOpen(false);
  }

  const valid = Number(form.amount) > 0 && form.place.trim() && form.date;

  return (
    <main className="app">
      <header className="top">
        <div className="top-bar">
          <p className="title">벨류업 가계부</p>
          <button className="link small" onClick={() => supabase.auth.signOut()}>로그아웃</button>
        </div>
        <p className="label">{today ? `${today.getMonth() + 1}월에 쓴 돈` : "이번 달에 쓴 돈"}</p>
        <h1 className="total">{won(monthTotal)}</h1>
      </header>

      <nav className="tabs">
        <button className={tab === "list" ? "tab on" : "tab"} onClick={() => setTab("list")}>내역</button>
        <button className={tab === "stats" ? "tab on" : "tab"} onClick={() => setTab("stats")}>통계</button>
      </nav>

      {error && <p className="error">{error}</p>}

      {tab === "stats" ? (
        today && <Stats items={items} today={today} />
      ) : groups.length === 0 ? (
        <section className="empty">
          <p className="empty-emoji">🧾</p>
          <p>아직 쓴 내역이 없어요</p>
          <p className="sub">아래 버튼으로 첫 지출을 입력해보세요</p>
        </section>
      ) : (
        groups.map((g) => (
          <section className="card" key={g.date}>
            <div className="group-head">
              <span>{dateLabel(g.date)}</span>
              <span>{won(g.total)}</span>
            </div>
            {g.list.map((i) => (
              <div className="row" key={i.id}>
                <span className="icon">{EMOJI[i.category]}</span>
                <div className="info">
                  <p className="place">{i.place}</p>
                  <p className="meta">
                    {i.category}
                    {i.memo ? ` · ${i.memo}` : ""}
                  </p>
                </div>
                <span className="amount">-{won(i.amount)}</span>
              </div>
            ))}
          </section>
        ))
      )}

      <div className="cta-bar">
        <button className="btn" onClick={openSheet}>
          지출 입력하기
        </button>
      </div>

      {open && (
        <div className="dim" onClick={() => setOpen(false)}>
          <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h2>얼마를 쓰셨나요?</h2>

            <label>
              금액
              <input type="number" inputMode="numeric" min="1" placeholder="0" value={form.amount} onChange={set("amount")} autoFocus />
            </label>
            <label>
              사용처
              <input type="text" placeholder="예) 스타벅스" value={form.place} onChange={set("place")} />
            </label>

            <div className="field">
              카테고리
              <div className="chips">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={c === form.category ? "chip on" : "chip"}
                    onClick={() => setForm((f) => ({ ...f, category: c }))}
                  >
                    {EMOJI[c]} {c}
                  </button>
                ))}
              </div>
            </div>

            <label>
              날짜
              <input type="date" value={form.date} onChange={set("date")} />
            </label>
            <label>
              메모
              <input type="text" placeholder="선택 사항" value={form.memo} onChange={set("memo")} />
            </label>

            <button className="btn" type="submit" disabled={!valid || saving}>
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
