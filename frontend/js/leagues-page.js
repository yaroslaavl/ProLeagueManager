/* league‑list.js */

/* ───────────────────  auth helper  ─────────────────── */
if (localStorage.accToken && localStorage.refToken) refreshToken();

async function refreshToken() {
  try {
    const r = await fetch('http://localhost:8765/auth/refresh-token', {
      method:'POST',
      headers:{Authorization:`Bearer ${localStorage.refToken}`}
    });
    if (!r.ok) throw new Error('refresh error');
    const t = await r.json();
    localStorage.accToken = t.accessToken;
    localStorage.refToken = t.refreshToken;
  } catch(e){ console.error(e); }
}

/* ─────────────────── UI helpers ───────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const p = document.querySelector('.footer-content span:nth-child(3)');
  const h = document.querySelector('.footer-content span:nth-child(4)');
  if (p && h) window.addEventListener('load', () =>
    setTimeout(()=>{
      const t = performance.timing;
      p.innerHTML = `Strona: <span class="blue">${Math.round(t.loadEventEnd-t.navigationStart)}ms</span>`;
      h.innerHTML = `Szablon: <span class="blue">${Math.round(t.responseEnd-t.responseStart)}ms</span>`;
    },0)
  );

  ['active','future','past','isIndividual'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change',applyFilters);
  });
  document.getElementById('sportyButton')?.addEventListener('click',e=>{
    e.target.textContent = e.target.textContent.trim()==='Sporty'?'E-sporty':'Sporty';
    applyFilters();
  });

  applyFilters();
});

/* ───────────── caches for repeat requests ──────────── */
const sysCache   = new Map();
const sportCache = new Map();
const cntCache   = new Map();

const fetchJSON = (url,opt)=>fetch(url,opt).then(r=>r.ok?r.json():null);

async function getSystem(id){
  if(sysCache.has(id)) return sysCache.get(id);
  const js = await fetchJSON(`http://localhost:8765/game-system/get/${id}`,
    {headers:{Authorization:`Bearer ${localStorage.accToken}`}});
  sysCache.set(id,js); return js;
}
async function getSport(id){
  if(sportCache.has(id)) return sportCache.get(id);
  const js = await fetchJSON(`http://localhost:8765/sport/id/${id}`);
  sportCache.set(id,js); return js;
}
async function getCount(cid){
  if(cntCache.has(cid)) return cntCache.get(cid);
  const arr = await fetchJSON(`http://localhost:8765/competition/league-table/${cid}`) || [];
  cntCache.set(cid,arr.length); return arr.length;
}

/* ─────────────────── filter/loader ────────────────── */
async function applyFilters(){
  const active=document.getElementById('active')?.checked;
  const future=document.getElementById('future')?.checked;
  const past  =document.getElementById('past')?.checked;
  const onlyInd=document.getElementById('isIndividual')?.checked;
  const wantEs =document.getElementById('sportyButton').textContent.trim()!=='Sporty';

  if(!active&&!future&&!past){
    document.getElementById('leagues-list').innerHTML='';
    return;
  }
  const need=[]; if(active)need.push('ACTIVE'); if(future)need.push('UPCOMING'); if(past)need.push('COMPLETED');

  const all=await fetchJSON('http://localhost:8765/competition/all')||[];
  const leagues=all.filter(c=>c.competitionType==='LEAGUE'&&need.includes(c.status));

  const result=[];
  for(const c of leagues){
    const [sys,sport]=await Promise.all([getSystem(c.gameSystemId),getSport(c.sportId)]);
    if(onlyInd && !sys?.isIndividual) continue;
    if(sport?.isEsport!==undefined && sport.isEsport!==wantEs) continue;
    result.push({c,sys});
  }
  renderList(result);
}
window.getLeaguesByFilter=applyFilters;       // поддержка старых inline onclick

/* ─────────────── render cards ─────────────────────── */
async function renderList(listData){
  const wrap=document.getElementById('leagues-list');
  wrap.innerHTML='';

  for(const {c,sys} of listData){
    let img='img/google-logo.svg';
    try{
      const r=await fetch(`http://localhost:8765/competition/get-image/${c.id}`);
      if(r.ok) img=await r.text();
    }catch{}

    const current=await getCount(c.id);
    const maxCap=sys?.maxTeamSize ?? sys?.playersPerTeam ?? '?';
    const fmt=d=>d?new Date(d).toLocaleDateString('pl-PL'):'-';

    const card=document.createElement('div');
    card.className='tournament';
    card.innerHTML=`
      <div>
        <img src="${img}" alt="" style="border-radius:10px">
        <div class="tournament-name">
          <p class="name">${c.name}</p>
          <p class="status">${c.status}</p>
        </div>
      </div>
      <div style="gap:40px;margin-right:20px">
        <div class="start-time"><p>Start:</p><p style="color:#000">${fmt(c.startDate)}</p></div>
        <div class="end-time"><p>Koniec:</p><p style="color:#000">${fmt(c.endDate)}</p></div>
        <div class="game-system"><p>Tryb:</p><p style="color:#000">${sys?.systemName ?? '-'}</p></div>
        <div class="teams"><p>Uczestnicy:</p><p style="color:#000">${current} / ${maxCap}</p></div>
        <a href="leagues.html" class="goto-league">
          <img src="img/style=linear.svg" alt="" style="height:20px;margin-top:40px">
        </a>
      </div>
    `;
    /* при клике — кладём id и переходим */
    card.querySelector('.goto-league').addEventListener('click',()=>{
      localStorage.setItem('searchedLeague',c.id);
    });

    wrap.appendChild(card);
  }
}

if (document.getElementById('log-out') !== null){
  const logOutBtn = document.getElementById('log-out').addEventListener('click',logOut);
}
