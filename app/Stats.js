"use client";

import { useState } from "react";
import { CATEGORIES, EMOJI, pad, won } from "../lib/constants";

export default function Stats({ items, today }) {
  const [offset, setOffset] = useState(0);

  const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const key = `${base.getFullYear()}-${pad(base.getMonth() + 1)}`;
  const prev = new Date(base.getFullYear(), base.getMonth() - 1, 1);
  const prevKey = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;

  const sumOf = (list) => list.reduce((s, i) => s + i.amount, 0);
  const monthItems = items.filter((i) => i.date.startsWith(key));
  const total = sumOf(monthItems);
  const prevTotal = sumOf(items.filter((i) => i.date.startsWith(prevKey)));

  const rows = CATEGORIES.map((c) => {
    const list = monthItems.filter((i) => i.category === c);
    return { category: c, count: list.length, amount: sumOf(list) };
  })
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const diff = total - prevTotal;
  const compare =
    prevTotal === 0
      ? "지난달 내역이 없어요"
      : diff === 0
        ? "지난달과 같아요"
        : `지난달보다 ${won(Math.abs(diff))} ${diff > 0 ? "더" : "덜"} 썼어요`;

  return (
    <section className="stats">
      <div className="month-nav">
        <button aria-label="이전 달" onClick={() => setOffset((o) => o - 1)}>‹</button>
        <span>{base.getFullYear()}년 {base.getMonth() + 1}월</span>
        <button aria-label="다음 달" disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)}>›</button>
      </div>

      <div className="card stats-summary">
        <p className="label">총 지출</p>
        <p className="stats-total">{won(total)}</p>
        <p className="compare">{compare}</p>
      </div>

      {rows.length === 0 ? (
        <p className="empty sub">이 달에는 지출 내역이 없어요</p>
      ) : (
        <div className="card">
          <p className="group-head">카테고리별 지출</p>
          {rows.map((r) => {
            const pct = Math.round((r.amount / total) * 100);
            return (
              <div className="stat-row" key={r.category}>
                <div className="stat-line">
                  <span>{EMOJI[r.category]} {r.category} <em>{r.count}건</em></span>
                  <strong>{won(r.amount)}</strong>
                </div>
                <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                <span className="pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
