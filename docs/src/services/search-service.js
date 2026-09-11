export function searchContent(DATA, q) {
  q = (q || '').toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(t => t.length > 2);
  const hit = text => {
    text = String(text || '').toLowerCase();
    return text.includes(q) || terms.some(t => text.includes(t));
  };
  const out=[];
  for (const f of DATA.faq || []) if (hit(f.join(' '))) out.push({t:f[2],s:`${f[0]} • ${f[1]} — ${f[3]}`,h:f[4]});
  for (const r of DATA.resources || []) if (hit(Object.values(r).join(' '))) out.push({t:r.title,s:`Resource • ${r.product} • ${r.type}`,h:r.href});
  for (const l of DATA.academy || []) if (hit(Object.values(l).join(' '))) out.push({t:l.title,s:`EMG Academy • ${l.course}`,h:`#/academy/${l.id}`});
  for (const g of DATA.guides || []) if (hit(`${g.title} ${g.product} ${g.summary||''}`)) out.push({t:g.title,s:`Guide • ${g.product}`,h:g.route});
  const uniq=[]; const seen=new Set();
  for (const r of out) { const k=`${r.h}|${r.t}`; if (!seen.has(k)) { seen.add(k); uniq.push(r); } }
  return uniq.slice(0,15);
}
