// ═══════════════════════════════════════════════════
// SALESFLOW — STAGE MILESTONE TIMER v1.0
// Drop-in module for index.html
//
// HOW TO INSTALL:
// 1. Add this line to index.html right before </body>:
//    <script src="stage-timer.js"></script>
//
// 2. Add this CSS block inside your <style> tag
//    (search for "/* ── NAV BAR ── */" and paste above it):
//
//    /* ── STAGE TIMER ── */
//    (see STYLES section at bottom of this file)
//
// That's it. The module hooks into your existing
// STAGES array, currentStage variable, and goScreen()
// function automatically.
// ═══════════════════════════════════════════════════

(function SalesFlowStageTimer() {

  // ── CONFIG ──────────────────────────────────────
  // Target seconds per stage — edit freely
  const STAGE_TARGETS = {
    opening:     90,   // 1m 30s
    discovery:   120,  // 2m
    implication: 90,   // 1m 30s
    pitch:       120,  // 2m
    close:       180,  // 3m
    confirm:     120,  // 2m
  };

  // How long over target before nudge fires (seconds)
  const NUDGE_THRESHOLD = 15;

  // Colors
  const COLOR_OK      = 'var(--green-l)';
  const COLOR_WARN    = '#d4a847';
  const COLOR_OVER    = '#e07070';

  // ── STATE ────────────────────────────────────────
  let stageTimers   = {};   // { stageId: { start, elapsed, warned } }
  let stageOrder    = [];   // ordered list of stage IDs from STAGES array
  let activeStageId = null;
  let tickInterval  = null;
  let summaryData   = {};   // { stageId: totalSeconds }
  let callActive    = false;

  // ── INIT ─────────────────────────────────────────
  function init() {
    waitForGlobals(() => {
      stageOrder = STAGES.map(s => s.id);
      injectUI();
      hookIntoApp();
    });
  }

  function waitForGlobals(cb, attempts = 0) {
    if (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') {
      cb();
    } else if (attempts < 60) {
      setTimeout(() => waitForGlobals(cb, attempts + 1), 100);
    }
  }

  // ── UI INJECTION ─────────────────────────────────
  function injectUI() {
    injectStyles();
    injectMilestoneBar();
    injectToastContainer();
    injectSummaryModal();
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ── MILESTONE BAR ── */
      .milestone-bar {
        display: flex;
        gap: 3px;
        padding: 8px 18px 0;
        background: var(--s1);
        flex-shrink: 0;
      }
      .ms-stage {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .ms-track {
        height: 3px;
        background: var(--s3);
        border-radius: 2px;
        overflow: hidden;
      }
      .ms-fill {
        height: 100%;
        border-radius: 2px;
        transition: width 1s linear, background 0.5s;
        width: 0%;
      }
      .ms-label {
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: var(--t3);
        text-align: center;
        transition: color 0.3s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ms-stage.active .ms-label { color: var(--t2); }
      .ms-stage.warn   .ms-label { color: var(--gold); }
      .ms-stage.over   .ms-label { color: #e07070; }

      /* ── STAGE CLOCK on call top ── */
      .stage-clock {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 1px;
      }
      .stage-clock-label {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: var(--t3);
        font-weight: 700;
      }
      .stage-clock-val {
        font-size: 13px;
        font-weight: 700;
        font-family: var(--mono);
        color: var(--green-l);
        transition: color 0.3s;
      }

      /* ── STAGE HERO TIMER ── */
      .stage-time-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(107,142,35,0.1);
        border: 1px solid rgba(107,142,35,0.2);
        border-radius: 20px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
        color: var(--green-l);
        font-family: var(--mono);
        margin-top: 8px;
        transition: all 0.3s;
      }
      .stage-time-badge.warn {
        background: rgba(212,168,71,0.1);
        border-color: rgba(212,168,71,0.3);
        color: var(--gold);
      }
      .stage-time-badge.over {
        background: rgba(224,112,112,0.1);
        border-color: rgba(224,112,112,0.3);
        color: #e07070;
        animation: badgePulse 1s ease-in-out infinite;
      }
      @keyframes badgePulse {
        0%,100% { box-shadow: none; }
        50% { box-shadow: 0 0 10px rgba(224,112,112,0.3); }
      }

      /* ── TOAST ── */
      .sm-toast-wrap {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        width: calc(100% - 48px);
        max-width: 380px;
      }
      .sm-toast {
        background: var(--s3);
        border: 1px solid var(--bd2);
        border-left: 3px solid var(--gold);
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: toastIn .3s cubic-bezier(.34,1.56,.64,1) both;
        pointer-events: all;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      }
      .sm-toast.over { border-left-color: #e07070; }
      @keyframes toastIn {
        from { opacity: 0; transform: translateY(-12px) scale(.95); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to   { opacity: 0; transform: translateY(-8px) scale(.95); }
      }
      .sm-toast-icon { font-size: 18px; flex-shrink: 0; }
      .sm-toast-body { flex: 1; }
      .sm-toast-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--t1);
        margin-bottom: 1px;
      }
      .sm-toast-sub {
        font-size: 11px;
        color: var(--t2);
        line-height: 1.4;
      }
      .sm-toast-dismiss {
        font-size: 18px;
        color: var(--t3);
        cursor: pointer;
        background: none;
        border: none;
        font-weight: 300;
        padding: 0 2px;
        flex-shrink: 0;
      }

      /* ── SUMMARY MODAL ── */
      #smSummaryModal .modal {
        border-top-color: var(--green);
        max-height: 85vh;
      }
      .sm-summary-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--bd);
      }
      .sm-summary-row:last-child { border-bottom: none; }
      .sm-sr-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--t1);
        width: 90px;
        flex-shrink: 0;
      }
      .sm-sr-bar-wrap {
        flex: 1;
        height: 8px;
        background: var(--s3);
        border-radius: 4px;
        overflow: hidden;
      }
      .sm-sr-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.6s ease;
      }
      .sm-sr-time {
        font-size: 12px;
        font-weight: 700;
        font-family: var(--mono);
        width: 44px;
        text-align: right;
        flex-shrink: 0;
      }
      .sm-sr-status {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .06em;
        width: 36px;
        text-align: right;
        flex-shrink: 0;
      }
      .sm-sr-status.ok   { color: var(--green-l); }
      .sm-sr-status.warn { color: var(--gold); }
      .sm-sr-status.over { color: #e07070; }
      .sm-insight {
        background: rgba(107,142,35,0.06);
        border: 1px solid rgba(107,142,35,0.15);
        border-radius: var(--rads);
        padding: 12px 14px;
        margin-top: 14px;
      }
      .sm-insight-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: var(--green-l);
        margin-bottom: 6px;
      }
      .sm-insight-text {
        font-size: 12px;
        color: var(--t2);
        line-height: 1.6;
      }
      .sm-insight-text strong { color: var(--t1); }
    `;
    document.head.appendChild(style);
  }

  function injectMilestoneBar() {
    // Insert milestone bar into call screen, after stage-bar
    const stageBar = document.getElementById('stageBar');
    if (!stageBar) return;

    const bar = document.createElement('div');
    bar.className = 'milestone-bar';
    bar.id = 'milestoneBar';
    stageBar.parentNode.insertBefore(bar, stageBar.nextSibling);
    renderMilestoneBar();
  }

  function renderMilestoneBar() {
    const bar = document.getElementById('milestoneBar');
    if (!bar || !stageOrder.length) return;

    bar.innerHTML = stageOrder.map(id => {
      const stage = STAGES.find(s => s.id === id);
      return `
        <div class="ms-stage" id="ms-${id}">
          <div class="ms-track">
            <div class="ms-fill" id="msf-${id}"></div>
          </div>
          <div class="ms-label">${stage ? stage.short : id}</div>
        </div>`;
    }).join('');
  }

  function injectToastContainer() {
    const wrap = document.createElement('div');
    wrap.className = 'sm-toast-wrap';
    wrap.id = 'smToastWrap';
    document.body.appendChild(wrap);
  }

  function injectSummaryModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'smSummaryModal';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div class="modal" style="border-top-color:var(--green);">
        <div class="modal-title">
          <span>📊 Call Breakdown</span>
          <span class="modal-close" onclick="window.SMTimer.closeSummary()">×</span>
        </div>
        <div id="smSummaryContent"></div>
      </div>`;
    document.body.appendChild(overlay);
  }

  // Inject stage clock into call-top area
  function injectStageClock() {
    const timerWrap = document.querySelector('.call-timer-wrap');
    if (!timerWrap || document.getElementById('stageClock')) return;

    const clock = document.createElement('div');
    clock.className = 'stage-clock';
    clock.id = 'stageClock';
    clock.innerHTML = `
      <div class="stage-clock-label">Stage</div>
      <div class="stage-clock-val" id="stageClockVal">0:00</div>`;
    timerWrap.parentNode.insertBefore(clock, timerWrap);
  }

  // Inject time badge into stage hero
  function injectStageBadge() {
    const hero = document.querySelector('.stage-hero');
    if (!hero || hero.querySelector('.stage-time-badge')) return;

    const badge = document.createElement('div');
    badge.className = 'stage-time-badge';
    badge.id = 'stageTimeBadge';
    badge.innerHTML = `⏱ 0:00 <span id="stageBadgeTarget" style="opacity:.5;font-size:10px;"></span>`;
    hero.appendChild(badge);
  }

  // ── HOOK INTO APP ────────────────────────────────
  function hookIntoApp() {
    // Patch goScreen to detect call start/end
    const _origGoScreen = window.goScreen;
    window.goScreen = function(id) {
      _origGoScreen(id);
      if (id === 'call') {
        startCallTimer();
      } else if (callActive) {
        pauseCallTimer();
        if (id === 'log') showSummaryAfterDelay();
      }
    };

    // Patch renderCallStage to update timer UI per stage
    const _origRenderCallStage = window.renderCallStage;
    window.renderCallStage = function() {
      _origRenderCallStage();
      // After DOM updates, inject badge and update display
      requestAnimationFrame(() => {
        injectStageClock();
        injectStageBadge();
        const stageId = STAGES[currentStage]?.id;
        if (stageId) switchStageTimer(stageId);
      });
    };

    // Patch nextStage to track transitions
    const _origNextStage = window.nextStage;
    window.nextStage = function() {
      recordStageTime();
      _origNextStage();
    };

    // Patch prevStage
    const _origPrevStage = window.prevStage;
    window.prevStage = function() {
      recordStageTime();
      _origPrevStage();
    };

    // Patch jumpStage
    const _origJumpStage = window.jumpStage;
    window.jumpStage = function(i) {
      recordStageTime();
      _origJumpStage(i);
    };
  }

  // ── TIMER LOGIC ──────────────────────────────────
  function startCallTimer() {
    callActive = true;
    stageTimers = {};
    summaryData = {};
    stageOrder.forEach(id => {
      stageTimers[id] = { elapsed: 0, warned: false };
      summaryData[id] = 0;
    });

    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(tick, 1000);

    const stageId = STAGES[currentStage]?.id;
    if (stageId) switchStageTimer(stageId);
  }

  function pauseCallTimer() {
    callActive = false;
    recordStageTime();
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  }

  function switchStageTimer(stageId) {
    // Save time on previous stage
    if (activeStageId && activeStageId !== stageId) {
      recordStageTime();
    }
    activeStageId = stageId;
    if (!stageTimers[stageId]) {
      stageTimers[stageId] = { elapsed: 0, warned: false };
    }
    stageTimers[stageId]._start = Date.now();
    updateBadge(stageId, stageTimers[stageId].elapsed);
  }

  function recordStageTime() {
    if (!activeStageId) return;
    const timer = stageTimers[activeStageId];
    if (!timer || !timer._start) return;
    const delta = Math.floor((Date.now() - timer._start) / 1000);
    timer.elapsed += delta;
    timer._start = null;
    summaryData[activeStageId] = timer.elapsed;
  }

  function tick() {
    if (!activeStageId || !callActive) return;

    const timer = stageTimers[activeStageId];
    if (!timer || !timer._start) return;

    const live = timer.elapsed + Math.floor((Date.now() - timer._start) / 1000);
    const target = STAGE_TARGETS[activeStageId] || 120;

    // Update stage clock
    const clockEl = document.getElementById('stageClockVal');
    if (clockEl) {
      clockEl.textContent = formatTime(live);
      clockEl.style.color = live < target ? COLOR_OK : live < target + NUDGE_THRESHOLD ? COLOR_WARN : COLOR_OVER;
    }

    // Update badge
    updateBadge(activeStageId, live);

    // Update milestone bar fill for active stage
    updateMilestoneBar(activeStageId, live, target);

    // Nudge logic
    if (!timer.warned && live >= target + NUDGE_THRESHOLD) {
      timer.warned = true;
      fireNudge(activeStageId, live, target);
    }
  }

  function updateBadge(stageId, elapsed) {
    const badge = document.getElementById('stageTimeBadge');
    if (!badge) return;
    const target = STAGE_TARGETS[stageId] || 120;
    const over = elapsed > target;
    const warn = elapsed > target - 15 && !over;

    badge.className = 'stage-time-badge' + (over ? ' over' : warn ? ' warn' : '');
    badge.innerHTML = `⏱ ${formatTime(elapsed)} <span style="opacity:.5;font-size:10px;">/ ${formatTime(target)}</span>`;

    // Update target text
    const targetEl = document.getElementById('stageBadgeTarget');
    if (targetEl) targetEl.textContent = `/ ${formatTime(target)}`;
  }

  function updateMilestoneBar(stageId, elapsed, target) {
    const fill = document.getElementById('msf-' + stageId);
    const stage = document.getElementById('ms-' + stageId);
    if (!fill || !stage) return;

    const pct = Math.min(100, Math.round((elapsed / target) * 100));
    const over = elapsed > target + NUDGE_THRESHOLD;
    const warn = elapsed > target - 10 && !over;

    fill.style.width = pct + '%';
    fill.style.background = over ? COLOR_OVER : warn ? COLOR_WARN : COLOR_OK;

    stage.className = 'ms-stage active' + (over ? ' over' : warn ? ' warn' : '');
  }

  // ── NUDGE TOAST ──────────────────────────────────
  function fireNudge(stageId, elapsed, target) {
    const stage = STAGES.find(s => s.id === stageId);
    const nextIdx = STAGES.findIndex(s => s.id === stageId) + 1;
    const nextStage = STAGES[nextIdx];

    const over = elapsed - target;
    const isOver = over > 0;
    const icon = isOver ? '⚡' : '⏰';

    const title = isOver
      ? `${stage?.name || stageId} running long`
      : `${stage?.name || stageId} target reached`;

    const sub = nextStage
      ? `${formatTime(elapsed)} in — ready to move to ${nextStage.name}?`
      : `${formatTime(elapsed)} in — time to wrap up and close.`;

    showToast(icon, title, sub, isOver ? 'over' : 'warn');
  }

  function showToast(icon, title, sub, type = 'warn') {
    const wrap = document.getElementById('smToastWrap');
    if (!wrap) return;

    const toast = document.createElement('div');
    toast.className = `sm-toast ${type}`;
    const id = 'toast_' + Date.now();
    toast.id = id;
    toast.innerHTML = `
      <div class="sm-toast-icon">${icon}</div>
      <div class="sm-toast-body">
        <div class="sm-toast-title">${title}</div>
        <div class="sm-toast-sub">${sub}</div>
      </div>
      <button class="sm-toast-dismiss" onclick="document.getElementById('${id}')?.remove()">×</button>`;

    wrap.appendChild(toast);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (document.getElementById(id)) {
        toast.style.animation = 'toastOut .25s ease both';
        setTimeout(() => toast.remove(), 250);
      }
    }, 5000);
  }

  // ── CALL SUMMARY ─────────────────────────────────
  function showSummaryAfterDelay() {
    setTimeout(() => {
      if (Object.values(summaryData).some(v => v > 0)) {
        openSummary();
      }
    }, 800);
  }

  function openSummary() {
    const content = document.getElementById('smSummaryContent');
    if (!content) return;

    // Build summary
    const totalTime = Object.values(summaryData).reduce((a, b) => a + b, 0);
    const maxTime = Math.max(...Object.values(summaryData), 1);

    let rowsHTML = stageOrder.map(id => {
      const stage = STAGES.find(s => s.id === id);
      const elapsed = summaryData[id] || 0;
      if (elapsed === 0) return '';

      const target = STAGE_TARGETS[id] || 120;
      const pct = Math.min(100, Math.round((elapsed / maxTime) * 100));
      const isOver = elapsed > target + NUDGE_THRESHOLD;
      const isWarn = elapsed > target && !isOver;
      const color = isOver ? '#e07070' : isWarn ? 'var(--gold)' : 'var(--green-l)';
      const status = isOver ? 'over' : isWarn ? 'warn' : 'ok';
      const statusLabel = isOver ? 'Long' : isWarn ? 'OK' : '✓';

      return `
        <div class="sm-summary-row">
          <div class="sm-sr-name">${stage?.name || id}</div>
          <div class="sm-sr-bar-wrap">
            <div class="sm-sr-bar" style="width:${pct}%;background:${color};"></div>
          </div>
          <div class="sm-sr-time" style="color:${color};">${formatTime(elapsed)}</div>
          <div class="sm-sr-status ${status}">${statusLabel}</div>
        </div>`;
    }).join('');

    // Generate insight
    const insight = generateInsight(summaryData);

    content.innerHTML = `
      <div style="font-size:11px;color:var(--t3);margin-bottom:14px;font-family:var(--mono);">
        Total call time: ${formatTime(totalTime)}
      </div>
      ${rowsHTML}
      ${insight ? `
        <div class="sm-insight">
          <div class="sm-insight-label">Self-coaching insight</div>
          <div class="sm-insight-text">${insight}</div>
        </div>` : ''}
      <button class="btn-primary" style="width:100%;margin-top:16px;" onclick="window.SMTimer.closeSummary()">
        Got it — log the call
      </button>`;

    document.getElementById('smSummaryModal').style.display = 'flex';
  }

  function generateInsight(data) {
    const slowest = Object.entries(data)
      .filter(([id, t]) => t > (STAGE_TARGETS[id] || 120) + 30)
      .sort((a, b) => {
        const aOver = a[1] - (STAGE_TARGETS[a[0]] || 120);
        const bOver = b[1] - (STAGE_TARGETS[b[0]] || 120);
        return bOver - aOver;
      })[0];

    const fastest = Object.entries(data)
      .filter(([id, t]) => t > 0 && t < (STAGE_TARGETS[id] || 120) * 0.5)
      .sort((a, b) => a[1] - b[1])[0];

    const stageInsights = {
      opening:     'Opening ran long — reps who talk too long here lose control of the call. One question, then stop.',
      discovery:   'Discovery ran long — this means you found pain. Good. But make sure you bridged to implication.',
      implication: 'Implication ran long — let the cost of waiting land faster. Ask one question and let silence do the work.',
      pitch:       'Pitch ran long — lead with ONE program, not all of them. Get the small yes first.',
      close:       'Close ran long — this usually means an objection surfaced. Did you identify the REAL one?',
      confirm:     'Confirm ran long — keep this tight. Payment, tech notes, recorded confirmation, referral. Done.',
    };

    if (slowest) {
      const [id] = slowest;
      const stage = STAGES.find(s => s.id === id);
      return stageInsights[id] || `<strong>${stage?.name}</strong> ran over target. Review that stage and tighten up.`;
    }

    if (fastest) {
      const [id] = fastest;
      const stage = STAGES.find(s => s.id === id);
      return `<strong>${stage?.name}</strong> was very short — make sure you're not rushing through it. Every stage has a purpose.`;
    }

    return 'Nice pacing on this call. All stages within target. Keep it up.';
  }

  function closeSummary() {
    document.getElementById('smSummaryModal').style.display = 'none';
  }

  // ── HELPERS ──────────────────────────────────────
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── PUBLIC API ───────────────────────────────────
  window.SMTimer = {
    openSummary,
    closeSummary,
    getStageData: () => ({ ...summaryData }),
    resetTimer: startCallTimer,
  };

  // ── BOOT ─────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
