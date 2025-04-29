
if (localStorage.accToken && localStorage.refToken) refreshToken();

async function refreshToken(){
  try{
    const r = await fetch('http://localhost:8765/auth/refresh-token',{
      method:'POST',
      headers:{Authorization:`Bearer ${localStorage.refToken}`}
    });
    if(!r.ok) throw new Error('refresh error');
    const t = await r.json();
    localStorage.accToken = t.accessToken;
    localStorage.refToken = t.refreshToken;
  }catch(e){console.error(e);}
}

document.addEventListener('DOMContentLoaded',()=>{

  const p=document.querySelector('.footer-content span:nth-child(3)');
  const h=document.querySelector('.footer-content span:nth-child(4)');
  if(p&&h) window.addEventListener('load',()=>setTimeout(()=>{
    const t=performance.timing;
    p.innerHTML=`Strona: <span class="blue">${Math.round(t.loadEventEnd-t.navigationStart)}ms</span>`;
    h.innerHTML=`Szablon: <span class="blue">${Math.round(t.responseEnd-t.responseStart)}ms</span>`;
  },0));

  ['active','future','past','isIndividual'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change',getTournamentsByFilter);
  });
  document.getElementById('sportyButton')?.addEventListener('click',e=>{
    e.target.textContent = e.target.textContent.trim()==='Sporty'?'E-sporty':'Sporty';
    getTournamentsByFilter();
  });

  getTournamentsByFilter();
});

const sysCache   = new Map();
const imgCache   = new Map();
const cntCache   = new Map();

const fetchJSON = (u,opt)=>fetch(u,opt).then(r=>r.ok?r.json():null);

async function getSystem(id){
  if(sysCache.has(id)) return sysCache.get(id);
  const js = await fetchJSON(`http://localhost:8765/game-system/get/${id}`,{
    headers:{Authorization:`Bearer ${localStorage.accToken}`}
  });
  sysCache.set(id,js); return js;
}
async function getImage(cid){
  if(imgCache.has(cid)) return imgCache.get(cid);
  const r = await fetch(`http://localhost:8765/competition/get-image/${cid}`);
  const url = r.ok ? await r.text() : 'img/google-logo.svg';
  imgCache.set(cid,url); return url;
}
async function getCount(cid){
  if(cntCache.has(cid)) return cntCache.get(cid);
  const arr = await fetchJSON(`http://localhost:8765/competition/league-table/${cid}`) || [];
  cntCache.set(cid,arr.length); return arr.length;
}


async function getTournamentsByFilter(){
  const active = document.getElementById('active')?.checked;
  const future = document.getElementById('future')?.checked;
  const past   = document.getElementById('past')?.checked;
  const onlyInd= document.getElementById('isIndividual')?.checked;
  const wantEs = document.getElementById('sportyButton').textContent.trim()!=='Sporty';

  if(!active&&!future&&!past){
    document.getElementById('tournaments-list').innerHTML='';
    return;
  }
  const statuses=[]; if(active)statuses.push('ACTIVE');
  if(future)statuses.push('UPCOMING'); if(past)statuses.push('COMPLETED'); if(onlyInd)statuses.push('true')

  const all = await fetchJSON('http://localhost:8765/competition/all') || [];
  const tournaments = all.filter(c=>c.competitionType==='TOURNAMENT' && statuses.includes(c.status));

  const out=[];
  for(const t of tournaments){
    const sys = await getSystem(t.gameSystemId);
    if(onlyInd && !sys?.isIndividual) continue;

    const sport = await fetchJSON(`http://localhost:8765/sport/id/${t.sportId}`);
    if(sport?.isEsport!==undefined && sport.isEsport!==wantEs) continue;

    out.push({t,sys});
  }
  renderTournamentCards(out);
}
window.getTournamentsByFilter = getTournamentsByFilter;

async function renderTournamentCards(arr){
  const wrap=document.getElementById('tournaments-list');
  wrap.innerHTML='';

  const fmt=d=>d?new Date(d).toLocaleDateString('pl-PL'):'-';

  for(const {t,sys} of arr){
    const [img,current]=await Promise.all([getImage(t.id),getCount(t.id)]);
    const maxCap=sys?.maxTeamSize ?? sys?.playersPerTeam ?? '?';

    const card=document.createElement('div');
    card.className='tournament';
    card.innerHTML=`
      <div>
        <img src="${img}" alt="" style="border-radius:10px">
        <div class="tournament-name">
          <p class="name">${t.name}</p>
          <p class="status">${t.status}</p>
        </div>
      </div>
      <div style="gap:40px;margin-right:20px">
        <div class="start-time"><p>Start:</p><p class="start-date">${fmt(t.startDate)}</p></div>
        <div class="end-time"><p>Koniec:</p><p class="end-date">${fmt(t.endDate)}</p></div>
        <div class="game-system"><p>Tryb:</p><p class="system">${sys?.systemName ?? '-'}</p></div>
        <div class="teams"><p>Uczestnicy:</p><p class="count">${current} / ${maxCap}</p></div>
        <a href="tournaments.html" class="goto">
          <img src="img/style=linear.svg" alt="" style="height:20px;margin-top:40px">
        </a>
      </div>`;
    card.querySelector('.goto').addEventListener('click',()=>{
      localStorage.setItem('searchedTournament',t.id);
    });
    wrap.appendChild(card);
  }
}
async function logOut(){
  try {
    let accToken = localStorage.getItem("accToken");
    let refToken = localStorage.getItem("refToken");
    const response = await fetch('http://localhost:8765/auth/logout',{
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    localStorage.clear();
    window.location.href = "main.html";
  }catch (err){
    console.error(`${err}`);
  }
}
if (document.getElementById('log-out') !== null){
  const logOutBtn = document.getElementById('log-out').addEventListener('click',logOut);
}
