export const translations = {
  pt: {
    nav: {
      links: ["experiência", "projetos", "skills", "contato"],
      hrefs: ["experience", "projects", "skills", "contact"],
    },
    hero: {
      greeting: "// gabriel greco",
      heading: "De dados brutos a decisões — eu automatizo tudo no caminho.",
      accentWords: ["decisões", "automatizo"], 
      desc: "Engenheiro de software focado em pipelines inteligentes, RAG e GraphRAG com embeddings, RPAs e integrações com LLMs — transformando dados brutos em inteligência operacional.",
      cta: "Ver projetos ↓",
      stats: [
        { n: "6+", label: "Anos de experiência" },
        { n: "1B+", label: "Requisições processadas" },
        { n: "100K", label: "Horas/mês automatizadas" },
        { n: "+1TB", label: "Dados treinados em RAG e GraphRAG" },
      ],
    },
    experience: {
      tag: "// experiência",
      title: "Onde já trabalhei",
      jobs: [
        {
          role: "Software Engineer",
          company: "Labrynth AI",
          period: "02/2026 — atual",
          tasks: [
            "Pipelines de extração em larga escala para RAG e GraphRAG",
            "Estruturação de dados regulatórios em grafos de conhecimento",
            "Backend com Django, FastAPI e integração com LLMs",
          ],
        },
        {
          role: "Software Engineer",
          company: "Zyte",
          period: "02/2025 — 02/2026",
          tasks: [
            "Pipelines de dados orientados a IA com Scrapy",
            "Estratégias anti-bot para 200M+ de requisições",
            "Liderança de projetos com 1M+ requisições/dia",
          ],
        },
        {
          role: "Software Engineer",
          company: "Lumma Despachante",
          period: "09/2023 — 02/2025",
          tasks: [
            "Orchestrator fullstack (Express + Next.js + PostgreSQL)",
            "Redução de 1.500 horas/mês com RPAs",
            "Workflows integrados com AWS Lambda e S3",
          ],
        },
        {
          role: "System Analyst",
          company: "Grupo MOVE3",
          period: "09/2021 — 09/2023",
          tasks: [
            "Automação com Selenium e Puppeteer",
            "Dashboards de BI com NestJS e React",
            "Redução de 70% no tempo de processamento",
          ],
        },
      ],
    },
    projects: {
      tag: "// projetos",
      title: "O que eu construí",
      seeAll: "Ver tudo no GitHub →",
      viewDetails: "Ver detalhes →",
      viewProject: "Ver projeto",
      items: [
        {
          title: "UniReviews",
          desc: "Plataforma de avaliação anônima de universidades brasileiras. Alunos verificados avaliam cursos, infraestrutura e professores — gerando um ranking real e transparente.",
          tags: ["Next.js", "Node.js", "PostgreSQL", "Auth"],
          img: "/unireviews_v2.png",
          link: "https://www.unireviews.com.br/",
        },
        {
          title: "ScoreTips",
          desc: "Plataforma de cálculo de probabilidades em partidas de futebol, usando dados históricos e modelos estatísticos para gerar insights de apostas.",
          tags: ["Python", "Data Analysis", "ML", "Statistics"],
          img: "/scoretips_v3.png",
          link: "https://github.com/orgs/ScoreTips/repositories",
        },
        {
          title: "The Perfect Date",
          desc: "Aplicativo que utiliza IA para prever bons encontros baseando-se em experiências passadas, utilizando Next.js e MongoDB para uma experiência personalizada.",
          tags: ["Next.js", "MongoDB", "AI", "Predictions"],
          img: "/the_perfect_date.png",
          link: "https://www.theperfectdate.vercel.app",
        },
      ],
    },
    skills: {
      tag: "// skills",
      title: "Stack técnico",
      groups: [
        {
          title: "Automação & Scraping",
          color: "#00d4aa",
          items: ["Python", "Selenium", "Puppeteer", "Scrapy", "Zyte API", "RPAs"],
        },
        {
          title: "Backend",
          color: "#6c63ff",
          items: ["FastAPI", "Django", "NestJS", "Node.js", "Express", "PostgreSQL"],
        },
        {
          title: "IA & ML",
          color: "#a855f7",
          items: ["RAG", "GraphRAG", "LLMs", "Embeddings", "Neo4j", "ETL"],
        },
        {
          title: "Frontend",
          color: "#ff8c42",
          items: ["React", "Next.js", "TypeScript", "HTML/CSS"],
        },
        {
          title: "Cloud & Infra",
          color: "#e84855",
          items: ["AWS", "Docker", "MongoDB", "Redis", "S3", "Lambda"],
        },
      ],
    },
    contact: {
      tag: "// contato",
      title: "Bora trocar uma ideia?",
      desc: "Sempre aberto a novos desafios, colaborações e projetos ambiciosos. Me manda um e-mail ou conecta no LinkedIn.",
    },
    footer: "Feito com obsessão por detalhe.",
  },

  en: {
    nav: {
      links: ["experience", "projects", "skills", "contact"],
      hrefs: ["experience", "projects", "skills", "contact"],
    },
    hero: {
      greeting: "// gabriel greco",
      heading: "From raw data to insight — I automate everything in between.",
      accentWords: ["insight", "automate"],
      desc: "Software engineer focused on smart pipelines, RAG and GraphRAG with embeddings, RPAs, and LLM integrations — turning raw data into operational intelligence.",
      cta: "See projects ↓",
      stats: [
        { n: "6+", label: "Years of experience" },
        { n: "1B+", label: "Requests processed" },
        { n: "100K", label: "Hours/month automated" },
        { n: "+1TB", label: "Data trained in RAG & GraphRAG" },
      ],
    },
    experience: {
      tag: "// experience",
      title: "Where I've worked",
      jobs: [
        {
          role: "Software Engineer",
          company: "Labrynth AI",
          period: "02/2026 — present",
          tasks: [
            "Large-scale extraction pipelines for RAG and GraphRAG",
            "Structuring regulatory data into knowledge graphs",
            "Backend with Django, FastAPI, and LLM integration",
          ],
        },
        {
          role: "Software Engineer",
          company: "Zyte",
          period: "02/2025 — 02/2026",
          tasks: [
            "AI-driven data pipelines with Scrapy",
            "Anti-bot strategies for 200M+ requests",
            "Leading projects with 1M+ requests/day",
          ],
        },
        {
          role: "Software Engineer",
          company: "Lumma Despachante",
          period: "09/2023 — 02/2025",
          tasks: [
            "Fullstack orchestrator (Express + Next.js + PostgreSQL)",
            "Reduced 1,500 hours/month with RPAs",
            "Integrated workflows with AWS Lambda and S3",
          ],
        },
        {
          role: "System Analyst",
          company: "Grupo MOVE3",
          period: "09/2021 — 09/2023",
          tasks: [
            "Automation with Selenium and Puppeteer",
            "BI dashboards with NestJS and React",
            "70% reduction in processing time",
          ],
        },
      ],
    },
    projects: {
      tag: "// projects",
      title: "What I've built",
      seeAll: "See all on GitHub →",
      viewDetails: "View details →",
      viewProject: "View project",
      items: [
        {
          title: "UniReviews",
          desc: "Anonymous review platform for Brazilian universities. Verified students rate courses, infrastructure, and professors — creating a real and transparent ranking.",
          tags: ["Next.js", "Node.js", "PostgreSQL", "Auth"],
          img: "/unireviews_v2.png",
          link: "https://www.unireviews.com.br/",
        },
        {
          title: "ScoreTips",
          desc: "Football match probability calculator using historical data and statistical models to generate betting insights.",
          tags: ["Python", "Data Analysis", "ML", "Statistics"],
          img: "/scoretips_v3.png",
          link: "https://github.com/orgs/ScoreTips/repositories",
        },
        {
          title: "The Perfect Date",
          desc: "AI-powered application that predicts high-quality dates based on past data, leveraging Next.js and MongoDB for a tailored user experience.",
          tags: ["Next.js", "MongoDB", "AI", "Predictions"],
          img: "/the_perfect_date.png",
          link: "https://www.theperfectdate.vercel.app",
        },
      ],
    },
    skills: {
      tag: "// skills",
      title: "Tech stack",
      groups: [
        {
          title: "Automation & Scraping",
          color: "#00d4aa",
          items: ["Python", "Selenium", "Puppeteer", "Scrapy", "Zyte API", "RPAs"],
        },
        {
          title: "Backend",
          color: "#6c63ff",
          items: ["FastAPI", "Django", "NestJS", "Node.js", "Express", "PostgreSQL"],
        },
        {
          title: "AI & ML",
          color: "#a855f7",
          items: ["RAG", "GraphRAG", "LLMs", "Embeddings", "Neo4j", "ETL"],
        },
        {
          title: "Frontend",
          color: "#ff8c42",
          items: ["React", "Next.js", "TypeScript", "HTML/CSS"],
        },
        {
          title: "Cloud & Infra",
          color: "#e84855",
          items: ["AWS", "Docker", "MongoDB", "Redis", "S3", "Lambda"],
        },
      ],
    },
    contact: {
      tag: "// contact",
      title: "Let's connect?",
      desc: "Always open to new challenges, collaborations, and ambitious projects. Send me an email or connect on LinkedIn.",
    },
    footer: "Made with obsessive attention to detail.",
  },
};
