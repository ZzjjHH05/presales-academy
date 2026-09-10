"use client";

import { useEffect, useState } from "react";
import { setAuthed, pushAll, pullAll } from "@/lib/cloud";
import AuthDialog from "./AuthDialog";

interface Me {
  user: { name: string; email: string } | null;
}

export default function AccountBar() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<null | "login" | "register">(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: Me) => {
        setUser(d.user);
        setAuthed(!!d.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const onAuthed = async (name: string) => {
    setAuthed(true);
    setUser({ name, email: "" });
    const ok = await pullAll();
    if (ok) setMsg("已同步 ✓（换个设备登录也会带上进度）");
  };

  const sync = async () => {
    const ok = await pushAll();
    setMsg(ok ? "已推送云端 ✓" : "推送失败");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    setUser(null);
  };

  if (loading) {
    return <span className="px-2 text-xs text-slate-400">…</span>;
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setDialog("login")}
          className="rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          登录
        </button>
        <button
          onClick={() => setDialog("register")}
          className="rounded-md bg-brand-600 px-2.5 py-1.5 text-white hover:bg-brand-700"
        >
          注册
        </button>
        {dialog && (
          <AuthDialog
            key={dialog}
            initialMode={dialog}
            onClose={() => setDialog(null)}
            onAuthed={onAuthed}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[8rem] truncate text-slate-600">{user.name}</span>
      <button
        onClick={sync}
        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-brand-300 hover:text-brand-700"
      >
        同步
      </button>
      <button
        onClick={logout}
        className="rounded-md px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        退出
      </button>
      {msg && <span className="hidden text-xs text-emerald-600 lg:inline">{msg}</span>}
    </div>
  );
}
