"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AuthDialog({
  initialMode,
  onClose,
  onAuthed,
}: {
  initialMode: "login" | "register";
  onClose: () => void;
  onAuthed: (name: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLogin = mode === "login";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.error ?? "操作失败");
        setBusy(false);
        return;
      }
      onAuthed(d.user?.name ?? email.split("@")[0]);
    } catch {
      setError("网络错误，请重试");
      setBusy(false);
    }
  };

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {isLogin ? "登录" : "注册"}
        </h2>
        {!isLogin && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="昵称"
            required
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          required
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码（至少 6 位）"
          required
          minLength={6}
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "提交中…" : isLogin ? "登录" : "注册并登录"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
          >
            取消
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          {isLogin ? "还没有账号？" : "已有账号？"}
          <button
            type="button"
            onClick={() => setMode(isLogin ? "register" : "login")}
            className="ml-1 font-medium text-brand-600 hover:underline"
          >
            {isLogin ? "去注册" : "去登录"}
          </button>
        </p>
      </form>
    </div>
  );

  // 用 Portal 渲染到 <body>，避免被 header 的 backdrop-filter 影响 fixed 定位
  if (!mounted) return null;
  return createPortal(dialog, document.body);
}
