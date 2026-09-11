import { CONFIG } from '../config/app-config.js';

let supabaseClient;
async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (!CONFIG.supabase.url || !CONFIG.supabase.publishableKey) throw new Error('Supabase is not configured.');
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  supabaseClient = createClient(CONFIG.supabase.url, CONFIG.supabase.publishableKey);
  return supabaseClient;
}

async function loadJson(name) {
  const r = await fetch(`data/${name}.json`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Could not load ${name}.json`);
  return r.json();
}

function legacyFaqRows(rows) {
  return rows.map(x => [x.product, x.category, x.question, x.answer, x.related_route]);
}
function legacyResources(rows) {
  return rows.map(x => ({ title:x.title, product:x.product, type:x.type, href:x.href, desc:x.description, id:x.id }));
}
function legacyAcademy(rows) {
  return rows.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x => ({
    id:x.id, course:x.course, title:x.title, duration:x.duration_label || `${Math.round((x.duration_seconds||300)/60)} min`, summary:x.summary,
    video_provider:x.video_provider, video_url:x.video_url, thumbnail_url:x.thumbnail_url
  }));
}
function legacyProducts(rows) {
  return rows.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(x => ({ id:x.id, name:x.name, img:x.image_url, desc:x.description, route:x.route }));
}

async function loadLocal() {
  const [products, faqs, resources, academy, guides] = await Promise.all(['products','faqs','resources','academy','guides'].map(loadJson));
  return { products:legacyProducts(products), faq:legacyFaqRows(faqs), resources:legacyResources(resources), academy:legacyAcademy(academy), guides };
}

async function table(sb, name, order='sort_order') {
  let q = sb.from(name).select('*').eq('status','published');
  if (order) q = q.order(order, { ascending:true });
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function loadSupabase() {
  const sb = await getSupabase();
  const [products, faqs, resources, academy, guides] = await Promise.all([
    table(sb,'products'), table(sb,'faqs'), table(sb,'resources'), table(sb,'academy_lessons'), table(sb,'guides')
  ]);
  return { products:legacyProducts(products), faq:legacyFaqRows(faqs), resources:legacyResources(resources), academy:legacyAcademy(academy), guides };
}

export const contentService = {
  async getAll() {
    if (CONFIG.contentProvider === 'supabase') {
      try { return await loadSupabase(); }
      catch (err) {
        console.error('Supabase content load failed:', err);
        if (!CONFIG.fallbackToLocal) throw err;
      }
    }
    return loadLocal();
  },
  async adminList(tableName) {
    const sb = await getSupabase();
    const { data, error } = await sb.from(tableName).select('*').order('sort_order',{ascending:true});
    if (error) throw error;
    return data || [];
  },
  async upsert(tableName, row) {
    const sb = await getSupabase();
    const { data, error } = await sb.from(tableName).upsert(row).select().single();
    if (error) throw error;
    return data;
  },
  async remove(tableName, id) {
    const sb = await getSupabase();
    const { error } = await sb.from(tableName).delete().eq('id', id);
    if (error) throw error;
  },
  getSupabase
};
