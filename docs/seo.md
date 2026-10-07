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

## Revisão das orientações de IA — 6 de outubro de 2026

### Atualizações oficiais consultadas

- Em **1º de outubro de 2026**, o Google atualizou a orientação sobre conteúdo com IA, reforçando revisão factual humana antes da publicação, inclusive de títulos, descrições, dados estruturados e texto alternativo. O changelog apresenta isso como alinhamento da documentação, não como anúncio de uma penalidade automática para sites feitos com IA: https://developers.google.com/search/updates e https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- O guia para recursos generativos, publicado em **15 de maio de 2026** e atualizado em **10 de julho**, mantém SEO tradicional como fundamento e destaca conteúdo de experiência própria: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Conteúdo útil deve ter autoria clara, sem credenciais ou perfis fictícios: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- As políticas de spam incluem produção em escala sem valor e tentativas de manipular respostas generativas: https://developers.google.com/search/docs/essentials/spam-policies

### Auditoria e ações

| Ponto | Constatação / ação |
| --- | --- |
| Originalidade e experiência | Há relatos de trabalho em empresas e projetos concretos. Cada serviço agora leva à experiência específica correspondente, em ambos os idiomas. Esses links dão contexto; não são comprovação independente. |
| Números sem contexto | Os quatro destaques agora identificam a empresa/projeto e levam ao relato relacionado. Valores existentes foram preservados, sem acrescentar resultados ou atribuir verificação externa. |
| Autoria e transparência | Nome, contato e perfis profissionais permanecem visíveis; `ProfilePage.author` aponta para a mesma pessoa apresentada na página. Mantida a indicação de uso de IA. |
| Conteúdo e markup divergentes | Descrições de serviços continuam saindo da mesma fonte de dados para HTML e JSON-LD, com teste de igualdade. Não foram adicionadas avaliações ou credenciais. |
| Páginas em massa, doorway e keywords | Não encontrados nas rotas publicadas examinadas. EN/PT são traduções úteis, não páginas por cidade ou variações artificiais de busca. |
| Elegibilidade técnica | Conteúdo entregue no HTML, rotas canônicas, sitemap, robots, 404 e redirecionamento cobertos pelos testes. Verificações também impedem restrições de snippets nas páginas de perfil. |
| Supostos atalhos de IA | Não adicionar `llms.txt`, schema especial, menções artificiais, texto escondido ou FAQ apenas para ranking. O guia diz que Google Search não usa arquivos especiais desse tipo. |
| Experiência da página | Links de contexto preservam a estrutura existente. Core Web Vitals de usuários reais e eventual impacto do mascote flutuante precisam ser avaliados como UX, sem inferir penalidade por IA. |

### Limites da checagem factual

As descrições novas foram comparadas com os relatos já existentes no repositório. Isso verifica consistência interna, não a veracidade independente do histórico profissional. Antes de publicar, o proprietário deve validar nos seus registros as afirmações de **30B+ requisições/ano (Zyte), 2B+ requisições (RTI), 300M+ pontos estruturados (RTI), aproximadamente 4.500 horas/mês (Lumma)**, bem como os demais percentuais, cargos e datas do histórico. Não foi acrescentado selo de revisão humana ou de verificação externa.

Não há dados de Search Console nesta auditoria: não foi diagnosticada perda de alcance, ação manual nem penalidade. Após publicar, comparar períodos equivalentes por página, consulta e país; conferir indexação, ações manuais e inclusão nos recursos generativos. O relatório de desempenho generativo mede presença nesses recursos: https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports

As alterações melhoram contexto e consistência; não garantem recuperação de tráfego ou participação em AI Overviews/AI Mode.

## Google Analytics

Tag solicitada: `G-DJ7RMKV2HR`. O componente compartilhado `GoogleAnalytics` usa `next/script` com `afterInteractive`, estratégia indicada para analytics, carregando a biblioteca assincronamente sem bloquear a renderização. É montado uma única vez por documento, nas versões `/` e `/pt`. A troca de idioma carrega outro documento; não foi acrescentado um segundo envio manual de `page_view`. Vercel Analytics existente foi preservado.

O recebimento no painel Tempo real do GA4 deve ser confirmado após publicação. Não foi instalado Google Tag Manager nem configurada personalização de anúncios/CMP; o aviso de consentimento colado pelo usuário não fornece uma preferência de consentimento ou uma integração de CMP existente.
