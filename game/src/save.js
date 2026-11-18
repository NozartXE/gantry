// Saved harbour record: best score, the last three runs (wins and losses alike, kept truthful),
// unlocked feats and the three option sliders, all in localStorage behind a try/catch wrapper.
(function () {
  if (globalThis.GT_Save) return;

  const KEY = 'gantry.save.v1';
  const blank = () => ({
    best: 0,
    bestGrade: '',
    history: [],          // [{score, grade, result: 'CLEARED'|'HULL LOST'|'SAILED SHORT', ship, difficulty}]
    feats: {},            // feat id -> true
    trials: {},           // trial id -> best medal ('BRONZE'|'SILVER'|'GOLD')
    wins: 0,
    runs: 0,
    settings: { music: 0.7, sfx: 0.8, shake: 0.5 },
    endlessUnlocked: false,
  });

  let data = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { data = blank(); }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode: play on */ }
  }

  globalThis.GT_Save = {
    get: () => data,
    recordRun(entry) {
      data.runs += 1;
      if (entry.result === 'CLEARED') data.wins += 1;
      data.history.unshift(entry);
      data.history = data.history.slice(0, 3);
      if (entry.score > data.best) { data.best = entry.score; data.bestGrade = entry.grade; }
      if (entry.result === 'CLEARED') data.endlessUnlocked = true;
      persist();
    },
    unlockFeat(id) {
      if (!data.feats[id]) { data.feats[id] = true; persist(); return true; }
      return false;
    },
    // A finished trial keeps its best medal; a lesser medal never overwrites a better one.
    recordTrial(id, medal) {
      if (!medal) return;
      const rank = { BRONZE: 1, SILVER: 2, GOLD: 3 };
      if (!data.trials) data.trials = {};
      if (!data.trials[id] || rank[medal] > rank[data.trials[id]]) {
        data.trials[id] = medal;
        persist();
      }
    },
    setSetting(k, v) { data.settings[k] = v; persist(); },
    // Screenshot staging only: seed a truthful-looking record for the title/results frames.
    stageRecord(record) { data = Object.assign(blank(), record); },
  };
})();
