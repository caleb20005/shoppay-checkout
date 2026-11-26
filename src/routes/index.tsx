import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shop Till — Send Payment Requests" },
      { name: "description", content: "Enter a client's phone number and amount, send a payment prompt, and use the built-in calculator." },
      { property: "og:title", content: "Shop Till — Send Payment Requests" },
      { property: "og:description", content: "Send payment prompts to clients with a built-in calculator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Status = { phone: string; amount: string } | null;

function Index() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Status>(null);
  const valid = /^\+?\d{7,15}$/.test(phone.replace(/\s/g, "")) && Number(amount) > 0;

  const send = () => {
    setSending(true);
    setTimeout(() => {
      setSent({ phone, amount: Number(amount).toFixed(2) });
      setSending(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl font-bold text-foreground">Shop Till</h1>
        <p className="mt-1 text-muted-foreground">Send a payment prompt to your client's phone.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Payment request</h2>
            <label className="mt-4 block text-sm font-medium">Client phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+255 712 345 678"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-lg outline-none focus:ring-2 focus:ring-ring" />
            <label className="mt-4 block text-sm font-medium">Amount to pay</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" type="number" min="0" placeholder="0.00"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-2xl font-semibold outline-none focus:ring-2 focus:ring-ring" />
            <button disabled={!valid || sending} onClick={send}
              className="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40">
              {sending ? "Sending prompt…" : "Send payment prompt"}
            </button>
            {sent && (
              <div className="mt-6 rounded-xl border border-primary/30 bg-accent p-4">
                <p className="text-sm text-muted-foreground">Prompt sent to {sent.phone}</p>
                <p className="mt-1 text-3xl font-bold text-accent-foreground">{sent.amount}</p>
                <p className="mt-1 text-sm text-muted-foreground">Waiting for the client to confirm on their phone.</p>
              </div>
            )}
          </section>
          <Calculator onUse={(v) => setAmount(v)} />
        </div>
      </div>
    </main>
  );
}

function Calculator({ onUse }: { onUse: (v: string) => void }) {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("0");

  const evaluate = (e: string) => {
    if (!/^[\d+\-*/.() ]+$/.test(e)) return null;
    try {
      const v = Function(`"use strict";return (${e})`)() as number;
      return Number.isFinite(v) ? String(Math.round(v * 1e8) / 1e8) : null;
    } catch { return null; }
  };

  const press = (k: string) => {
    if (k === "C") { setExpr(""); setResult("0"); return; }
    if (k === "⌫") { setExpr(expr.slice(0, -1)); return; }
    if (k === "=") { const r = evaluate(expr); setResult(r ?? "Error"); if (r) setExpr(r); return; }
    setExpr(expr + k);
  };

  const keys = ["C", "⌫", "(", ")", "7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Calculator</h2>
      <div className="mt-4 rounded-lg bg-muted p-4 text-right">
        <div className="min-h-6 break-all text-sm text-muted-foreground">{expr || " "}</div>
        <div className="text-3xl font-bold">{result}</div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {keys.map((k) => (
          <button key={k} onClick={() => press(k)}
            className={`rounded-lg py-3 text-lg font-semibold transition hover:opacity-80 ${k === "=" ? "bg-primary text-primary-foreground" : /[\d.]/.test(k) ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"}`}>
            {k}
          </button>
        ))}
      </div>
      <button disabled={result === "0" || result === "Error"} onClick={() => onUse(result)}
        className="mt-3 w-full rounded-lg border py-2 text-sm font-medium hover:bg-muted disabled:opacity-40">
        Use result as amount
      </button>
    </section>
  );
}
