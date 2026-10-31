import type { Metadata } from "next";
import { PageHeader } from "@/components/consulting/core";
import { SOURCES } from "@/lib/sources";
import { PRODUCERS } from "@/lib/data";

export const metadata: Metadata = { title: "Sources", description: "Every source behind the CBAM India model, with confidence grades and law-vs-proposal status." };

const GRADE: Record<string, string> = { A: "Verified installation data", B: "Regulation or official price", C: "Company disclosure or official statistic", D: "Analyst estimate or third-party study", E: "EU default value" };

export default function Sources() {
  const grades = ["B", "C", "D"] as const;
  return (
    <div>
      <PageHeader title="Where every number comes from" lede="All sources behind the model, graded for confidence, with what each one is used for. Law in force is marked separately from proposals." />
      {grades.map((g) => (
        <section key={g} className="mb-10" aria-labelledby={`g${g}`}>
          <h2 id={`g${g}`} className="font-cond text-xl font-semibold mb-3">Grade {g}: {GRADE[g]}</h2>
          <div className="overflow-x-auto rounded-[10px] border border-line bg-surface">
            <table className="dtable min-w-[720px]">
              <thead><tr><th className="pl-4">Source</th><th>Publisher</th><th>Used for</th><th>Status</th><th>Accessed</th></tr></thead>
              <tbody>
                {SOURCES.filter((s) => s.grade === g).map((s) => (
                  <tr key={s.id}>
                    <td className="pl-4"><a href={s.url} className="text-s1 underline underline-offset-2" target="_blank" rel="noreferrer">{s.title}</a></td>
                    <td className="text-ink-2">{s.publisher}</td>
                    <td className="text-ink-2">{s.usedFor}</td>
                    <td>{s.status ? <span className={`text-[11px] rounded-md border px-1.5 ${s.status === "law" ? "border-s1 text-s1" : "border-s2 text-s2"}`}>{s.status === "law" ? "Law" : "Proposal"}</span> : "–"}</td>
                    <td className="text-ink-3 whitespace-nowrap">{s.accessed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <section aria-labelledby="inputs">
        <h2 id="inputs" className="font-cond text-xl font-semibold mb-3">Producer inputs and their grades</h2>
        <div className="overflow-x-auto rounded-[10px] border border-line bg-surface">
          <table className="dtable min-w-[900px]">
            <thead><tr><th className="pl-4">Producer</th><th>Output</th><th>EU volume</th><th>Direct intensity</th><th>EBITDA €/t</th></tr></thead>
            <tbody>
              {PRODUCERS.map((p) => (
                <tr key={p.id}>
                  <td className="pl-4 font-medium">{p.name}</td>
                  {(["production", "euVolume", "actualDirect", "ebitdaEUR"] as const).map((k) => (
                    <td key={k}><span className="tabular-nums">{p[k].value}</span> <span className="text-[10px] border border-line rounded px-1 text-ink-3">{p[k].confidence}</span><br /><span className="text-xs text-ink-3">{p[k].source}</span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
