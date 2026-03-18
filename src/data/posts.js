// ── Design Teardown Posts ─────────────────────────────────────────────────────
// To add a new card: push a new object to this array. That's it.
//
// Fields:
//   id          – unique number
//   category    – mono label shown at top (e.g. "design teardown")
//   title       – card heading
//   desc        – one-line teaser (shown always)
//   insight     – deeper takeaway (revealed on hover)
//   href        – link for "Ver análise" / "Read analysis" button
//   cta         – button label (optional, defaults to "Ver análise")
//   variant     – "calm" | "pulse" | "float"  → drives micro-animation + reveal speed
//   accentColor – hex used for the card glow (without alpha, e.g. "#6c63ff")

export const POSTS = [
  {
    id: 1,
    category: "design teardown",
    title: "Como a Echelon usa gradientes para vender estabilidade",
    desc: "Paleta fria + gradientes lentos = percepção de solidez antes de ler uma palavra. Por quê isso funciona.",
    insight:
      "O scroll não acelera nada. Tudo desacelera. Quando o produto quer ser percebido como sólido, o motion precisa ser estável. Cada transição é deliberadamente lenta.",
    href: "https://echelon.framer.ai/",
    cta: "Ver site",
    variant: "calm",
    accentColor: "#6c63ff",
  },
  {
    id: 2,
    category: "motion study",
    title: "Profundidade 3D sem framework — só CSS + mouse-follow",
    desc: "Como criar ilusão de espaço com 3 camadas em velocidades diferentes. O que parece complexo são 40 linhas de CSS.",
    insight:
      "A tridimensionalidade não vem de Three.js. Vem de parallax em 3 velocidades. O olho lê diferença de velocidade como espaço real — e isso custa zero em performance.",
    href: "#",
    cta: "Ler análise",
    variant: "float",
    accentColor: "#00d4aa",
  },
  {
    id: 3,
    category: "percepção de valor",
    title: "Por que o cliente aprova em 3 segundos",
    desc: "O que acontece na primeira tela de uma landing de alto valor: hierarquia, cor, espaço — e o que realmente comunica \"caro\".",
    insight:
      "\"Caro\" não é luxo visual. É intenção comunicada. Cada elemento justificado aumenta o valor percebido. Espaço em branco não é vazio — é confiança.",
    href: "#",
    cta: "Ler análise",
    variant: "pulse",
    accentColor: "#a855f7",
  },
];
