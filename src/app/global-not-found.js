import Link from 'next/link';
import CrawlerArtwork from '@/components/CrawlerArtwork';
import './not-found.css';

export const metadata = {
  title: '404 — Até o crawler se perdeu | Gabriel Greco',
  description: 'Essa página não existe. O Tamagotchi te mostra o caminho de volta.',
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return <html lang="pt-BR"><body className="lost-page">
    <header className="lost-header"><Link href="/pt" aria-label="Gabriel Greco — início"><span className="lost-monogram">G</span><span>GABRIEL GRECO<small>ENGENHEIRO DE DADOS</small></span></Link><span className="lost-status">ROTA NÃO ENCONTRADA</span></header>
    <main className="lost-main">
      <div className="lost-scene" aria-hidden="true"><span className="lost-four">4</span><div className="lost-zero"><span className="lost-speech">Procurei até no cache.</span><CrawlerArtwork/><span className="lost-ground"/></div><span className="lost-four">4</span></div>
      <div className="lost-copy"><span className="lost-label">ERRO 404</span><h1>Nem eu achei<br/>essa página.</h1><p>O link se perdeu. Você não precisa.<br/>Vamos voltar para onde as coisas funcionam.</p><Link className="lost-home" href="/pt">Voltar para o site <span aria-hidden="true">↗</span></Link><Link className="lost-skills" href="/pt#skills">Ou descobrir as skills <span aria-hidden="true">→</span></Link></div>
    </main>
    <footer className="lost-footer"><span>UM DESVIO. NÃO O FIM DO CAMINHO.</span><Link href="/" lang="en">Home in English ↗</Link></footer>
  </body></html>;
}
