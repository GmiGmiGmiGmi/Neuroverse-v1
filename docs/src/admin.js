import { CONFIG } from './config/app-config.js';
import { authService } from './services/auth-service.js';
import { contentService } from './services/content-service.js';

const root=document.getElementById('adminApp');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TABLES={
  faqs:{label:'FAQs',fields:['id','product','category','question','answer','related_route','status','sort_order']},
  academy_lessons:{label:'Academy',fields:['id','course','lesson_number','title','duration_label','summary','video_provider','video_url','thumbnail_url','status','sort_order']},
  resources:{label:'Resources',fields:['id','title','product','type','href','description','status','sort_order']},
  guides:{label:'Guides',fields:['id','route','product','title','kind','summary','status','sort_order']}
};
let current='faqs', profile=null;

function loginView(message=''){
  root.innerHTML=`<div class="admin-login card"><h1>Neuroverse Admin</h1><p>Sign in with an authorised staff account.</p>${message?`<div class="notice">${esc(message)}</div>`:''}<div class="field"><label>Email</label><input id="email" type="email"></div><div class="field"><label>Password</label><input id="password" type="password"></div><button id="loginBtn" class="btn primary">Sign in</button></div>`;
  document.getElementById('loginBtn').onclick=async()=>{try{await authService.signIn(email.value,password.value);await boot();}catch(e){loginView(e.message)}};
}
function localView(){root.innerHTML=`<div class="card"><h1>Admin backend is ready but not connected</h1><p>This package is intentionally running in <strong>local content mode</strong>, so the public website works from GitHub immediately.</p><div class="notice">When you create Supabase, switch the runtime configuration to <code>contentProvider: 'supabase'</code> and <code>authProvider: 'supabase'</code>. The same admin page will then use Supabase Auth and the database tables included in <code>/supabase/schema.sql</code>.</div><p><a class="btn primary" href="index.html#/">Open website</a></p></div>`}
function sidebar(){return `<aside class="card admin-sidebar"><strong>Content Manager</strong>${Object.entries(TABLES).map(([k,v])=>`<button class="btn ${k===current?'primary':'ghost'}" data-table="${k}">${v.label}</button>`).join('')}<hr><button id="signOut" class="btn secondary">Sign out</button></aside>`}
async function dashboard(){
  const rows=await contentService.adminList(current), meta=TABLES[current];
  root.innerHTML=`<div class="admin-toolbar"><div><h1>${meta.label}</h1><p>Signed in as ${esc(profile.display_name||'Staff')} · ${esc(profile.role)}</p></div><button id="newRow" class="btn primary">+ New ${meta.label.replace(/s$/,'')}</button></div><div class="admin-layout">${sidebar()}<section class="card"><table class="admin-table"><thead><tr><th>Title / ID</th><th>Status</th><th>Order</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.title||r.question||r.id)}</strong><br><small>${esc(r.id)}</small></td><td><span class="status-pill">${esc(r.status)}</span></td><td>${esc(r.sort_order??'')}</td><td><button class="btn ghost" data-edit="${esc(r.id)}">Edit</button></td></tr>`).join('')}</tbody></table></section></div>`;
  document.querySelectorAll('[data-table]').forEach(b=>b.onclick=async()=>{current=b.dataset.table;await dashboard()});
  document.getElementById('signOut').onclick=async()=>{await authService.signOut();loginView()};
  document.getElementById('newRow').onclick=()=>editForm({status:'draft',sort_order:rows.length+1});
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editForm(rows.find(r=>r.id===b.dataset.edit)));
}
function editForm(row){const meta=TABLES[current];root.innerHTML=`<div class="admin-toolbar"><h1>${row.id?'Edit':'New'} ${meta.label.replace(/s$/,'')}</h1><button id="cancel" class="btn secondary">Cancel</button></div><div class="card">${meta.fields.map(f=>{const val=row[f]??'';const long=['answer','summary','description'].includes(f);return `<div class="field"><label>${esc(f)}</label>${long?`<textarea data-field="${f}" rows="5">${esc(val)}</textarea>`:`<input data-field="${f}" value="${esc(val)}">`}</div>`}).join('')}<div class="hero-actions"><button id="save" class="btn primary">Save</button>${row.id?'<button id="delete" class="btn secondary">Delete</button>':''}</div><p class="muted">Contributors are limited by database policies; editors/admins can publish.</p></div>`;
  document.getElementById('cancel').onclick=dashboard;
  document.getElementById('save').onclick=async()=>{const payload={};document.querySelectorAll('[data-field]').forEach(i=>payload[i.dataset.field]=i.value);if('sort_order' in payload)payload.sort_order=Number(payload.sort_order||0);if('lesson_number' in payload)payload.lesson_number=Number(payload.lesson_number||0);try{await contentService.upsert(current,payload);await dashboard()}catch(e){alert(e.message)}};
  const del=document.getElementById('delete');if(del)del.onclick=async()=>{if(confirm('Delete this item?')){try{await contentService.remove(current,row.id);await dashboard()}catch(e){alert(e.message)}}};
}
async function boot(){
  if(CONFIG.authProvider!=='supabase'){localView();return}
  const session=await authService.session();if(!session){loginView();return}
  try{profile=await authService.profile();if(!['admin','editor','contributor'].includes(profile.role)){loginView('Your account does not have content editing permission.');return}await dashboard()}catch(e){loginView(e.message)}
}
boot();
