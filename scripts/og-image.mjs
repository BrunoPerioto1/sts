// Gera public/og-image.png (1200x630), a prévia que aparece quando o link do
// site é compartilhado (WhatsApp, Telegram, X). Rodar: npm run og:image
//
// - Cores: lidas do bloco --brand-* do src/index.css, a mesma fonte do site.
// - Ícone: o public/favicon.svg, sem cópia do desenho aqui.
// - Fontes: Archivo (títulos, na largura semi-expandida, a mais perto dos 115%
//   da landing) e Inter, baixadas do Google Fonts na primeira vez e guardadas
//   em node_modules/.cache/og-image-fonts.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const W = 1200;
const H = 630;
const PAD = 80;

const HEADLINE = ["Mande o print.", "A gente faz a planilha."];
const SUBTITLE = "Registre apostas pelo Telegram em segundos.";

/** `--brand-primary: 37 99 235;` → { primary: "rgb(37 99 235)" } */
async function brandColors() {
  const css = await readFile(root("src/index.css"), "utf8");
  const colors = Object.fromEntries([...css.matchAll(/--brand-([\w-]+):\s*(\d+ \d+ \d+);/g)].map(([, name, rgb]) => [name, `rgb(${rgb.replaceAll(" ", ",")})`]));
  for (const name of ["primary", "background", "muted"]) {
    if (!colors[name]) throw new Error(`--brand-${name} não encontrado no src/index.css`);
  }
  return colors;
}

/** Baixa (ou reaproveita do cache) as TTFs de uma família do Google Fonts. */
async function googleFonts(family, axes) {
  const dir = root("node_modules/.cache/og-image-fonts");
  await mkdir(dir, { recursive: true });
  // User-Agent antigo: o Google responde com TTF, que o resvg lê (woff2 não).
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${family}:${axes}`, { headers: { "User-Agent": "Mozilla/4.0" } });
  if (!res.ok) throw new Error(`Google Fonts respondeu ${res.status} pra ${family}`);
  const urls = [...(await res.text()).matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
  if (!urls.length) throw new Error(`Nenhuma TTF de ${family} na resposta do Google Fonts`);
  return Promise.all(
    urls.map(async (url) => {
      const file = `${dir}/${url.split("/").slice(-3).join("-")}`;
      if (!existsSync(file)) await writeFile(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
      return file;
    }),
  );
}

/** O favicon.svg reposicionado como <svg> aninhado. */
async function icon(x, y, size) {
  const svg = await readFile(root("public/favicon.svg"), "utf8");
  return svg.replace(/<svg[^>]*>/, `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 96 96">`);
}

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function main() {
  const c = await brandColors();
  const fonts = [...(await googleFonts("Archivo", "wdth,wght@112.5,700;112.5,800")), ...(await googleFonts("Inter", "wght@400"))];

  // Título e subtítulo presos embaixo, o logo em cima: o mesmo peso visual do topo da landing.
  const subtitleY = H - PAD;
  const headlineSize = 82;
  const headlineLeading = 86;
  const headline2Y = subtitleY - 66;
  const headline1Y = headline2Y - headlineLeading;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="0.92" cy="0.08" r="0.75">
      <stop offset="0" stop-color="${c.primary}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${c.primary}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="#fff" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
    <radialGradient id="fade" cx="0.75" cy="0.3" r="0.65">
      <stop offset="0.1" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </radialGradient>
    <mask id="grid-mask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
  </defs>
  <rect width="${W}" height="${H}" fill="${c.background}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#grid-mask)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  ${await icon(PAD, PAD - 8, 64)}
  <text x="${PAD + 64 + 18}" y="${PAD + 40}" font-family="Archivo SemiExpanded" font-weight="800" font-size="44" letter-spacing="-1.1" fill="#fff">Trackton</text>

  <text font-family="Archivo SemiExpanded" font-weight="700" font-size="${headlineSize}" letter-spacing="${-0.025 * headlineSize}" fill="#fff">
    <tspan x="${PAD - 3}" y="${headline1Y}">${escape(HEADLINE[0])}</tspan>
    <tspan x="${PAD - 3}" y="${headline2Y}">${escape(HEADLINE[1])}</tspan>
  </text>
  <text x="${PAD}" y="${subtitleY}" font-family="Inter" font-weight="400" font-size="32" fill="${c.muted}">${escape(SUBTITLE)}</text>
</svg>`;

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: "Inter" },
  })
    .render()
    .asPng();
  await writeFile(root("public/og-image.png"), png);
  console.log(`public/og-image.png: ${W}x${H}, ${(png.length / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
