async function logOut(){
  try {
    let accToken = localStorage.getItem("accToken");
    let refToken = localStorage.getItem("refToken");
    const response = await fetch('http://localhost:8765/auth/logout',{
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${accToken}`, // Добавляем заголовок Authorization
        "Content-Type": "application/json" // Указываем формат данных
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
(() => {
  const API  = 'http://localhost:8765';
  const hdr  = () => {
    const t = localStorage.getItem('accToken');
    return t ? { Authorization:`Bearer ${t}` } : {};
  };

  /* ───────────────── DOM ready ───────────────── */
  document.addEventListener('DOMContentLoaded', async () => {
    const teamName = localStorage.getItem('searchedTeam');
    if (!teamName){ location.href = 'main.html'; return; }

    const teamData = await loadTeam(teamName);         if(!teamData) return;
    const myId     = await getMyId();                  // null — если гость
    const memberIds= teamData.members.map(m => m.userId);

    renderTeamHeader(teamData, memberIds.includes(myId));
    renderMembers(teamData.members);

    /* кнопка JOIN */
    if (myId && !memberIds.includes(myId)){
      enableJoinButton(teamData.team.id, memberIds);
    }


  });

  /* ───────────── API helpers ───────────── */
  async function loadTeam(name){
    try{
      const r = await fetch(`${API}/team/currentTeam/${encodeURIComponent(name)}`,{headers:hdr()});
      if(!r.ok) throw new Error(r.status);
      return await r.json();
    }catch(e){
      console.error('loadTeam',e);
      return null;
    }
  }
  async function getMyId(){
    if(!localStorage.getItem('accToken')) return null;
    try{
      const r = await fetch(`${API}/user/profile`,{headers:hdr()});
      return r.ok ? (await r.json()).id : null;
    }catch{ return null; }
  }
  async function getUser(id){
    return fetch(`${API}/user/getUser/${id}`).then(r=>r.ok?r.json():null);
  }
  async function getAvatar(username){
    try{
      const r = await fetch(`${API}/user/avatar/${username}`);
      return r.ok ? await r.text() : 'img/profile.svg';
    }catch{ return 'img/profile.svg'; }
  }

  async function renderTeamHeader({ team, members = [] }, isMember) {
    /* название, дата создания, лого */
    $('#team_name').textContent = team.teamName;
    $('#createdAt').textContent = team.createdAt
      ? new Date(team.createdAt).toLocaleDateString('pl-PL')
      : '—';

    try {
      const logoUrl = await fetch(`${API}/team/team-logo/${team.id}`)
        .then(r => r.ok ? r.text() : '');
      if (logoUrl) $('#team_img').src = logoUrl;
    } catch {/* игнорируем ошибки лого */ }

    /* ---------- менеджер команды ---------- */
    /* массив участников может называться team.teamMembers ИЛИ members */
    const membersArr =
      team.teamMembers           // новая структура
      ?? members                 // старая структура (параметр из loadTeam)
      ?? [];

    const managerMember = membersArr.find(m =>
      (m.roles ?? []).some(r =>
        (r.roleName ?? r.name) === 'MANAGER'));

    if (managerMember) {
      const usr = await getUser(managerMember.userId);
      if (usr) $('#manager_name').textContent = usr.username;
    } else {
      $('#manager_name').textContent = '—';
    }

    /* ---------- кнопка JOIN ---------- */
    const joinBtn = $('#joinTeamBtn');
    if (!joinBtn) return;               // кнопки нет в шаблоне

    if (isMember) {
      joinBtn.classList.add('hidden');  // уже в команде → скрываем
    } else {
      joinBtn.classList.remove('hidden');
    }
  }
  /* ───────────── JOIN button ───────────── */
  function enableJoinButton(teamId){
    const btn = $('#joinTeamBtn');
    if (!btn) return;                 // ← кнопки нет – просто выходим

    btn.classList.remove('hidden');
    btn.disabled = false;

    btn.onclick = async () => {
      btn.disabled = true;
      try{
        const r = await fetch(`${API}/team/send-join-request/${teamId}`,{
          method:'POST', headers:hdr()
        });
        if(r.ok){
          toast('Wysłano prośbę o dołączenie.');
        }else if(r.status === 409){
          toast('Prośba już istnieje.', true);
        }else{
          throw new Error(r.status);
        }
      }catch(e){
        console.error('join error',e);
        toast('Błąd. Spróbuj ponownie.', true);
        btn.disabled = false;
      }
    };
  }
  async function renderMembers(members){
    const box = $('#players');
    // удалить старое, оставить заголовок
    box.querySelectorAll('.player').forEach((p,i)=>{ if(i) p.remove(); });

    for(const m of members){
      const u   = await getUser(m.userId);
      if(!u) continue;
      const ava = await getAvatar(u.username);
      const roles = m.roles.map(r=>r.roleName).join(', ');
      box.insertAdjacentHTML('beforeend',`
        <div class="player">
          <div class="player-info">
            <img src="${ava}" class="player-avatar">
            <p class="player-name">${u.firstName||''} ${u.lastName||''}</p>
            <a href="open-profile.html" onclick="localStorage.setItem('searchedProfile','${u.username}')">
              <p class="player-nickname">${u.username}</p>
            </a>
            <p class="player-joined">${new Date(m.joinedAt).toLocaleDateString()}</p>

          </div>
        </div>`);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const pageLoadSpan = document.querySelector(".footer-content span:nth-child(3)");
    const htmlLoadSpan = document.querySelector(".footer-content span:nth-child(4)");

    if (pageLoadSpan && htmlLoadSpan) {
      // Ждём окончания полной загрузки страницы
      window.addEventListener("load", () => {
        setTimeout(() => {
          const performanceTiming = performance.timing;

          // Время полной загрузки страницы
          const pageLoadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;

          // Время загрузки HTML
          const htmlLoadTime = performanceTiming.responseEnd - performanceTiming.responseStart;

          // Проверяем, что значения корректны
          const validPageLoadTime = pageLoadTime > 0 ? pageLoadTime : performance.now(); // Используем performance.now() как fallback
          const validHtmlLoadTime = htmlLoadTime > 0 ? htmlLoadTime : 0;

          // Обновляем значения в DOM с обёрткой для стилей
          pageLoadSpan.innerHTML = `Strona: <span class="blue">${Math.round(validPageLoadTime)}ms</span>`;
          htmlLoadSpan.innerHTML = `Szablon: <span class="blue">${Math.round(validHtmlLoadTime)}ms</span>`;

          // Логируем значения для отладки
          console.log("Page Load Time (ms):", validPageLoadTime);
          console.log("HTML Load Time (ms):", validHtmlLoadTime);
        }, 0);
      });
    }
  });


  /* ───────────── toast ───────────── */
  function toast(txt, err=false){
    const c = document.getElementById('toastContainer') || (() => {
      const d=document.createElement('div');d.id='toastContainer';
      Object.assign(d.style,{position:'fixed',right:'0',left:'0',bottom:'30px',display:'flex',
        flexDirection:'column',alignItems:'center',zIndex:'9999'});document.body.appendChild(d);return d;})();
    const b=document.createElement('div');
    Object.assign(b.style,{background:err?'#EA3943':'#3861FB',color:'#fff',padding:'8px 18px',
      borderRadius:'8px',marginTop:'6px',fontSize:'14px',boxShadow:'0 2px 4px rgba(0,0,0,.2)'});
    b.textContent=txt;c.prepend(b);setTimeout(()=>b.remove(),4000);
  }

  /* jquery-style $ */
  function $(sel){ return document.querySelector(sel); }

})();
