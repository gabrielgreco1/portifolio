# SEO do portfólio

## Escopo e referência

Artigo solicitado: https://x.com/bloggersarvesh/status/2088983373859725755

O artigo é um roteiro de SEO local para Google Business Profile (GBP), não uma especificação de código de um site. As recomendações foram adaptadas ao portfólio profissional, usando apenas informações já presentes na experiência e no contato. Não foram criados endereço comercial, telefone, avaliações, clientes, áreas de atendimento ou promessas de resultado.

| Tema do artigo | Aplicação / situação |
| --- | --- |
| Contexto do negócio e consistência | Nome, domínio, e-mail, LinkedIn e localização profissional existentes preservados; link incorreto no README corrigido. |
| Categorias e atributos do GBP | Fora do repositório. Necessita perfil real, elegibilidade e categorias disponíveis. |
| Avaliações de concorrentes e respostas | Fora do repositório. Necessita URLs dos perfis e avaliações reais; nenhum depoimento ou rating foi inventado. |
| Publicações, fotos e calendário do GBP | Fora do repositório. Necessita perfil e conteúdo real; nenhuma postagem externa foi feita. |
| Descrições de serviços | Quatro descrições com entregas e benefícios, em EN/PT: web scraping, pipelines/cloud, automação e ingestão regulatória. Navegação e contato ligados à seção. |

## Alterações técnicas complementares

- `/` continua sendo a versão inglesa; `/pt` entrega português diretamente no HTML, sem depender de um clique/JavaScript para revelar a tradução.
- Cada idioma tem `html lang`, título, descrição, canonical, Open Graph e Twitter próprios, além de referências `hreflang` recíprocas e `x-default`.
- Dois layouts de raiz reutilizam `PortfolioDocument`; navegar entre idiomas carrega o documento completo para manter idioma e metadados coerentes.
- JSON-LD de `ProfilePage`, `Person`, `WebSite` e `Service` usa os mesmos textos visíveis dos serviços e a URL correta de cada idioma. Não declara `LocalBusiness` nem avaliações.
- Sitemap contém apenas as duas URLs canônicas e suas alternativas. Removido `lastModified: new Date()`, que sinalizava atualização de conteúdo a cada build sem evidência.
- `/data-engineer`, que duplicava a home com `noindex`, passa a redirecionar permanentemente (308) para `/`.
- Robots, arquivo de verificação do Search Console e imagens de compartilhamento preservados.

## Verificação

```sh
npm ci
npm run lint
npm run build
npm run start
# Em outro terminal:
npm run test:seo
# Para outra porta/origem: SEO_TEST_ORIGIN=http://localhost:3100 npm run test:seo
```

Os testes verificam o HTML real servido em produção: conteúdo sem execução de JavaScript, idioma, canonical, hreflang, metadados, JSON-LD alinhado ao texto, âncoras, sitemap, robots, redirecionamento, 404 e assets de verificação/compartilhamento. Ranking, indexação e Core Web Vitals reais exigem observação depois da publicação.

## Depois da publicação

1. Inspecionar `/` e `/pt` no Search Console e enviar `https://gabrielgreco.com/sitemap.xml`.
2. Confirmar na hospedagem a política de redirecionamento de domínios alternativos para `gabrielgreco.com`.
3. Se houver atendimento presencial elegível, fornecer URL do GBP, região efetivamente atendida e concorrentes para executar as etapas externas do artigo. Negócios exclusivamente online não são elegíveis para GBP.
4. Usar as descrições como base para os serviços reais do perfil, manter informações corretas e responder a avaliações com contexto real. Não forçar palavras-chave em avaliações nem prometer posições.

O Google descreve relevância, distância e destaque como fatores locais. O artigo contém afirmações e promessas mais fortes do que a documentação oficial sustenta; elas não foram tratadas como garantias.

Fontes oficiais:
- https://support.google.com/business/answer/7091
- https://support.google.com/business/answer/13763036
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/specialty/international/localized-versions
