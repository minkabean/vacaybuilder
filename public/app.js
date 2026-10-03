const API='/api/public';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:Number(n)%1?2:0});
async function get(path){const r=await fetch(API+path);if(!r.ok)throw new Error('Unable to load trip updates');return r.json();}
async function load(){
  try{
    const data=await get('/bootstrap');
    const {event,hotels,costs,activities,ideas,guestbook,announcements,content}=data;
    document.querySelectorAll('[data-content-key]').forEach(el=>{const v=content?.[el.dataset.contentKey];if(v)el.textContent=v;});
    document.querySelectorAll('[data-public-hotels]').forEach(root=>{root.innerHTML=hotels.map(h=>`<article class="hotel-card"><div class="hotel-card-top"><span>${esc(h.area||'Oak Bluffs')}</span><strong>${h.nightly_rate!=null?money(h.nightly_rate)+'/night':'Rate TBD'}</strong></div><h3>${esc(h.name)}</h3><p>${esc(h.room_type||'')}</p>${h.notes?`<p>${esc(h.notes)}</p>`:''}</article>`).join('');});
    document.querySelectorAll('[data-public-hotel-prices]').forEach(root=>{root.innerHTML=hotels.map(h=>`<article><div><h3>${esc(h.name)}</h3><p>${esc(h.room_type||'')}</p></div><strong>${h.nightly_rate!=null?money(h.nightly_rate):'TBD'} <small>/ night</small></strong></article>`).join('');});
    document.querySelectorAll('[data-public-costs]').forEach(root=>{root.innerHTML=costs.map(c=>`<div class="budget-line"><span>${esc(c.label)}${c.detail?` <small>${esc(c.detail)}</small>`:''}</span><strong>${esc(c.amount_text)}</strong></div>`).join('');});
    const free=activities.filter(a=>String(a.cost_text||'').toLowerCase()==='free');
    document.querySelectorAll('[data-public-free-activities]').forEach(root=>{root.innerHTML=free.map(a=>`<article><div><h3>${esc(a.title)}</h3>${a.location||a.event_time?`<p>${esc([a.location,a.event_time].filter(Boolean).join(' · '))}</p>`:''}</div><strong>Free</strong></article>`).join('');});
    document.querySelectorAll('[data-public-ideas]').forEach(root=>{root.innerHTML=ideas.length?ideas.map(i=>`<article class="dynamic-idea-card"><div><span>${esc(i.category||'Guest Idea')}</span><h3>${esc(i.title)}</h3><p>${esc(i.description||'')}</p></div><div><strong>${i.going_count||0} Going</strong><span>${i.interested_count||0} Interested</span></div></article>`).join(''):'<p>No guest ideas have been posted yet.</p>';});
    document.querySelectorAll('[data-public-guestbook]').forEach(root=>{root.innerHTML=guestbook.length?guestbook.map(g=>`<article class="vb-message"><p>“${esc(g.message)}”</p><small>${esc(g.display_name||'Guest')}</small></article>`).join(''):'<p>Be the first to leave Trina a message.</p>';});
    document.querySelectorAll('[data-public-announcements]').forEach(sec=>{if(!announcements.length)return;sec.hidden=false;sec.querySelector('[data-announcement-list]').innerHTML=announcements.map(a=>`<article class="vb-announcement"><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p></article>`).join('');});
  }catch(e){console.warn(e);}
}
document.addEventListener('DOMContentLoaded',load);
