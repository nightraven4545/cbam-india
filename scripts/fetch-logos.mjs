// Build-time logo fetch (runs on Vercel, which has internet access). Never fails the build.
import { mkdir, writeFile, readFile, access } from "node:fs/promises";

const src = await readFile(new URL("../src/lib/logos.ts", import.meta.url), "utf8");
const entries = [...src.matchAll(/^\s{2}(\w+): "(https:[^"]+)"/gm)].map((m) => [m[1], m[2]]);
await mkdir(new URL("../public/logos/", import.meta.url), { recursive: true });
let ok = 0;
await Promise.all(entries.map(async ([id, url]) => {
  const out = new URL(`../public/logos/${id}.png`, import.meta.url);
  try { await access(out); ok++; return; } catch {}
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { "user-agent": "Mozilla/5.0 cbam-india-build" } });
    if (!res.ok) throw new Error(String(res.status));
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error("too small");
    await writeFile(out, buf); ok++;
  } catch (e) { console.warn(`[logos] ${id}: skipped (${e.message}); monogram will be used`); }
}));
console.log(`[logos] ${ok}/${entries.length} logos available`);
