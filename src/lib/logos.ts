// Official favicons, collected from each company's website (Firecrawl branding, 31 Oct 2026).
// scripts/fetch-logos.mjs downloads them at build time into public/logos/<id>.png; nothing is hot-linked at runtime.
// Logos are trademarks of their owners, used here for identification only.
export const LOGO_SOURCES: Record<string, string> = {
  tata: "https://www.tatasteel.com/images/favicon.ico",
  jsw: "https://www.jswsteel.in/wp-content/uploads/2025/11/jsw-favicon.png",
  sail: "https://www.sail.co.in/sites/default/files/sail_favicon_0.ico",
  jspl: "https://www.jindalsteel.in/favicon.ico",
  amns: "https://www.amns.in/assets/images/favicon.ico",
  vedanta: "https://d1rbiogke1jwo5.cloudfront.net/wp-content/uploads/2021/06/cropped-favicon-32x32.png",
  hindalco: "https://www.hindalco.com/assets/images/favicon/favicon-16x16.png",
  nalco: "https://nalcoindia.com/wp-content/uploads/2022/12/cropped-favicon-32x32.png",
  dalmia: "https://www.dalmiabharat.com/wp-content/uploads/2019/11/dbg-logo.png",
};

// Monogram fallback: initials and the company's primary brand colour (from its website).
export const MONOGRAM: Record<string, { text: string; bg: string }> = {
  tata: { text: "TS", bg: "#1d4f91" }, jsw: { text: "JSW", bg: "#0b6aa2" }, sail: { text: "SAIL", bg: "#172f6c" },
  jspl: { text: "JS", bg: "#b6521a" }, amns: { text: "AM", bg: "#b31b1b" }, vedanta: { text: "V", bg: "#0063a7" },
  hindalco: { text: "H", bg: "#0e6e9c" }, nalco: { text: "N", bg: "#9f2221" }, ultratech: { text: "UT", bg: "#b3141b" },
  shree: { text: "SC", bg: "#a4161a" }, dalmia: { text: "D", bg: "#b85c00" }, custom: { text: "?", bg: "#5c6b7a" },
};
