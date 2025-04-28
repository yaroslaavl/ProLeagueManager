// js/match-page.js
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
(() => {
  const API      = 'http://localhost:8765';
  const MATCH_ID = localStorage.getItem('searchedMatch');
  if (!MATCH_ID) {
    location.href = 'main.html';
    return;
  }

  // хедер для fetch
  const hdr = () => {
    const t = localStorage.getItem('accToken');
    return t
      ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' }
      : {};
  };

  // короткая функция для document.querySelector
  const $ = selector => document.querySelector(selector);

  // хранит текущий матч для редактора
  let currentMatch = null;

  /* ===== GET участник (игрок или команда) ===== */
  async function getParticipant(playerId, teamId) {
    if (playerId) {
      const u   = await fetch(`${API}/user/getUser/${playerId}`, { headers: hdr() }).then(r => r.json());
      const img = await fetch(`${API}/user/avatar/${u.username}`, { headers: hdr() })
        .then(r => r.ok ? r.text() : 'img/profile.svg')
        .catch(() => 'img/profile.svg');
      return { type: 'player', id: playerId, name: u.username, img, members: [u.username] };
    }
    if (teamId) {
      const team = await fetch(`${API}/team/current/${teamId}`, { headers: hdr() }).then(r => r.json());
      const logo = await fetch(`${API}/team/team-logo/${teamId}`, { headers: hdr() })
        .then(r => r.ok ? r.text() : 'img/default-team-avatar.png')
        .catch(() => 'img/default-team-avatar.png');
      const members = await Promise.all(
        (team.teamMembers || []).map(tm =>
          fetch(`${API}/user/getUser/${tm.userId}`, { headers: hdr() })
            .then(r => r.ok ? r.json() : { username: `#${tm.userId}` })
            .then(u => u.username)
        )
      );
      return { type: 'team', id: teamId, name: team.teamName, img: logo, members };
    }
    return { type: 'unknown', id: null, name: '—', img: 'img/profile.svg', members: [] };
  }

  /* ===== GET ролей текущего пользователя ===== */
  async function getUserRoles() {
    await refreshToken();
    const res = await fetch(`${API}/user/role-group`, { headers: hdr() });
    if (!res.ok) throw new Error(`Roles fetch failed: ${res.status}`);
    const group = await res.json();
    return (group.roles || []).map(r => r.name);
  }

  /* ===== Показываем попап для редактирования счёта ===== */
  function showScoreEditor() {
    if ($('#score-editor-modal')) return; // уже открыт

    const modal = document.createElement('div');
    modal.id = 'score-editor-modal';
    Object.assign(modal.style, {
      position: 'fixed', top:0, left:0, right:0, bottom:0,
      background: 'rgba(0,0,0,0.5)', display:'flex',
      alignItems:'center', justifyContent:'center', zIndex:10000
    });
    modal.innerHTML = `
      <div style="background:#fff;padding:20px;border-radius:8px;min-width:280px;">
        <h3 style="margin-top:0;">Edytuj wynik</h3>
        <div style="margin-bottom:10px;">
          <label>Score A:
            <input type="number" id="edit-score-a"
                   value="${currentMatch.scoreA ?? 0}"
                   style="width:60px;margin-left:8px;">
          </label>
        </div>
        <div style="margin-bottom:20px;">
          <label>Score B:
            <input type="number" id="edit-score-b"
                   value="${currentMatch.scoreB ?? 0}"
                   style="width:60px;margin-left:8px;">
          </label>
        </div>
        <div style="text-align:right;">
          <button id="cancel-score-btn"
                  style="margin-right:8px;padding: 10px 20px;color: #ffffff;background: #dc3545;font-weight: bold;border-radius: 10px;border: none">Anuluj</button>
          <button id="save-score-btn" style="margin-right:8px;padding: 10px 20px;color: #ffffff;background: #3861FB;font-weight: bold;border-radius: 10px;border: none">Zapisz</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    $('#cancel-score-btn').onclick = () => modal.remove();
    $('#save-score-btn').onclick   = updateMatchScore;
  }

  /* ===== Отправка изменённого счёта ===== */
  async function updateMatchScore() {
    const a = parseInt($('#edit-score-a').value, 10);
    const b = parseInt($('#edit-score-b').value, 10);
    try {
      let res = await fetch(
        `${API}/match/${MATCH_ID}/score`,
        { method:'PUT', headers: hdr(), body: JSON.stringify({ scoreA: a }) }
      );
      if (!res.ok) throw new Error(`A failed: ${res.status}`);

      res = await fetch(
        `${API}/match/${MATCH_ID}/score`,
        { method:'PUT', headers: hdr(), body: JSON.stringify({ scoreB: b }) }
      );
      if (!res.ok) throw new Error(`B failed: ${res.status}`);

      $('.score').textContent = `${a} : ${b}`;
      document.getElementById('score-editor-modal').remove();
      alert('Wynik został zaktualizowany');
    } catch (err) {
      console.error('Błąd zmiany wyniku:', err);
      alert('Nie udało się zmienić wyniku');
    }
  }

  /* ===== Инициализация страницы матча ===== */
  async function initMatchPage() {
    try {
      refreshToken();
      const match = await fetch(`${API}/match/id/${MATCH_ID}`, { headers: hdr() }).then(r => r.json());
      currentMatch = match;

      // проверяем, может ли юзер менять счёт
      const roles = await getUserRoles();
      const canEdit = roles.includes('ADMIN') || roles.includes('MODERATOR');

      // Получаем данные турнира и спорта для заголовков
      const comp  = await fetch(`${API}/competition/get/${match.competitionId}`, { headers: hdr() }).then(r => r.json());
      const sport = await fetch(`${API}/sport/id/${comp.sportId}`, { headers: hdr() }).then(r => r.json());

      const [A, B] = await Promise.all([
        getParticipant(match.playerAId, match.teamAId),
        getParticipant(match.playerBId, match.teamBId)
      ]);

      // Заголовки
      $('.main-info').textContent       = comp.name;
      $('.main-info-sport').textContent = sport.name;

      // Даты
      const fmt = d => d
        ? new Date(d).toLocaleString('pl-PL', { dateStyle:'short', timeStyle:'short' })
        : '—';
      $('.start-date').textContent = `Start:  ${fmt(match.createdAt)}`;
      $('.end-date').textContent   = `Koniec: ${fmt(match.updatedAt)}`;

      // Статус
      const st = $('.match-status');
      st.textContent = match.matchStatus;
      st.classList.add('blue');

      // Счёт + кнопка редактировать
      const scoreEl = $('.score');
      scoreEl.textContent = `${match.scoreA ?? '—'} : ${match.scoreB ?? '—'}`;
      if (canEdit) {
        const btn = document.createElement('button');
        btn.textContent = 'Edytuj';
        Object.assign(btn.style, { marginLeft:'8px', cursor:'pointer' ,background: '#3861FB',borderRadius: '12px',padding: '20px   30px',color: '#ffffff',border: 'none',fontWeight: 'bold' });
        btn.title = 'Edytuj wynik';
        btn.onclick = showScoreEditor;
        scoreEl.parentNode.insertBefore(btn, scoreEl.nextSibling);
      }

      // Имена сторон
      $('.playerA').textContent = A.name;
      $('.playerB').textContent = B.name;

      // Списки участников
      renderList('.playerLeft  .playerList', A, false);
      renderList('.playerRight .playerList', B, true);

      // Подсветка победителя
      paintWinner(match, A, B);

    } catch (e) {
      console.error('match-page init:', e);
      $('.main-content').innerHTML =
        '<p style="color:#EA3943">Błąd ładowania danych meczu.</p>';
    }
  }

  /* ===== Рендер списка участников ===== */
  function renderList(sel, part, right = false) {
    const box = $(sel);
    if (!box) return;
    box.innerHTML = '';
    part.members.forEach(nick => {
      box.insertAdjacentHTML('beforeend', `
        <div class="player">
          ${right ? '' : `<img src="${part.img}" class="player-avatar">`}
          <p class="nickname">${nick}</p>
          ${right ? `<img src="${part.img}" class="player-avatar">` : ''}
        </div>
      `);
    });
  }

  /* ===== Подкрашиваем победителя ===== */
  function paintWinner(match, A, B) {
    const winnerId = match.winnerPlayerId || match.winnerTeamId;
    if (!winnerId) return;
    const win = '#1f9a3e', lose = '#d62828';
    const aIsWin = winnerId === (match.playerAId || match.teamAId);
    (aIsWin ? $('.playerA') : $('.playerB')).style.color = win;
    (aIsWin ? $('.playerB') : $('.playerA')).style.color = lose;
    $('.score').style.color = win;
    document.querySelectorAll('.playerLeft  .nickname')
      .forEach(el => el.style.color = aIsWin ? win : lose);
    document.querySelectorAll('.playerRight .nickname')
      .forEach(el => el.style.color = aIsWin ? lose : win);
  }

  document.addEventListener('DOMContentLoaded', initMatchPage);
})();

// ===== Footer Metrics =====
document.addEventListener("DOMContentLoaded", () => {
  const sp1 = document.querySelector(".footer-content span:nth-child(3)");
  const sp2 = document.querySelector(".footer-content span:nth-child(4)");
  if (!sp1 || !sp2) return;
  window.addEventListener("load", () => setTimeout(() => {
    const t = performance.timing;
    const lt = t.loadEventEnd - t.navigationStart;
    const ht = t.responseEnd - t.responseStart;
    if (lt > 0) sp1.innerHTML = `Strona: <span class="blue">${Math.round(lt)}ms</span>`;
    if (ht > 0) sp2.innerHTML = `Szablon: <span class="blue">${Math.round(ht)}ms</span>`;
  }, 0));
});
