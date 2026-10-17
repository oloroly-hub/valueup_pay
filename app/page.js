"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Auth from "./Auth";
import Ledger from "./Ledger";

export default function Home() {
  // undefined: 확인 중, null: 로그아웃 상태
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (session === null) return <Auth />;
  return <Ledger key={session.user.id} />;
}
