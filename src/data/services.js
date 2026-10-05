// Shared by the visible content and JSON-LD so descriptions stay consistent.
export const serviceContent = {
  en: {
    tag: "04 / services",
    title: "Data engineering, from source to product.",
    intro: "Based in São Paulo, with experience working remotely with teams in Brazil, the United States and Ireland. These are the problems I work on.",
    evidence: "See the production experience", cta: "Discuss a data project",
    items: [
      { id: "web-scraping", title: "Web scraping and data extraction", description: "I build and operate Python, Scrapy and Zyte API crawlers for websites, APIs and documents. Validation, monitoring and delivery pipelines turn unstable sources into data teams can use." },
      { id: "data-pipelines", title: "Data pipelines and cloud platforms", description: "I develop ingestion and transformation pipelines with Prefect, AWS, S3 and PostgreSQL, with infrastructure managed through Terraform. Traceable bronze, silver and gold layers make datasets reproducible and easier to maintain." },
      { id: "automation", title: "Process automation and integrations", description: "I automate repetitive workflows and connect systems using Python, APIs and RPA. The focus is reducing manual work while keeping failures, validation and operational handoffs visible." },
      { id: "regulatory-data", title: "Document ingestion and regulatory intelligence", description: "I structure regulatory documents for knowledge graphs, GraphRAG and analytical data products. Provenance and quality checks help teams trace answers and indicators back to their sources." },
    ],
  },
  pt: {
    tag: "04 / serviços",
    title: "Engenharia de dados, da fonte ao produto.",
    intro: "Baseado em São Paulo, com experiência trabalhando remotamente com equipes no Brasil, nos Estados Unidos e na Irlanda. Estes são os problemas com que trabalho.",
    evidence: "Veja a experiência em produção", cta: "Conversar sobre um projeto de dados",
    items: [
      { id: "web-scraping", title: "Web scraping e extração de dados", description: "Construo e opero crawlers em Python, Scrapy e Zyte API para sites, APIs e documentos. Validação, monitoramento e pipelines de entrega transformam fontes instáveis em dados que as equipes conseguem usar." },
      { id: "data-pipelines", title: "Pipelines de dados e plataformas cloud", description: "Desenvolvo pipelines de ingestão e transformação com Prefect, AWS, S3 e PostgreSQL, com infraestrutura gerenciada por Terraform. Camadas bronze, silver e gold rastreáveis tornam os conjuntos de dados reproduzíveis e mais fáceis de manter." },
      { id: "automation", title: "Automação de processos e integrações", description: "Automatizo fluxos repetitivos e conecto sistemas usando Python, APIs e RPA. O foco é reduzir trabalho manual mantendo falhas, validação e transições operacionais visíveis." },
      { id: "regulatory-data", title: "Ingestão de documentos e inteligência regulatória", description: "Estruturo documentos regulatórios para grafos de conhecimento, GraphRAG e produtos analíticos de dados. Proveniência e verificações de qualidade ajudam equipes a rastrear respostas e indicadores até suas fontes." },
    ],
  },
};
