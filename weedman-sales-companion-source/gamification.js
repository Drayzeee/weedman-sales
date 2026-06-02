// ═══════════════════════════════════════════════════
// SALESFLOW — GAMIFICATION MODULE v1.0
// Daily Challenge + XP System + Achievements + Leaderboard
//
// HOW TO INSTALL:
// Add this ONE line to science-v2.html right before </body>:
//   <script src="gamification.js"></script>
//
// That's it. Everything hooks in automatically.
// ═══════════════════════════════════════════════════

(function SalesFlowGamify() {

  // ── XP VALUES ────────────────────────────────────
  const XP = {
    module_complete:   100,
    perfect_score:      50,
    daily_challenge:    25,
    streak_bonus:       10,
    all_complete:      500,
    first_try:          30,
  };

  // ── ACHIEVEMENTS ─────────────────────────────────
  const ACHIEVEMENTS = [
    { id:'first_step',    icon:'🌱', name:'First Step',      desc:'Complete your first module',           xp:50,  check:(g,r)=> Object.keys(r.completed||{}).length >= 1 },
    { id:'halfway',       icon:'📈', name:'Halfway There',   desc:'Complete 4 of 8 modules',              xp:100, check:(g,r)=> Object.keys(r.completed||{}).length >= 4 },
    { id:'certified',     icon:'🏆', name:'Certified',       desc:'Complete all 8 modules',               xp:500, check:(g,r)=> Object.keys(r.completed||{}).length >= 8 },
    { id:'perfect',       icon:'💯', name:'Perfect Score',   desc:'Score 100% on any quiz',               xp:75,  check:(g,r)=> Object.values(r.score||{}).some(s=>s===100) },
    { id:'streak_3',      icon:'🔥', name:'On a Roll',       desc:'3-day study streak',                   xp:50,  check:(g)=> g.streak >= 3 },
    { id:'streak_7',      icon:'⚡', name:'Week Warrior',    desc:'7-day study streak',                   xp:150, check:(g)=> g.streak >= 7 },
    { id:'daily_5',       icon:'📅', name:'Daily Devotion',  desc:'Complete 5 daily challenges',          xp:75,  check:(g)=> g.dailyCount >= 5 },
    { id:'daily_10',      icon:'🗓️', name:'Consistent',      desc:'Complete 10 daily challenges',         xp:150, check:(g)=> g.dailyCount >= 10 },
    { id:'sharpshooter',  icon:'🎯', name:'Sharp Shooter',   desc:'Pass 3 modules on first try',          xp:100, check:(g)=> (g.firstTry||[]).length >= 3 },
    { id:'speed_runner',  icon:'💨', name:'Speed Runner',    desc:'Complete 3 modules in one day',        xp:100, check:(g)=> (g.todayModules||[]).length >= 3 },
    { id:'xp_500',        icon:'💎', name:'XP Hunter',       desc:'Earn 500 total XP',                    xp:0,   check:(g)=> g.xp >= 500 },
    { id:'xp_1000',       icon:'👑', name:'Sales Scholar',   desc:'Earn 1,000 total XP',                  xp:0,   check:(g)=> g.xp >= 1000 },
  ];

  // ── DAILY CHALLENGE POOL ─────────────────────────
  const DAILY_POOL = [
    { q:'What temperature triggers crabgrass germination?', opts:['45°F','55°F','65°F','75°F'], correct:1, explain:'55°F soil temp is the pre-emergent deadline. Miss it and crabgrass germinates freely all season.' },
    { q:'What is the Spring fertilizer formula at Weedman?', opts:['24-0-6','18-3-3','36-4-6','20-5-5'], correct:2, explain:'36-4-6 XCU slow-release feeds for 120 days. High nitrogen pushes spring growth out of dormancy.' },
    { q:'Brown grass in July is most likely...', opts:['Dead — needs replacement','Dormant — roots are alive','Disease','Drought damage that is permanent'], correct:1, explain:'Dormancy is protective — the crown and roots survive. Consistent watering brings it back in 7-14 days.' },
    { q:'Why does store granular weed killer fail on dandelions?', opts:['It is lower quality','Granular slides off the waxy leaf coating','It needs warmer weather','You need to water it in first'], correct:1, explain:'Dandelion leaves have a waxy cuticle. Our professional liquid has surfactants that break through it.' },
    { q:'What does Potassium (K) do in a fertilizer?', opts:['Pushes green growth','Builds roots','Stress resistance and drought survival','Prevents weeds'], correct:2, explain:'Potassium is the electrolyte — it keeps the grass resilient under heat, drought, and cold stress.' },
    { q:'How long does our XCU slow-release fertilizer feed for?', opts:['4-6 weeks','60 days','90 days','120 days'], correct:3, explain:'XCU polymer shell releases nutrients continuously for 120 days with soil moisture. Store products: 4-6 weeks.' },
    { q:'What does clover in the lawn actually indicate?', opts:['Too much water','pH is too low','Nitrogen deficiency — turf is too thin','Too much shade'], correct:2, explain:'Clover thrives where grass is thin from nitrogen deficiency. Fertilization thickens turf and crowds it out.' },
    { q:'What is a Chinook wind?', opts:['Cold Arctic blast in winter','Warm dry wind descending from the Rockies that pulls soil moisture fast','Spring rain pattern','Summer thunderstorm system'], correct:1, explain:'Chinooks compress and heat as they descend — acting like a giant blow dryer on shallow-rooted lawns.' },
    { q:'What is the ideal soil pH range for grass to thrive?', opts:['5.0-6.0','6.0-7.0','7.5-8.5','8.0-9.0'], correct:1, explain:'Grass needs 6.0-7.0 pH. Montana averages 7.5-8.5 which locks out nutrients — that is why pH correction matters.' },
    { q:'How long do roots take to build in Montana clay?', opts:['1 season','2-3 seasons','6 months','They never build properly'], correct:1, explain:'Montana clay + high pH = slow establishment. Year 1 foundation, year 2 improvement, year 3 resilience.' },
    { q:'What is Bti used in the mosquito program?', opts:['An insecticide spray','A naturally occurring bacteria that prevents larval development','A repellent for adult mosquitoes','A chemical that kills standing water algae'], correct:1, explain:'Bti is Bacillus thuringiensis israelensis — a soil bacteria. Larvae ingest it and cannot develop into adults.' },
    { q:'What is the correct summer watering schedule?', opts:['Daily for 10 minutes','Every other day 30 min','Mon/Wed/Fri 20+ minutes per section','Only when grass shows stress'], correct:2, explain:'Deep infrequent watering forces roots down. Daily shallow keeps roots at the surface where heat destroys them.' },
    { q:'Why is fall the best time to aerate and overseed?', opts:['Crews are less busy','Cool nights plus warm soil equals best germination before winter dormancy','Spring is too wet','Summer heat damages new seed'], correct:1, explain:'September/October: warm soil germinates seed fast, cool air prevents stress, roots establish before freeze.' },
    { q:'What does the Summer fertilizer formula 24-0-6 have zero phosphorus?', opts:['Phosphorus is too expensive in summer','Established turf does not need root development push in summer heat','It makes the lawn greener','Zero P prevents weeds'], correct:1, explain:'Established turf roots are developed. Zero P in summer avoids unnecessary root push when heat stress is the priority.' },
    { q:'What do surfactants do in professional liquid weed control?', opts:['Slow down the chemical','Break surface tension on waxy leaf coatings so herbicide penetrates and sticks','Add color for visibility','Prevent product from washing off in rain only'], correct:1, explain:'Surfactants work like dish soap on the leaf surface — dissolving the wax so the herbicide actually contacts and enters the plant.' },
    { q:'What is the winterizer application and why does it matter?', opts:['It keeps grass green in winter','It feeds dormant roots so the lawn has stored energy for a stronger spring emergence','It prevents ice damage','Only cosmetic — no real benefit'], correct:1, explain:'Winterizer fuels roots through dormancy. That stored energy powers spring emergence — skip it and the lawn starts spring depleted.' },
    { q:'How does Billings annual rainfall compare to national average?', opts:['About average at 30 inches','High at 45 inches','Low at 14 inches — semi-arid climate','Same as Bozeman at 19 inches'], correct:2, explain:'Billings gets just 14 inches per year. That semi-arid climate drives the alkaline soil, Chinook impact, and why watering technique matters so much.' },
    { q:'Why does Kentucky Bluegrass self-repair bare spots but Tall Fescue does not?', opts:['Bluegrass is healthier','Bluegrass has rhizomes that spread underground — fescue is a bunch grass that does not spread','Fescue is less established','Bluegrass grows faster'], correct:1, explain:'Rhizomes are underground runners. Bluegrass sends them out to fill gaps. Fescue only grows thicker in its clump — bare spots stay bare without overseeding.' },
    { q:'What triggers dormancy in cool-season Montana grasses?', opts:['First frost','Soil temps consistently above 85°F for extended periods','Lack of fertilizer','Root disease'], correct:1, explain:'Cool-season grasses shut down top growth when soil gets too hot to protect the crown and roots. Water breaks dormancy.' },
    { q:'What makes aeration important specifically for Montana lawns?', opts:['It removes thatch everywhere','It breaks clay compaction AND allows water and fertilizer to actually reach roots instead of running off','It only benefits dry lawns','It replaces the need for fertilizer'], correct:1, explain:'Compacted Montana clay causes water and fertilizer to run off instead of absorbing. Aeration punches channels that allow treatments to actually reach roots.' },
  ];

  // ── DEMO LEADERBOARD DATA ─────────────────────────
  const DEMO_REPS = [
    { name:'Jacob T.',   xp:1240, modules:8, streak:14, certified:true },
    { name:'Dean R.',    xp:980,  modules:7, streak:9,  certified:false },
    { name:'Rebecca M.', xp:840,  modules:6, streak:6,  certified:false },
    { name:'Gabrielle S.',xp:620, modules:5, streak:4,  certified:false },
    { name:'Tyler W.',   xp:410,  modules:4, streak:2,  certified:false },
  ];

  // ── STATE ────────────────────────────────────────
  let g = JSON.parse(localStorage.getItem('sf_gamify') || JSON.stringify({
    xp:0, streak:0, lastStudied:null, lastDaily:null,
    dailyCount:0, achievements:[], firstTry:{}, todayModules:[],
    lastModDate:null, prevCompleted:{}
  }));

  function today() { return new Date().toDateString(); }
  function dayOfYear() { const n=new Date(); return Math.floor((n-new Date(n.getFullYear(),0,0))/(1000*60*60*24)); }
  function saveG() { localStorage.setItem('sf_gamify', JSON.stringify(g)); }

  // ── STREAK LOGIC ─────────────────────────────────
  function updateStreak() {
    const t = today();
    if (!g.lastStudied) { g.lastStudied = t; }
    else {
      const last = new Date(g.lastStudied);
      const diff = Math.floor((new Date(t) - last) / (1000*60*60*24));
      if (diff === 1) { g.streak++; g.lastStudied = t; }
      else if (diff > 1) { g.streak = 1; g.lastStudied = t; }
    }
    if (g.lastModDate !== t) { g.todayModules = []; g.lastModDate = t; }
    saveG();
  }

  // ── ACHIEVEMENT CHECK ─────────────────────────────
  function checkAchievements() {
    const rep = getRepData();
    ACHIEVEMENTS.forEach(a => {
      if (g.achievements.includes(a.id)) return;
      if (a.check(g, rep)) {
        g.achievements.push(a.id);
        if (a.xp > 0) g.xp += a.xp;
        saveG();
        showAchievementToast(a);
      }
    });
    updateGamifyBar();
  }

  function getRepData() {
    try { return JSON.parse(localStorage.getItem('sf_training') || '{"completed":{},"score":{}}'); }
    catch(e) { return {completed:{},score:{}}; }
  }

  // ── HOOK INTO EXISTING APP ────────────────────────
  function hookApp() {
    const origSave = window.saveRep;
    if (!origSave) return;
    window.saveRep = function() {
      const prevKeys = Object.keys(getRepData().completed || {});
      origSave();
      const rep = getRepData();
      const newKeys = Object.keys(rep.completed || {}).filter(k => !prevKeys.includes(k));
      if (newKeys.length > 0) {
        newKeys.forEach(moduleId => {
          const score = rep.score[moduleId] || 0;
          awardXP(XP.module_complete, '+100 XP — Module Complete!');
          if (score === 100) awardXP(XP.perfect_score, '+50 XP — Perfect Score!');
          if (!g.firstTry[moduleId]) {
            g.firstTry[moduleId] = true;
            awardXP(XP.first_try, '+30 XP — First Try!');
          }
          if (!g.todayModules.includes(moduleId)) {
            g.todayModules.push(moduleId);
          }
        });
        g.streak = Math.max(g.streak, 1);
        g.lastStudied = today();
        saveG();
        checkAchievements();
        updateGamifyBar();
      }
    };
  }

  // ── XP AWARD ─────────────────────────────────────
  function awardXP(amount, label) {
    g.xp += amount;
    saveG();
    floatXP(label || ('+' + amount + ' XP'));
    updateGamifyBar();
  }

  function floatXP(label) {
    const el = document.createElement('div');
    el.textContent = label;
    Object.assign(el.style, {
      position:'fixed', bottom:'80px', left:'50%',
      transform:'translateX(-50%)', background:'rgba(107,142,35,0.9)',
      color:'#fff', padding:'8px 18px', borderRadius:'20px',
      fontWeight:'900', fontSize:'13px', zIndex:'9999',
      animation:'xpFloat 1.8s ease forwards', pointerEvents:'none',
      whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(107,142,35,0.4)'
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  // ── DAILY CHALLENGE LOGIC ─────────────────────────
  function getTodayQuestion() {
    const idx = dayOfYear() % DAILY_POOL.length;
    return DAILY_POOL[idx];
  }

  function hasDoneToday() { return g.lastDaily === today(); }

  function openDailyChallenge() {
    const q = getTodayQuestion();
    const done = hasDoneToday();
    const modal = document.getElementById('gModal');
    let html = `
      <div class="gm-header">
        <div class="gm-title">📅 Daily Challenge</div>
        <div class="gm-sub">${done ? '✅ Completed today!' : 'New question every day • +25 XP'}</div>
      </div>`;
    if (done) {
      html += `
        <div class="gm-done-box">
          <div style="font-size:40px;margin-bottom:12px;">✅</div>
          <div style="font-size:15px;font-weight:900;color:var(--primary-light);margin-bottom:8px;">Done for today!</div>
          <div style="font-size:12px;color:var(--text-secondary);">Come back tomorrow for a new question.</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">Daily streak: ${g.dailyCount} challenges completed</div>
        </div>
        <button class="gm-btn" onclick="window.SFGamify.closeModal()">Close</button>`;
    } else {
      html += `
        <div class="gm-q-text" id="dcQText">${q.q}</div>
        <div class="gm-options" id="dcOpts">`;
      q.opts.forEach((opt, i) => {
        html += `<button class="gm-opt" id="dcOpt${i}" onclick="window.SFGamify.answerDaily(${i})">${opt}</button>`;
      });
      html += `</div>
        <div class="gm-explain" id="dcExplain" style="display:none;">${q.explain}</div>
        <button class="gm-btn" id="dcNextBtn" onclick="window.SFGamify.closeModal()" style="display:none;margin-top:14px;">Close</button>`;
    }
    modal.innerHTML = html;
    openModal();
  }

  function answerDaily(optIdx) {
    const q = getTodayQuestion();
    const correct = optIdx === q.correct;
    document.querySelectorAll('.gm-opt').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correct) btn.classList.add('correct');
      else if (i === optIdx && !correct) btn.classList.add('wrong');
    });
    document.getElementById('dcExplain').style.display = 'block';
    document.getElementById('dcNextBtn').style.display = 'block';
    if (correct) {
      g.lastDaily = today();
      g.dailyCount = (g.dailyCount || 0) + 1;
      awardXP(XP.daily_challenge, '+25 XP — Daily Challenge!');
      saveG();
      checkAchievements();
      updateGamifyBar();
    } else {
      document.getElementById('dcExplain').style.display = 'block';
    }
  }

  // ── LEADERBOARD ───────────────────────────────────
  function openLeaderboard() {
    const modal = document.getElementById('gModal');
    const rep = getRepData();
    const myName = rep.repName || 'You';
    const myXP = g.xp;
    const myModules = Object.keys(rep.completed || {}).length;
    const myStreak = g.streak;
    const myCert = !!rep.certified;
    const allReps = [
      ...DEMO_REPS,
      { name: myName + ' ★', xp: myXP, modules: myModules, streak: myStreak, certified: myCert, isMe: true }
    ].sort((a, b) => b.xp - a.xp);

    let rows = '';
    allReps.forEach((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1);
      rows += `
        <div class="lb-row ${r.isMe ? 'lb-me' : ''}">
          <div class="lb-rank">${medal}</div>
          <div class="lb-info">
            <div class="lb-name">${r.name} ${r.certified ? '🏆' : ''}</div>
            <div class="lb-stats">${r.modules}/8 modules · ${r.streak}d streak</div>
          </div>
          <div class="lb-xp">${r.xp.toLocaleString()} XP</div>
        </div>`;
    });
    modal.innerHTML = `
      <div class="gm-header">
        <div class="gm-title">🏅 Team Leaderboard</div>
        <div class="gm-sub">Ranked by total XP</div>
      </div>
      <div class="lb-list">${rows}</div>
      <button class="gm-btn" onclick="window.SFGamify.closeModal()" style="margin-top:14px;">Close</button>`;
    openModal();
  }

  // ── ACHIEVEMENTS ──────────────────────────────────
  function openAchievements() {
    const modal = document.getElementById('gModal');
    let cards = '';
    ACHIEVEMENTS.forEach(a => {
      const earned = g.achievements.includes(a.id);
      cards += `
        <div class="ach-card ${earned ? 'earned' : 'locked'}">
          <div class="ach-icon">${earned ? a.icon : '🔒'}</div>
          <div class="ach-info">
            <div class="ach-name">${earned ? a.name : '???'}</div>
            <div class="ach-desc">${earned ? a.desc : 'Keep going to unlock'}</div>
          </div>
          ${a.xp > 0 && earned ? `<div class="ach-xp">+${a.xp} XP</div>` : ''}
        </div>`;
    });
    modal.innerHTML = `
      <div class="gm-header">
        <div class="gm-title">🎖️ Achievements</div>
        <div class="gm-sub">${g.achievements.length} of ${ACHIEVEMENTS.length} unlocked</div>
      </div>
      <div class="ach-grid">${cards}</div>
      <button class="gm-btn" onclick="window.SFGamify.closeModal()" style="margin-top:14px;">Close</button>`;
    openModal();
  }

  // ── ACHIEVEMENT TOAST ─────────────────────────────
  function showAchievementToast(a) {
    const el = document.createElement('div');
    el.className = 'ach-toast';
    el.innerHTML = `<div class="ach-toast-icon">${a.icon}</div><div><div class="ach-toast-title">Achievement Unlocked!</div><div class="ach-toast-name">${a.name}</div></div>`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 4000);
  }

  // ── MODAL HELPERS ─────────────────────────────────
  function openModal() { document.getElementById('gOverlay').classList.add('open'); }
  function closeModal() { document.getElementById('gOverlay').classList.remove('open'); }

  // ── UI INJECTION ─────────────────────────────────
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      @keyframes xpFloat { from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(-60px)} }
      @keyframes achSlide { from{opacity:0;transform:translateX(120%)} to{opacity:1;transform:translateX(0)} }
      @keyframes gPop { from{opacity:0;transform:scale(.85) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }

      /* ── GAMIFY BAR ── */
      .gbar {
        background:var(--surface-1);
        border-bottom:1px solid var(--border);
        padding:6px 10px;
        display:flex;
        align-items:center;
        gap:6px;
        flex-shrink:0;
        flex-wrap:wrap;
        overflow-x:visible;
      }
      .gbar-stat {
        display:flex;
        align-items:center;
        gap:5px;
        font-size:11px;
        font-weight:700;
        color:var(--text-secondary);
        white-space:nowrap;
        flex-shrink:0;
      }
      .gbar-stat span {
        color:var(--accent);
        font-size:13px;
        font-weight:900;
      }
      .gbar-divider {
        width:1px;
        height:16px;
        background:var(--border);
        flex-shrink:0;
      }
      .gbar-btn {
        flex-shrink:0;
        padding:5px 12px;
        background:rgba(107,142,35,0.15);
        border:1.5px solid rgba(107,142,35,0.3);
        border-radius:20px;
        color:var(--primary-light);
        font-size:11px;
        font-weight:700;
        cursor:pointer;
        font-family:var(--font);
        text-transform:uppercase;
        letter-spacing:.5px;
        transition:all .2s;
        white-space:nowrap;
      }
      .gbar-btn:hover{background:rgba(107,142,35,0.25);border-color:var(--primary-light);}
      .gbar-btn.hot{border-color:var(--accent);color:var(--accent);background:rgba(201,168,118,0.1);}

      /* ── GAMIFY OVERLAY ── */
      .g-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:800;display:none;align-items:flex-end;justify-content:center;padding:0;}
      .g-overlay.open{display:flex;}
      .g-modal{
        background:linear-gradient(135deg,var(--surface-2),var(--surface-3));
        border:1.5px solid var(--border);
        border-radius:20px 20px 0 0;
        width:100%;
        max-width:480px;
        max-height:85vh;
        overflow-y:auto;
        padding:28px 20px 32px;
        animation:gPop .35s cubic-bezier(.34,1.56,.64,1);
      }
      .gm-header{text-align:center;margin-bottom:20px;}
      .gm-title{font-size:18px;font-weight:900;color:var(--text-primary);margin-bottom:4px;}
      .gm-sub{font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
      .gm-btn{width:100%;padding:13px;background:linear-gradient(135deg,var(--primary-light),var(--accent));border:none;border-radius:10px;color:var(--bg);font-weight:900;font-size:13px;cursor:pointer;font-family:var(--font);text-transform:uppercase;letter-spacing:.5px;}
      .gm-btn:hover{opacity:.9;}
      .gm-done-box{text-align:center;padding:28px;background:rgba(107,142,35,0.08);border:1.5px solid rgba(107,142,35,0.2);border-radius:12px;margin-bottom:16px;}
      .gm-q-text{font-size:15px;font-weight:700;color:var(--text-primary);margin-bottom:16px;line-height:1.6;}
      .gm-options{display:flex;flex-direction:column;gap:8px;margin-bottom:12px;}
      .gm-opt{padding:12px 14px;background:var(--surface-2);border:1.5px solid var(--border);border-radius:8px;color:var(--text-secondary);font-size:13px;cursor:pointer;font-family:var(--font);text-align:left;transition:all .2s;}
      .gm-opt:hover:not(:disabled){border-color:var(--accent);color:var(--accent);}
      .gm-opt.correct{background:rgba(107,142,35,0.2);border-color:var(--primary-light);color:var(--primary-light);}
      .gm-opt.wrong{background:rgba(224,112,112,0.15);border-color:#e07070;color:#e07070;}
      .gm-explain{font-size:12px;color:var(--text-secondary);padding:10px 12px;background:rgba(107,142,35,0.05);border-left:3px solid var(--accent);border-radius:4px;line-height:1.6;}

      /* ── LEADERBOARD ── */
      .lb-list{display:flex;flex-direction:column;gap:8px;}
      .lb-row{display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface-2);border:1.5px solid var(--border);border-radius:10px;}
      .lb-row.lb-me{border-color:var(--primary-light);background:rgba(107,142,35,0.1);}
      .lb-rank{font-size:18px;width:28px;text-align:center;flex-shrink:0;}
      .lb-info{flex:1;}
      .lb-name{font-size:13px;font-weight:700;color:var(--text-primary);}
      .lb-stats{font-size:11px;color:var(--text-muted);}
      .lb-xp{font-size:14px;font-weight:900;color:var(--accent);white-space:nowrap;}

      /* ── ACHIEVEMENTS ── */
      .ach-grid{display:flex;flex-direction:column;gap:8px;}
      .ach-card{display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface-2);}
      .ach-card.earned{border-color:rgba(107,142,35,0.4);background:rgba(107,142,35,0.08);}
      .ach-card.locked{opacity:.5;}
      .ach-icon{font-size:24px;flex-shrink:0;width:32px;text-align:center;}
      .ach-info{flex:1;}
      .ach-name{font-size:13px;font-weight:700;color:var(--text-primary);}
      .ach-desc{font-size:11px;color:var(--text-secondary);}
      .ach-xp{font-size:11px;font-weight:700;color:var(--accent);white-space:nowrap;}

      /* ── ACHIEVEMENT TOAST ── */
      .ach-toast{position:fixed;bottom:80px;right:16px;background:linear-gradient(135deg,rgba(107,142,35,0.95),rgba(107,142,35,0.8));border:1.5px solid var(--primary-light);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;z-index:9998;transform:translateX(120%);transition:transform .4s cubic-bezier(.34,1.56,.64,1);box-shadow:0 8px 24px rgba(107,142,35,0.4);}
      .ach-toast.show{transform:translateX(0);}
      .ach-toast-icon{font-size:24px;}
      .ach-toast-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,0.7);}
      .ach-toast-name{font-size:13px;font-weight:900;color:#fff;}
    `;
    document.head.appendChild(s);
  }

  function injectGamifyBar() {
    const progWrap = document.querySelector('.prog-wrap');
    if (!progWrap) return;
    const bar = document.createElement('div');
    bar.className = 'gbar';
    bar.id = 'gamifyBar';
    progWrap.parentNode.insertBefore(bar, progWrap.nextSibling);
    updateGamifyBar();
  }

  function updateGamifyBar() {
    const bar = document.getElementById('gamifyBar');
    if (!bar) return;
    const streakFire = g.streak >= 3 ? '🔥' : '📅';
    const dailyDone = hasDoneToday();
    bar.innerHTML = `
      <div class="gbar-stat">⭐<span>${g.xp.toLocaleString()}</span></div>
      <div class="gbar-stat">${streakFire}<span>${g.streak}d</span></div>
      <div class="gbar-stat">🎖️<span>${g.achievements.length}/${ACHIEVEMENTS.length}</span></div>
      <button class="gbar-btn ${dailyDone ? '' : 'hot'}" onclick="window.SFGamify.openDaily()">
        ${dailyDone ? '✅ Done' : '⚡ Daily'}
      </button>
      <button class="gbar-btn" onclick="window.SFGamify.openLeaderboard()">🏅 Board</button>
      <button class="gbar-btn" onclick="window.SFGamify.openAchievements()">🎖️ Badges</button>
    `;
  }

  function injectModals() {
    const overlay = document.createElement('div');
    overlay.className = 'g-overlay';
    overlay.id = 'gOverlay';
    overlay.onclick = (e) => { if(e.target === overlay) closeModal(); };
    overlay.innerHTML = '<div class="g-modal" id="gModal"></div>';
    document.body.appendChild(overlay);
  }

  // ── INIT ─────────────────────────────────────────
  function init() {
    function waitForApp(cb, tries = 0) {
      if (typeof window.saveRep === 'function') { cb(); }
      else if (tries < 50) { setTimeout(() => waitForApp(cb, tries+1), 100); }
    }
    waitForApp(() => {
      updateStreak();
      injectStyles();
      injectGamifyBar();
      injectModals();
      hookApp();
      checkAchievements();
      // Auto-show daily challenge prompt if not done today
      if (!hasDoneToday()) {
        setTimeout(() => showToast('⚡', 'Daily Challenge ready!', 'Tap the bar above to earn 25 XP.'), 2000);
      }
    });
  }

  function showToast(icon, title, sub) {
    if (window.showToast) { window.showToast(icon, title, sub); return; }
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-body"><div class="toast-title">${title}</div><div class="toast-sub">${sub}</div></div>`;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // ── PUBLIC API ────────────────────────────────────
  window.SFGamify = {
    openDaily: openDailyChallenge,
    answerDaily,
    openLeaderboard,
    openAchievements,
    closeModal,
    getXP: () => g.xp,
    getStreak: () => g.streak,
  };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }

})();
