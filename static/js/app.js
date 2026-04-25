const scanHistory = [];

const TACTICS_INFO = {
  fear_appeal: { name: "Fear appeal", desc: "Exploits emotions of fear or anxiety to manipulate the audience into accepting a particular point of view.", example: '"Act now before it is too late — the threat is growing and you must be prepared."', severity: "high" },
  loaded_language: { name: "Loaded language", desc: "Uses emotionally charged words or phrases to influence the audience's perception, often without rational justification.", example: '"The radical regime of corrupt elites is destroying our nation."', severity: "high" },
  false_dichotomy: { name: "False dichotomy", desc: "Presents only two options as if they are the only possibilities, ignoring other alternatives.", example: '"You are either with us or against us — there is no middle ground."', severity: "medium" },
  bandwagon: { name: "Bandwagon", desc: "Encourages people to follow what everyone else is allegedly doing, implying you will be left out if you don't.", example: '"Millions of people are waking up to this truth — don\'t be the last to know."', severity: "medium" },
  appeal_to_authority: { name: "Appeal to authority", desc: "Uses vague or unnamed experts to lend false credibility to a claim without verifiable evidence.", example: '"Top scientists say this treatment is being suppressed by pharmaceutical companies."', severity: "medium" },
  scapegoating: { name: "Scapegoating", desc: "Blames a group or entity for complex societal problems to divert attention and create an out-group.", example: '"Immigrants are responsible for the economic crisis that is affecting your family."', severity: "high" },
  repetition: { name: "Repetition", desc: "Repeats a message or slogan frequently to make it seem more credible or accepted, regardless of its truth.", example: '"Fake news, fake news. The mainstream media is always fake news."', severity: "low" },
  black_white: { name: "Black & white thinking", desc: "Presents situations in absolute terms, eliminating nuance and complexity from an issue.", example: '"This policy has completely failed — every single measure has been a total disaster."', severity: "medium" },
  glittering_generality: { name: "Glittering generality", desc: "Uses vague, emotionally appealing words associated with highly valued concepts to gain approval without specifics.", example: '"This movement is about freedom, truth, and protecting the real people of this nation."', severity: "low" },
};

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 3000);
}

function setView(name) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  const el = document.getElementById('view-' + name);
  if (el) { el.style.display = ''; }
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === name);
  });
  if (name === 'history') renderHistory();
  if (name === 'tactics') renderTacticsGuide();
  document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    setView(item.dataset.view);
  });
});

async function handleTopbarSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('topbar-input').value.trim();
  if (!input) return showToast('Please enter a URL or article text first');
  await runAnalysis(input);
}

async function runSample(text) {
  document.getElementById('topbar-input').value = text;
  await runAnalysis(text);
}

async function runAnalysis(input) {
  setView('dashboard');
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('results-grid').style.display = 'none';

  const mainContent = document.getElementById('view-dashboard');
  let overlay = document.getElementById('scanning-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'scanning-overlay';
    overlay.className = 'scanning-overlay';
    overlay.innerHTML = `<div class="scanning-title">Analysing content...</div>
      <div class="scanning-sub">Running NLP analysis, OSINT checks and propaganda detection</div>
      <div class="scanning-dots"><div class="scanning-dot"></div><div class="scanning-dot"></div><div class="scanning-dot"></div></div>`;
    mainContent.appendChild(overlay);
  }
  overlay.style.display = '';

  const btn = document.getElementById('topbar-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loader').style.display = '';

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input })
    });
    const data = await res.json();
    if (data.error) { showToast(data.error); return; }

    scanHistory.unshift(data);
    document.getElementById('history-count').textContent = scanHistory.length;
    updateRecentSidebar();
    renderResults(data);
  } catch(err) {
    showToast('Analysis failed — is the server running?');
    document.getElementById('empty-state').style.display = '';
  } finally {
    overlay.style.display = 'none';
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = '';
    btn.querySelector('.btn-loader').style.display = 'none';
  }
}

function renderResults(data) {
  const { scores, domain_analysis, text_analysis } = data;
  const fp = scores.fake_probability;
  const risk = scores.risk_level;
  const colorClass = risk === 'critical' || risk === 'high' ? 'red' : risk === 'medium' ? 'yellow' : 'green';

  // Metrics
  const mc = document.getElementById('mc-credibility');
  mc.querySelector('.metric-value').textContent = scores.credibility_score;
  mc.querySelector('.metric-value').className = `metric-value ${colorClass}`;
  mc.querySelector('.metric-sub').textContent = risk === 'low' ? 'Likely credible' : risk === 'medium' ? 'Possibly misleading' : 'Likely unreliable';

  const mp = document.getElementById('mc-propaganda');
  const tacticCount = text_analysis ? text_analysis.tactics.length : 0;
  mp.querySelector('.metric-value').textContent = tacticCount;
  mp.querySelector('.metric-value').className = `metric-value ${tacticCount >= 4 ? 'red' : tacticCount >= 2 ? 'yellow' : 'green'}`;
  mp.querySelector('.metric-sub').textContent = `Tactic${tacticCount === 1 ? '' : 's'} detected`;

  const md = document.getElementById('mc-domain');
  const age = domain_analysis.age || 'Unknown';
  md.querySelector('.metric-value').textContent = age;
  md.querySelector('.metric-value').className = `metric-value ${domain_analysis.age_days && domain_analysis.age_days < 180 ? 'red' : 'green'}`;
  md.querySelector('.metric-sub').textContent = data.domain || 'No domain found';

  const mr = document.getElementById('mc-risk');
  mr.querySelector('.metric-value').textContent = risk.charAt(0).toUpperCase() + risk.slice(1);
  mr.querySelector('.metric-value').className = `metric-value ${colorClass}`;
  mr.querySelector('.metric-sub').textContent = 'Overall classification';

  // Big score
  document.getElementById('big-score').textContent = fp + '%';
  document.getElementById('big-score').className = `big-score ${colorClass}`;

  const fill = document.getElementById('score-bar-fill');
  fill.style.width = '0%';
  fill.className = `score-bar-fill ${colorClass}`;
  setTimeout(() => { fill.style.width = fp + '%'; }, 50);

  // Risk tag
  const tag = document.getElementById('risk-tag');
  tag.textContent = risk;
  tag.className = `panel-tag ${risk}`;

  // Signals
  const signals = text_analysis ? text_analysis.signals : {};
  const signalList = document.getElementById('signal-list');
  const signalDefs = [
    { key: 'sentiment_bias', name: 'Sentiment bias' },
    { key: 'linguistic_manipulation', name: 'Linguistic manipulation' },
    { key: 'claim_verifiability', name: 'Claim verifiability' },
    { key: null, name: 'Source credibility', val: scores.source_credibility },
    { key: null, name: 'Cross-source agreement', val: scores.cross_source_agreement },
  ];
  signalList.innerHTML = signalDefs.map(s => {
    const v = s.key ? (signals[s.key] || 0) : (s.val || 0);
    const pct = Math.round(v * 100);
    const col = pct > 60 ? 'var(--accent-red)' : pct > 35 ? 'var(--accent-yellow)' : 'var(--accent-green)';
    return `<div class="signal-row">
      <span class="signal-name">${s.name}</span>
      <div class="signal-bar-wrap"><div class="signal-bar" style="width:0%;background:${col}" data-target="${pct}"></div></div>
      <span class="signal-val" style="color:${col}">${v.toFixed(2)}</span>
    </div>`;
  }).join('');
  setTimeout(() => {
    signalList.querySelectorAll('.signal-bar').forEach(b => {
      b.style.width = b.dataset.target + '%';
    });
  }, 100);

  // Tactics
  const tacticsGrid = document.getElementById('tactics-grid');
  const tactics = text_analysis ? text_analysis.tactics : [];
  if (tactics.length === 0) {
    tacticsGrid.innerHTML = '<div class="no-result-hint">No propaganda tactics detected in this content</div>';
  } else {
    tacticsGrid.innerHTML = tactics.map((t, i) =>
      `<div class="tactic-tag" style="animation-delay:${i * 0.06}s">
        <div class="tactic-dot ${t.severity}"></div>
        ${t.name}
      </div>`
    ).join('');
  }

  // OSINT
  const osintTable = document.getElementById('osint-table');
  const flags = domain_analysis.flags || [];
  const rows = [
    { key: 'Domain', val: data.domain || 'Not detected', cls: data.domain ? 'neutral' : 'warn' },
    { key: 'Registered', val: domain_analysis.age || 'Unknown', cls: domain_analysis.age_days && domain_analysis.age_days < 60 ? 'bad' : domain_analysis.age_days && domain_analysis.age_days < 365 ? 'warn' : 'good' },
    { key: 'Registrar country', val: domain_analysis.registrar_country, cls: ['Panama','Seychelles','Cyprus'].includes(domain_analysis.registrar_country) ? 'bad' : 'neutral' },
    { key: 'Fact-check database', val: domain_analysis.in_factcheck_db ? 'Listed' : 'Not listed', cls: domain_analysis.in_factcheck_db ? 'good' : 'bad' },
    { key: 'Domain credibility', val: domain_analysis.score + '/100', cls: domain_analysis.score > 75 ? 'good' : domain_analysis.score > 50 ? 'warn' : 'bad' },
    { key: 'Suspicious flags', val: flags.length === 0 ? 'None' : flags.length + ' detected', cls: flags.length === 0 ? 'good' : 'bad' },
  ];
  osintTable.innerHTML = rows.map(r =>
    `<div class="osint-row"><span class="osint-key">${r.key}</span><span class="osint-val ${r.cls}">${r.val}</span></div>`
  ).join('');

  // Last scan label
  document.getElementById('last-scan-label').textContent = `Last scan: ${data.input} — just now`;

  document.getElementById('results-grid').style.display = '';
  document.getElementById('empty-state').style.display = 'none';
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (scanHistory.length === 0) {
    list.innerHTML = '<div class="history-empty">No scans yet — run your first analysis from the dashboard.</div>';
    return;
  }
  list.innerHTML = scanHistory.map((item, i) => {
    const risk = item.scores.risk_level;
    const fp = item.scores.fake_probability;
    const ts = new Date(item.timestamp);
    const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `<div class="history-item" onclick="restoreResult(${i})">
      <div class="history-risk-bar ${risk}"></div>
      <div class="history-info">
        <div class="history-input">${item.input}</div>
        <div class="history-meta">${item.domain || 'Text input'} · ${timeStr} · ${item.text_analysis ? item.text_analysis.tactics.length : 0} tactic(s) detected</div>
      </div>
      <div class="history-score ${risk}">${fp}%</div>
    </div>`;
  }).join('');
}

function restoreResult(index) {
  const data = scanHistory[index];
  if (!data) return;
  setView('dashboard');
  document.getElementById('empty-state').style.display = 'none';
  renderResults(data);
}

function renderTacticsGuide() {
  const guide = document.getElementById('tactics-guide');
  guide.innerHTML = Object.entries(TACTICS_INFO).map(([key, t]) => `
    <div class="tactic-card">
      <div class="tactic-card-head">
        <div class="tactic-card-dot ${t.severity}"></div>
        <span class="tactic-card-name">${t.name}</span>
        <span class="tactic-card-sev">${t.severity}</span>
      </div>
      <div class="tactic-card-desc">${t.desc}</div>
      <div class="tactic-card-example">${t.example}</div>
    </div>
  `).join('');
}

function updateRecentSidebar() {
  const list = document.getElementById('recent-scans-list');
  const recent = scanHistory.slice(0, 4);
  list.innerHTML = recent.map((item, i) => {
    const risk = item.scores.risk_level;
    return `<div class="recent-item" onclick="restoreResult(${i})">
      <div class="recent-item-title">${item.input}</div>
      <div class="recent-item-meta">${item.domain || 'text'} · ${risk} risk</div>
    </div>`;
  }).join('');
}

async function handleDomainLookup(e) {
  e.preventDefault();
  const domain = document.getElementById('domain-input').value.trim().replace(/^https?:\/\//, '').replace(/\/.*/, '').toLowerCase();
  if (!domain) return;

  const resultEl = document.getElementById('domain-result');
  resultEl.innerHTML = '<div class="scanning-overlay"><div class="scanning-dots"><div class="scanning-dot"></div><div class="scanning-dot"></div><div class="scanning-dot"></div></div></div>';

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'https://' + domain })
    });
    const data = await res.json();
    const da = data.domain_analysis;
    const score = da.score;
    const col = score > 75 ? 'green' : score > 50 ? 'yellow' : 'red';
    const verdict = score > 75 ? 'Generally credible source' : score > 50 ? 'Mixed credibility — verify claims' : 'Low credibility — treat with caution';

    resultEl.innerHTML = `<div class="domain-result-card">
      <div class="domain-result-header">
        <div class="domain-score-circle ${col}">${score}</div>
        <div>
          <div class="domain-name">${data.domain || domain}</div>
          <div class="domain-verdict">${verdict}</div>
        </div>
      </div>
      <div class="osint-table">
        ${[
          { key: 'Domain age', val: da.age || 'Unknown', cls: da.age_days && da.age_days < 180 ? 'bad' : 'good' },
          { key: 'Registrar country', val: da.registrar_country, cls: ['Panama','Seychelles','Cyprus'].includes(da.registrar_country) ? 'bad' : 'neutral' },
          { key: 'Fact-check database', val: da.in_factcheck_db ? 'Listed' : 'Not listed', cls: da.in_factcheck_db ? 'good' : 'bad' },
          { key: 'Suspicious flags', val: da.flags.length === 0 ? 'None' : da.flags.join(', '), cls: da.flags.length === 0 ? 'good' : 'bad' },
        ].map(r => `<div class="osint-row"><span class="osint-key">${r.key}</span><span class="osint-val ${r.cls}">${r.val}</span></div>`).join('')}
      </div>
    </div>`;
  } catch {
    resultEl.innerHTML = '<div class="history-empty">Lookup failed.</div>';
  }
}

(async () => {
  try {
    const res = await fetch('/api/history');
    const items = await res.json();
    items.forEach(item => {
      scanHistory.push({
        input: item.input,
        domain: item.domain,
        scores: { fake_probability: item.fake_probability, risk_level: item.risk_level, credibility_score: 100 - item.fake_probability, source_credibility: 0.5, cross_source_agreement: 0.5 },
        domain_analysis: { score: 50, age: '—', age_days: 365, registrar_country: 'Unknown', in_factcheck_db: false, flags: [] },
        text_analysis: { tactics: [], signals: { sentiment_bias: 0.3, linguistic_manipulation: 0.2, claim_verifiability: 0.2 }, word_count: 0 },
        timestamp: item.timestamp,
      });
    });
    document.getElementById('history-count').textContent = scanHistory.length;
    updateRecentSidebar();
  } catch(e) {}
})();
