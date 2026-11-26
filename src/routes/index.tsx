import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

type PayStatus = "pending" | "paid" | "failed";
type Payment = { id: string; phone: string; amount: number; status: PayStatus; at: number };
type Status = { phone: string; amount: string } | null;
const KEY = "shop-till-payments";

const badge: Record<PayStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  paid: "bg-success/15 text-success border-success/40",
  failed: "bg-destructive/10 text-destructive border-destructive/40",
};

function Index() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Status>(null);
  const [history, setHistory] = useState<Payment[]>([]);
  const [tab, setTab] = useState<"progress" | "history" | "calc">("progress");
  const [filter, setFilter] = useState<"all" | PayStatus>("all");
  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
  }, []);
  const save = (h: Payment[]) => { setHistory(h); localStorage.setItem(KEY, JSON.stringify(h)); };
  const setStatus = (id: string, status: PayStatus) =>
    save(history.map((p) => (p.id === id ? { ...p, status } : p)));
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const digits = q.replace(/\D/g, "");
  const fromTs = from ? new Date(from + "T00:00:00").getTime() : -Infinity;
  const toTs = to ? new Date(to + "T23:59:59.999").getTime() : Infinity;
  const shown = history.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      (!digits || p.phone.replace(/\D/g, "").includes(digits)) &&
      p.at >= fromTs && p.at <= toTs,
  );
  const totals = {
    paid: history.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0),
    pending: history.filter((p) => p.status === "pending").length,
  };
  const valid = /^\+?\d{7,15}$/.test(phone.replace(/\s/g, "")) && Number(amount) > 0;

  const send = () => {
    setSending(true);
    setTimeout(() => {
      setSent({ phone, amount: Number(amount).toFixed(2) });
      const entry: Payment = { id: crypto.randomUUID(), phone, amount: Number(amount), status: "pending", at: Date.now() };
      const next = [entry, ...JSON.parse(localStorage.getItem(KEY) || "[]")];
      setHistory(next); localStorage.setItem(KEY, JSON.stringify(next));
      setPhone(""); setAmount("");
      setSending(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-4xl font-bold text-foreground">Shop Till</h1>
        <p className="mt-1 text-muted-foreground">Send a payment prompt to your client's phone.</p>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
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
          <div>
            <div role="tablist" className="mb-3 inline-flex gap-1 rounded-lg bg-muted p-1">
              {([["progress", "Progress"], ["history", "Payment history"], ["calc", "Calculator"]] as const).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
            {tab === "progress" && <Progress history={history} />}
            {tab === "calc" && <Calculator onUse={(v) => setAmount(v)} />}
            {tab === "history" && (

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Payment history</h2>
              <p className="text-sm text-muted-foreground">
                Collected <span className="font-semibold text-success">{totals.paid.toFixed(2)}</span> · {totals.pending} pending
              </p>
            </div>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(["all", "pending", "paid", "failed"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-sm capitalize ${filter === f ? "bg-card font-semibold shadow-sm" : "text-muted-foreground"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex-1 min-w-48 text-xs font-medium text-muted-foreground">Search phone
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 712345" inputMode="tel"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">From
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-md border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            <label className="text-xs font-medium text-muted-foreground">To
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-md border bg-background px-3 py-2 text-sm text-foreground" />
            </label>
            {(q || from || to) && (
              <button onClick={() => { setQ(""); setFrom(""); setTo(""); }} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">Clear</button>
            )}
          </div>
          {shown.length === 0 ? (
            <p className="mt-6 py-8 text-center text-muted-foreground">{history.length ? "No payments match your search." : "No payments yet."}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="py-2">Date</th><th>Client phone</th><th className="text-right">Amount</th><th className="pl-6">Status</th><th className="text-right">Update</th></tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 text-muted-foreground">{new Date(p.at).toLocaleString()}</td>
                      <td className="font-mono">{p.phone}</td>
                      <td className="text-right font-semibold tabular-nums">{p.amount.toFixed(2)}</td>
                      <td className="pl-6"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${badge[p.status]}`}>{p.status}</span></td>
                      <td className="text-right">
                        <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value as PayStatus)}
                          className="rounded-md border bg-background px-2 py-1 text-sm">
                          <option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>)}
          </div>
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

function Progress({ history }: { history: Payment[] }) {
  const paid = history.filter((p) => p.status === "paid");
  const collected = paid.reduce((a, p) => a + p.amount, 0);
  const pendingAmt = history.filter((p) => p.status === "pending").reduce((a, p) => a + p.amount, 0);
  const rate = history.length ? Math.round((paid.length / history.length) * 100) : 0;
  const clients = new Set(history.map((p) => p.phone.replace(/\D/g, ""))).size;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
    const end = d.getTime() + 86400000;
    const inDay = history.filter((p) => p.at >= d.getTime() && p.at < end);
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      paid: inDay.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0),
      requested: inDay.reduce((a, p) => a + p.amount, 0),
      count: inDay.length,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.requested));
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  const counts = (["paid", "pending", "failed"] as const).map((k) => ({ k, n: history.filter((p) => p.status === k).length }));
  const colors = { paid: "var(--success)", pending: "var(--warning)", failed: "var(--destructive)" };
  let acc = 0;
  const C = 2 * Math.PI * 40;

  const pts = days.map((d, i) => `${(i / 6) * 300},${100 - (d.count / maxCount) * 90}`).join(" ");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          ["Collected", collected.toFixed(2), "text-success"],
          ["Pending amount", pendingAmt.toFixed(2), "text-warning-foreground"],
          ["Success rate", `${rate}%`, "text-primary"],
          ["Clients", String(clients), "text-secondary-foreground"],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{l}</p>
            <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Last 7 days</h2>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-accent" />Requested</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-primary" />Paid</span>
          </div>
        </div>
        <div className="mt-6 flex h-48 items-end gap-3">
          {days.map((d) => (
            <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-40 w-full items-end justify-center">
                <div className="absolute bottom-0 w-full max-w-12 rounded-t-md bg-accent transition-all" style={{ height: `${(d.requested / max) * 100}%` }} />
                <div className="absolute bottom-0 w-full max-w-12 rounded-t-md bg-primary transition-all" style={{ height: `${(d.paid / max) * 100}%` }} />
                <span className="absolute -top-1 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 group-hover:opacity-100">{d.paid.toFixed(0)} / {d.requested.toFixed(0)}</span>
              </div>
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Payment status</h2>
          <div className="mt-4 flex items-center gap-6">
            <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--muted)" strokeWidth="14" />
              {counts.map(({ k, n }) => {
                const len = history.length ? (n / history.length) * C : 0;
                const el = <circle key={k} cx="50" cy="50" r="40" fill="none" stroke={colors[k]} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />;
                acc += len; return el;
              })}
            </svg>
            <ul className="space-y-2 text-sm">
              {counts.map(({ k, n }) => (
                <li key={k} className="flex items-center gap-2 capitalize">
                  <i className="h-3 w-3 rounded-full" style={{ background: colors[k] }} />{k}<span className="ml-auto pl-4 font-semibold tabular-nums">{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Prompts sent per day</h2>
          <svg viewBox="-5 0 310 110" className="mt-4 h-32 w-full overflow-visible" preserveAspectRatio="none">
            <polyline points={`0,100 ${pts} 300,100`} fill="var(--secondary)" opacity="0.5" />
            <polyline points={pts} fill="none" stroke="var(--secondary-foreground)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">{days.map((d) => <span key={d.label}>{d.label}</span>)}</div>
        </section>
      </div>
      {history.length === 0 && <p className="text-center text-sm text-muted-foreground">Send your first payment prompt to see progress here.</p>}
    </div>
  );
}
