/* ───────────────────  MATCH-PAGE  ─────────────────── */
(() => {
  const API      = 'http://localhost:8765';
  const MATCH_ID = localStorage.getItem('searchedMatch');
  if (!MATCH_ID) { location.href = 'main.html'; return; }

  const hdr = () => {
    const t = localStorage.getItem('accToken');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };
  const $ = s => document.querySelector(s);

  /* ---------- игрок / команда ---------- */
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
        (team.teamMembers || []).map(async tm => {
          const u = await fetch(`${API}/user/getUser/${tm.userId}`, { headers: hdr() }).then(r => r.json());
          return u.username;
        })
      );

      return { type: 'team', id: teamId, name: team.teamName, img: logo, members };
    }

    return { type: 'unknown', id: null, name: '—', img: 'img/profile.svg', members: [] };
  }

  /* ---------- страница ---------- */
  async function initMatchPage() {
    try {
      const match = await fetch(`${API}/match/id/${MATCH_ID}`, { headers: hdr() }).then(r => r.json());
      const comp  = await fetch(`${API}/competition/get/${match.competitionId}`, { headers: hdr() }).then(r => r.json());
      const sport = await fetch(`${API}/sport/id/${comp.sportId}`, { headers: hdr() }).then(r => r.json());

      const [A, B] = await Promise.all([
        getParticipant(match.playerAId, match.teamAId),
        getParticipant(match.playerBId, match.teamBId)
      ]);

      /* заголовок */
      $('.main-info').textContent       = comp.name;
      $('.main-info-sport').textContent = sport.name;

      /* даты матча */
      const fmt = d => d ? new Date(d).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : '—';
      $('.start-date').textContent = `Start:  ${fmt(match.createdAt)}`;
      $('.end-date').textContent   = `Koniec: ${fmt(match.updatedAt)}`;

      /* статус (синий) */
      const st = $('.match-status');
      st.textContent = match.matchStatus;
      st.classList.add('blue');

      /* счёт */
      $('.score').textContent = `${match.scoreA ?? '—'} : ${match.scoreB ?? '—'}`;

      /* заголовки сторон */
      $('.playerA').textContent = A.name;
      $('.playerB').textContent = B.name;

      /* списки игроков/участников */
      renderList('.playerLeft  .playerList', A, false);
      renderList('.playerRight .playerList', B, true);

      /* покрасить победителя */
      paintWinner(match, A, B);

    } catch (e) {
      console.error('match-page:', e);
      $('.main-content').innerHTML = '<p style="color:#EA3943">Błąd ładowania danych meczu.</p>';
    }
  }

  /* ---------- список игроков ---------- */
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
        </div>`);
    });
  }

  /* ---------- winner / loser colouring ---------- */
  function paintWinner(match, A, B) {
    const winnerId = match.winnerPlayerId || match.winnerTeamId;
    if (!winnerId) return;

    const win = '#1f9a3e', lose = '#d62828';
    const aIsWin = winnerId === (match.playerAId || match.teamAId);

    /* заголовки */
    (aIsWin ? $('.playerA') : $('.playerB')).style.color = win;
    (aIsWin ? $('.playerB') : $('.playerA')).style.color = lose;

    /* счёт */
    $('.score').style.color = win;

    /* ники внутри списков */
    document.querySelectorAll('.playerLeft  .nickname')
      .forEach(el => el.style.color = aIsWin ? win : lose);
    document.querySelectorAll('.playerRight .nickname')
      .forEach(el => el.style.color = aIsWin ? lose : win);
  }

  document.addEventListener('DOMContentLoaded', initMatchPage);
})();
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
