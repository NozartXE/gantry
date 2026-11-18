// GANTRY configuration: every tuning number, the design tokens (palette, type scale, spacing),
// the nine ships, the twenty rig cards, the twelve feats, the six shift trials and the grade
// ladder live here so the balance tools and the renderers all read one source of truth.
(function () {
  if (globalThis.GT_Config) return;

  const W = 1280;
  const H = 800;
  const STEP = 1 / 60;

  // --- design tokens (desain-fullstack: fixed scales, no random numbers) -------------------
  // Palette: flat industrial port. Sky and sea are flat bands; safety yellow is the one accent.
  const PALETTE = {
    sky: '#1B9BE0',        // vivid azure band, top of frame
    skyLow: '#CDEFFF',     // pale horizon band
    sea: '#0E7C86',        // deep teal water
    seaDark: '#0A5A63',    // water shadow under the hull
    quay: '#5B7186',       // slate concrete of the quay
    quayDark: '#42566A',   // quay edge and yard shadow
    panel: '#FFFFFF',      // signage white for panels
    ink: '#10222E',        // near-black blue-slate, all text and outlines
    accent: '#FFC400',     // safety yellow: crane, key numbers, the focal accent
    accentDark: '#D9A400', // pressed/edge shade of the accent
    good: '#1E9E57',       // stowed-true green (also a container colour)
    danger: '#D9381E',     // hull damage red (also a container colour)
    foam: '#EAFBFF',       // sea foam and sparkle
  };

  // Type scale, ratio 1.25 from a 16 px base: 16 / 20 / 25 / 31 / 39 / 49 / 61 / 76.
  const TYPE = { s: 16, m: 20, l: 25, xl: 31, xxl: 39, huge: 49, mega: 61, wordmark: 76 };
  const DISPLAY_FONT = '"Arial Black","Archivo Black","Segoe UI",sans-serif';
  const TEXT_FONT = '"Segoe UI","Helvetica Neue",Arial,sans-serif';
  // Spacing scale: multiples of 4 and 8 only.
  const SPACE = { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48, xxxl: 64 };
  const RADIUS = 4; // one shape language: squared corners everywhere, containers are boxes

  // --- the five cargo colours ---------------------------------------------------------------
  // Flat fills with a darker edge shade; every colour also carries a letter glyph so meaning
  // never rides on colour alone (R/B/G/Y/V stencilled on the box).
  const CARGO_COLORS = [
    { id: 'red',    name: 'Ember Red',   glyph: 'R', fill: '#D9381E', dark: '#A82A14' },
    { id: 'blue',   name: 'Harbour Blue', glyph: 'B', fill: '#1668C4', dark: '#0F4E94' },
    { id: 'green',  name: 'Buoy Green',  glyph: 'G', fill: '#1E9E57', dark: '#157347' },
    { id: 'yellow', name: 'Crane Yellow', glyph: 'Y', fill: '#F2B705', dark: '#C08F04' },
    { id: 'violet', name: 'Dusk Violet', glyph: 'V', fill: '#6C4FD8', dark: '#4E36A8' },
  ];

  // --- difficulties --------------------------------------------------------------------------
  const DIFFICULTIES = [
    { id: 'calm',    name: 'CALM',    hull: 12, windMul: 0.55, timeMul: 1.25, gustEvery: 26 },
    { id: 'busy',    name: 'BUSY',    hull: 10, windMul: 1.0,  timeMul: 1.0,  gustEvery: 18 },
    { id: 'typhoon', name: 'TYPHOON', hull: 8,  windMul: 1.5,  timeMul: 0.9,  gustEvery: 12 },
  ];

  // --- the nine ships -------------------------------------------------------------------------
  // Three shifts of three ships. cols x rows is the cargo plan; wind is the base breeze;
  // hazards switch on gulls (swing nudges) and waves (the plan rocks, list bites sooner).
  // Cargo traits layer on top as the harbour gets busier: heavy boxes (double list weight)
  // from ship 3, fragile glass (cracks on a hard drop) from ship 5, and squall lines (a rain
  // band that sweeps the field and shoves the swing) from ship 6. planStyle picks the plan
  // archetype cargo.js deals: dealt / stripes / columns / checker / strata.
  const SHIPS = [
    { name: 'MV KESTREL',        cols: 4, rows: 2, time: 125, wind: 0.25, gulls: false, waves: false, planStyle: 'dealt',   note: 'a gentle first load' },
    { name: 'MV SANDPIPER',      cols: 5, rows: 2, time: 135, wind: 0.35, gulls: false, waves: false, planStyle: 'stripes', note: 'a wider deck' },
    { name: 'MV ALBATROSS',      cols: 5, rows: 3, time: 175, wind: 0.5,  gulls: false, waves: false, planStyle: 'columns', heavy: true, note: 'first heavy steel' },
    { name: 'MV CORMORANT',      cols: 6, rows: 3, time: 155, wind: 0.6,  gulls: false, waves: true,  planStyle: 'dealt',   heavy: true, note: 'the swell starts' },
    { name: 'MV PETREL',         cols: 6, rows: 3, time: 175, wind: 0.7,  gulls: true,  waves: true,  planStyle: 'checker', fragile: true, note: 'gull flocks and first glass' },
    { name: 'MV GANNET',         cols: 6, rows: 4, time: 175, wind: 0.8,  gulls: true,  waves: true,  planStyle: 'strata',  squall: true, note: 'squall lines cross the harbour' },
    { name: 'MV SHEARWATER',     cols: 7, rows: 4, time: 185, wind: 0.95, gulls: true,  waves: true,  planStyle: 'columns', heavy: true, fragile: true, note: 'seven wide, steel and glass' },
    { name: 'MV FRIGATE',        cols: 7, rows: 4, time: 210, wind: 1.1,  gulls: true,  waves: true,  planStyle: 'checker', fragile: true, squall: true, note: 'glass under a squall sky' },
    { name: 'TYPHOON FREIGHTER', cols: 8, rows: 4, time: 210, wind: 1.45, gulls: true,  waves: true,  planStyle: 'strata',  heavy: true, fragile: true, squall: true, note: 'the storm ship — hold her level', boss: true },
  ];

  // --- the twenty rig cards (the between-ship draft pool) --------------------------------------
  const RIGS = [
    { id: 'magnet',    name: 'MAGNET SLING',    text: 'The swing settles 40% faster.',            synergy: 'Pairs with SLOW WINCH: a near-still cable.' },
    { id: 'spreader',  name: 'WIDE SPREADER',   text: 'Drops snap to the nearest column, always.', synergy: 'Pairs with FAST TROLLEY: speed without spills.' },
    { id: 'counter',   name: 'COUNTERWEIGHTS',  text: 'The ship tolerates 50% more list.',         synergy: 'Pairs with TALL STACKS on the wide ships.' },
    { id: 'winch',     name: 'SLOW WINCH',      text: 'Trolley 25% slower, swing 30% calmer.',     synergy: 'Pairs with MAGNET SLING: a near-still cable.' },
    { id: 'trolley',   name: 'FAST TROLLEY',    text: 'Trolley 35% faster, time bonus doubled.',   synergy: 'Pairs with WIDE SPREADER: speed without spills.' },
    { id: 'hull',      name: 'SPARE PLATES',    text: 'Restore 3 HULL right now.',                  synergy: 'Pairs with SALVAGE NETS: a very forgiving harbour.' },
    { id: 'grease',    name: 'CHAIN GREASE',    text: 'A plain stow no longer breaks your CHAIN.',  synergy: 'Pairs with BONUS PAINT: chains that never die.' },
    { id: 'charts',    name: 'TIDE CHARTS',     text: 'Every ship grants +30 seconds.',            synergy: 'Pairs with FAST TROLLEY: time is score.' },
    { id: 'scarer',    name: 'GULL SCARER',     text: 'Gull flocks no longer nudge the cable.',     synergy: 'Pairs with HEAVY CHAINS on the storm ship.' },
    { id: 'chains',    name: 'HEAVY CHAINS',    text: 'Wind pushes the swing 50% less.',            synergy: 'Pairs with GULL SCARER on the storm ship.' },
    { id: 'paint',     name: 'BONUS PAINT',     text: 'One box per ship arrives pre-matched.',      synergy: 'Pairs with CHAIN GREASE: chains that never die.' },
    { id: 'nets',      name: 'SALVAGE NETS',    text: 'The first splash each ship costs no HULL.',  synergy: 'Pairs with SPARE PLATES: a very forgiving harbour.' },
    { id: 'ballast',   name: 'BALLAST PUMPS',   text: 'Her list counts 30% less — she rides level.', synergy: 'Pairs with COUNTERWEIGHTS: a very steady ship.' },
    { id: 'manifest',  name: 'CARGO MANIFEST',  text: 'The next five boxes are always on show.',   synergy: 'Pairs with SPOTTER: plan the whole swing.' },
    { id: 'priority',  name: 'PRIORITY TAGS',   text: 'Harbour order bonuses pay double.',         synergy: 'Pairs with TIDE CHARTS: orders and time both pay.' },
    { id: 'insure',    name: 'HULL INSURANCE',  text: 'Every HULL point lost pays +150.',          synergy: 'Pairs with SALVAGE NETS on the storm ship.' },
    { id: 'tug',       name: 'HARBOUR TUG',     text: 'Press T once a ship: the tug cancels her list.', synergy: 'Pairs with BALLAST PUMPS: the list never wins.' },
    { id: 'spotter',   name: 'SPOTTER',         text: 'The guide shows where the box will truly land.', synergy: 'Pairs with CARGO MANIFEST: plan the whole swing.' },
    { id: 'reefer',    name: 'REEFER PLUGS',    text: 'Fragile glass can never crack.',            synergy: 'Pairs with CHAIN GREASE: fragile chains survive.' },
    { id: 'anchor',    name: 'SEA ANCHOR',      text: 'The swell rocks her half as much.',         synergy: 'Pairs with COUNTERWEIGHTS on the swell ships.' },
  ];

  // --- the twelve feats -------------------------------------------------------------------------
  const FEATS = [
    { id: 'first',   name: 'FIRST TRUE STOW',  text: 'Land a box exactly on its plan colour.' },
    { id: 'chain8',  name: 'CHAIN x8',         text: 'Reach a CHAIN of 8 true stows in a row.' },
    { id: 'perfect', name: 'PERFECT SHIP',     text: 'Clear a ship with every box true.' },
    { id: 'dry',     name: 'DRY HANDS',        text: 'Clear a ship with no splash and no slide.' },
    { id: 'storm',   name: 'TYPHOON TAMER',    text: 'Clear the TYPHOON FREIGHTER.' },
    { id: 'harbour', name: 'FULL HARBOUR',     text: 'Clear all nine ships in one run.' },
    { id: 'orders',  name: 'ORDER BOOK',       text: 'Complete 6 harbour orders in one run.' },
    { id: 'heavy',   name: 'HEAVY LIFTER',     text: 'Stow 12 heavy boxes true in one run.' },
    { id: 'glass',   name: 'GLASS HANDS',      text: 'Stow 8 fragile boxes uncracked in one run.' },
    { id: 'squall',  name: 'SQUALL RIDER',     text: 'Land a true stow inside a squall line.' },
    { id: 'fast',    name: 'FAST HANDS',       text: 'Clear a ship with 60 seconds to spare.' },
    { id: 'streak',  name: 'CLEAN SHEET',      text: 'Clear 3 ships running with no splash or slide.' },
  ];

  // --- the six shift trials (one-ship drills from the title screen) ------------------------------
  // Each trial is a single ship under a named pressure, scored on its own medal ladder.
  // medals are [BRONZE, SILVER, GOLD] score thresholds for that one ship's points.
  const TRIALS = [
    { id: 'firstlight', name: 'FIRST LIGHT',   ship: 0, difficulty: 'busy',    hull: 10, goal: 'Load MV KESTREL clean and quick.',            medals: [1400, 2200, 2900] },
    { id: 'heavyday',   name: 'HEAVY DAY',     ship: 3, difficulty: 'busy',    hull: 8,  force: { heavy: true },   goal: 'Heavy steel on a swelling deck.',      medals: [2400, 3500, 4500] },
    { id: 'glass',      name: 'GLASS HARBOUR', ship: 4, difficulty: 'busy',    hull: 8,  force: { fragile: true }, goal: 'Glass aboard MV PETREL — set it down gently.', medals: [2600, 3700, 4700] },
    { id: 'squall',     name: 'SQUALL DRILL',  ship: 5, difficulty: 'typhoon', hull: 8,  force: { squall: true },  goal: 'Load MV GANNET through the squall line.', medals: [2800, 4000, 5200] },
    { id: 'tide',       name: 'AGAINST THE TIDE', ship: 6, difficulty: 'busy', hull: 8,  timeMul: 0.7,             goal: 'MV SHEARWATER on a short tide.',       medals: [3200, 4500, 5700] },
    { id: 'freighter',  name: 'THE FREIGHTER', ship: 8, difficulty: 'typhoon', hull: 8,                            goal: 'The Typhoon Freighter, one ship, no harbour.', medals: [3600, 5000, 6400] },
  ];

  // --- scoring ----------------------------------------------------------------------------------
  const SCORE = {
    trueStow: 100,      // multiplied by the current chain
    plainStow: 25,
    heavyTrueBonus: 50, // a heavy box stowed true pays this on top
    chainCap: 8,
    perfectShip: 500,
    shipClearPerSecond: 2, // leftover tide time converts to score
    rerollCost: 150,
  };
  // Grade ladder, set from measured bot outcomes (careful bot, BUSY: clears at 46k–80k,
  // failures at 27k–35k; a patient human lands between the greedy and careful bots).
  const GRADES = [
    { grade: 'S', min: 88000 },
    { grade: 'A', min: 64000 },
    { grade: 'B', min: 42000 },
    { grade: 'C', min: 22000 },
    { grade: 'D', min: 0 },
  ];

  // --- field geometry (all multiples of the spacing scale) --------------------------------------
  const FIELD = {
    railY: 88,            // the crane beam
    legL: 152, legR: 1128, // crane legs
    waterY: 624,          // the waterline
    deckY: 544,           // ship deck top (containers rest from here up)
    boxW: 88, boxH: 40,   // one container
    cableLen: 176,        // hook cable length
    quayX: 24,            // the queue rack on the left quay
  };

  globalThis.GT_Config = {
    W, H, STEP, PALETTE, TYPE, DISPLAY_FONT, TEXT_FONT, SPACE, RADIUS,
    CARGO_COLORS, DIFFICULTIES, SHIPS, RIGS, FEATS, TRIALS, SCORE, GRADES, FIELD,
  };
})();
