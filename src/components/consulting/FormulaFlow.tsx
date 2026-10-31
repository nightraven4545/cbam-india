// The CBAM cost bridge as a left-to-right flow of boxes (server-safe, no JS).
const STEPS = [
  { k: "Embedded emissions E", v: "Verified actual, or India default × (1 + mark-up)", c: "border-ink" },
  { k: "− Free allocation", v: "CBAM factor F_t × benchmark B of the route", c: "border-neutral" },
  { k: "= Certificates per tonne", v: "max(0, E − F_t × B)", c: "border-ink" },
  { k: "× Certificate price P", v: "EU ETS auction average; weekly from 2027", c: "border-s2" },
  { k: "− Article 9 credit", v: "Carbon price effectively paid in India", c: "border-s1" },
  { k: "× Pass-through", v: "Share the Indian exporter absorbs in price", c: "border-s3" },
];
export default function FormulaFlow() {
  return (
    <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {STEPS.map((s, i) => (
        <li key={s.k} className={`relative rounded-lg border border-line border-t-4 ${s.c} bg-surface p-3`}>
          <p className="text-xs text-ink-3">Step {i + 1}</p>
          <p className="font-semibold leading-snug mt-0.5">{s.k}</p>
          <p className="text-sm text-ink-2 mt-1">{s.v}</p>
        </li>
      ))}
    </ol>
  );
}
