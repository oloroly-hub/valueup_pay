"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });

  const signup = mode === "signup";
  const valid = email.includes("@") && password.length >= 6;

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setMsg({ text: "", ok: false });
    const { data, error } = signup
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setMsg({
        text: signup ? "가입하지 못했어요. 이미 가입한 이메일인지 확인해주세요" : "이메일 또는 비밀번호가 맞지 않아요",
        ok: false,
      });
    } else if (signup && !data.session) {
      setMsg({ text: "확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해주세요", ok: true });
      setMode("login");
    }
  }

  return (
    <main className="app auth">
      <p className="title">벨류업 가계부</p>
      <h1 className="auth-title">{signup ? "계정을 만들어요" : "로그인해주세요"}</h1>

      <form className="auth-form" onSubmit={submit}>
        <label>
          이메일
          <input type="email" autoComplete="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            placeholder="6자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {msg.text && <p className={msg.ok ? "notice" : "error"}>{msg.text}</p>}

        <button className="btn" type="submit" disabled={!valid || busy}>
          {busy ? "잠시만요..." : signup ? "가입하기" : "로그인"}
        </button>
      </form>

      <button
        className="link"
        onClick={() => {
          setMode(signup ? "login" : "signup");
          setMsg({ text: "", ok: false });
        }}
      >
        {signup ? "이미 계정이 있어요" : "처음이에요, 계정 만들기"}
      </button>
    </main>
  );
}
