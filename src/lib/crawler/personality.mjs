// Reactions describe the fragment already selected by the collection engine.
export function captureReaction(fragment, language = 'pt') {
  const pt = language === 'pt';
  if (fragment.kind === 'employment' && /zyte/i.test(fragment.record_name || fragment.label)) return pt ? 'Zyte. Aqui eu me sinto em casa.' : 'Zyte. I feel right at home.';
  if (fragment.kind === 'chapter') return pt ? 'As atividades também vêm comigo.' : 'The actual work comes along too.';
  if (fragment.kind === 'image') return pt ? 'Pixels também são dados.' : 'Pixels are data too.';
  if (fragment.kind === 'quote') return pt ? 'Aspas intactas. Palavra por palavra.' : 'Quotes intact. Word for word.';
  if (fragment.kind === 'technology_group' && /python/i.test(JSON.stringify(fragment.raw))) return pt ? 'Python? Temos muito em comum.' : 'Python? We have a lot in common.';
  return pt ? 'O original fica. A cópia vem comigo.' : 'The original stays. The copy comes with me.';
}
