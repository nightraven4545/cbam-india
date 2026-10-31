"use client";

import { useState } from "react";
import { ChartColumn, Table2 } from "lucide-react";

export interface TableData { columns: string[]; rows: (string | number)[][] }

// A numbered exhibit: action title, chart, source line and an accessible table view.
export function Exhibit({ n, title, subtitle, source, table, children, controls }: {
  n?: number; title: string; subtitle?: string; source?: React.ReactNode; table?: TableData; children: React.ReactNode; controls?: React.ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure id={n !== undefined ? `exhibit-${n}` : undefined} className="min-w-0 scroll-mt-20 rounded-xl border border-line bg-surface p-4 sm:p-6 shadow-[0_1px_2px_rgb(11_31_54/0.04)]">
      <figcaption className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[70ch]">
          {n !== undefined && <p className="mb-2"><a href={`#exhibit-${n}`} className="inline-flex items-center rounded-md bg-masthead px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-on-dark hover:bg-masthead-3">Exhibit {n}</a></p>}
          <h3 className="font-cond text-lg sm:text-xl font-semibold leading-snug">{title}</h3>
          {subtitle && <p className="text-sm text-ink-2 mt-1">{subtitle}</p>}
        </div>
        {table && (
          <button type="button" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} className="chip">
            {asTable ? <ChartColumn aria-hidden size={13} /> : <Table2 aria-hidden size={13} />}{asTable ? "Show chart" : "Show table"}
          </button>
        )}
      </figcaption>
      {controls && <div className="mt-4">{controls}</div>}
      <div className="mt-4">
        {asTable && table ? (
          <div tabIndex={0} className="overflow-x-auto">
            <table className="dtable">
              <thead><tr>{table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((x, j) => <td key={j} className={typeof x === "number" ? "num" : ""}>{typeof x === "number" ? x.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : x}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : children}
      </div>
      {source && <p className="text-xs text-ink-3 mt-4 leading-relaxed">Source: {source}</p>}
    </figure>
  );
}
