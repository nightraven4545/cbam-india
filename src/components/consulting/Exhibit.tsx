"use client";

import { useState } from "react";

export interface TableData { columns: string[]; rows: (string | number)[][] }

// A numbered exhibit: action title, chart, source line and an accessible table view.
export function Exhibit({ n, title, subtitle, source, table, children, controls }: {
  n?: number; title: string; subtitle?: string; source?: React.ReactNode; table?: TableData; children: React.ReactNode; controls?: React.ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className="rounded-[10px] border border-line bg-surface p-4 sm:p-6">
      <figcaption className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[70ch]">
          {n !== undefined && <p className="text-xs text-ink-3 mb-1">Exhibit {n}</p>}
          <h3 className="font-cond text-lg sm:text-xl font-semibold leading-snug">{title}</h3>
          {subtitle && <p className="text-sm text-ink-2 mt-1">{subtitle}</p>}
        </div>
        {table && (
          <button type="button" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}
            className="text-xs rounded-md border border-line px-2.5 py-1 text-ink-2 hover:text-ink hover:border-ink-3">
            {asTable ? "Show chart" : "Show table"}
          </button>
        )}
      </figcaption>
      {controls && <div className="mt-4">{controls}</div>}
      <div className="mt-4">
        {asTable && table ? (
          <div className="overflow-x-auto">
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
