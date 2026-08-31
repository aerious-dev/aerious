import { useEffect, useRef, useState } from 'react';
import './aerious.css';

// Customer-facing address. admin@ is the Workspace owner account and should
// not be printed on a public page.
const MAIL = 'mailto:support@aerious.co';

// ÆRIOUS — aerious.co.
//
// From aer, Latin for air, plus an English ending. The bet is that good
// software should sit beside you the way air sits in a room — necessary, and
// unnoticed. It is a direction, not a company yet, and the copy on this page is
// careful to say so: no "we build", no "our clients", no "our platform".
//
// The shape: one full-bleed video per chapter, a five-step track built from
// position:sticky, a type system of two faces, and a mark at the bottom of the
// screen that is the progress bar, the logo and the table of contents at the
// same time.
//
// The mark is an orbit with a travelling dot. The five nodes are the five
// stages of the method, and the arc closes when you reach the last one.
//
// The footage is stock (Pexels License — see public/media/CREDITS.txt),
// greyscaled and ping-pong looped at encode time so it never cuts. It is
// atmosphere, not evidence.

type Stage = {
  n: string;
  title: string;
  anchor: string;
  body: string;
  video: string;
};

const STAGES: Stage[] = [
  {
    n: 'I',
    title: 'Learn',
    anchor: 'Sit with the work first',
    body: 'What people actually do in a day rarely matches what the process document says. The gap between the two is where every wrong tool comes from.',
    video: 'learn',
  },
  {
    n: 'II',
    title: 'Build',
    anchor: 'The narrowest thing that works',
    body: 'One task, end to end, in front of a real user early. Scope earns its way in from use, not from a plan written before anyone had touched it.',
    video: 'build',
  },
  {
    n: 'III',
    title: 'Measure',
    anchor: 'Trusting the number is the work',
    body: 'Getting a system to produce an output is the easy half. Knowing when that output is wrong — and saying so out loud — is the half that takes the time.',
    video: 'measure',
  },
  {
    n: 'IV',
    title: 'Ship',
    anchor: 'It has to hold up unattended',
    body: 'Software running in a real place has to survive the day nobody is watching it. Everything before this point is a demo.',
    video: 'ship',
  },
  {
    n: 'V',
    title: 'Teach',
    anchor: 'A tool nobody can explain is a tool nobody owns',
    body: 'Handing a system over is not the end of the work. Explaining it out loud is the fastest way to find the parts that were never understood.',
    video: 'teach',
  },
];

const CLIP = (name: string) => `/media/${name}`;

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ------------------------------------------------------------------ */
/* the mark                                                            */
/* ------------------------------------------------------------------ */

// The ÆRIOUS mark. Æ is two letters sharing one stroke, so the mark is two
// circles sharing one overlap, held inside a ring. It has two states from the
// same drawing:
//
// It is the wordmark's companion and nothing else — the header and the overlay,
// never moving. It used to double as the scroll meter, but a meter should be a
// small copy of the figure it tracks, so LoopMark below does that job now.
//
function Orbit() {
  const R = 34;
  return (
    <svg className="ae-orbit" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="ae-orbit-track" cx="50" cy="50" r={R} strokeWidth="2.6" />
      {/* the Æ: two circles that share their overlap */}
      <circle className="ae-orbit-inner" cx={50 - R * 0.26} cy="50" r={R * 0.4} strokeWidth="2.6" />
      <circle className="ae-orbit-inner" cx={50 + R * 0.26} cy="50" r={R * 0.4} strokeWidth="2.6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* the loop, drawn at architectural scale                              */
/* ------------------------------------------------------------------ */

// A lattice, not a diagram. Every arc is radius 300 and every centre sits on
// one row, so the whole figure is one radius repeated at three positions —
// nothing here is drawn freehand.
//
//   centres   x = 304.5, 504.5, 1104.5      all at y = 304.5
//   extremes  y = 4.5 (top) and 604.5 (bottom)
//
// 504.5 and 1104.5 are exactly 2R apart, so those two circles touch at 804.5
// rather than overlapping. 304.5 is a third centre 200 to the left, and the
// arcs it throws are the crescents that fill the left of the frame.
const R = 300;
const MID = 304.5, TOP = 4.5, BOT = 604.5;
const A = 304.5, B = 504.5, C = 1104.5;
const TOUCH = 804.5;
const LEFT = A - R;      // 4.5
const RIGHT = C + R;     // 1404.5

// Six stations, not five. Five carry a stage; the sixth, at the left edge of
// the middle circle, is structural — the reference has it too, as a bare dot.
const STATIONS = [
  { x: LEFT, y: MID, dx: 64, dy: 9, anchor: 'start' as const },
  { x: B, y: TOP, dx: 0, dy: -30, anchor: 'middle' as const },
  { x: C, y: BOT, dx: 0, dy: 52, anchor: 'middle' as const },
  { x: RIGHT, y: MID, dx: -64, dy: 9, anchor: 'end' as const },
  { x: B, y: BOT, dx: 0, dy: 52, anchor: 'middle' as const },
];
const NODES = STAGES.map((s, i) => ({ ...s, ...STATIONS[i] }));
const BARE = { x: B - R, y: MID };

// The drawing is six strokes. Each is laid down once at a fifth of the ink and
// again at full strength, and the full-strength copy fades in as you arrive —
// so the figure is complete from the first frame and fills in rather than
// draws on. Order here is the order they light.
const STROKES = [
  // the upper-left crescent: dotted in the track, solid once you reach it
  `M${LEFT} ${MID} A${R} ${R} 0 0 1 ${A} ${TOP} L${B} ${TOP}`,
  `M${B} ${TOP} A${R} ${R} 0 0 1 ${TOUCH} ${MID} A${R} ${R} 0 0 0 ${C} ${BOT}`,
  `M${RIGHT} ${MID} A${R} ${R} 0 0 1 ${C} ${BOT}`,
  `M${B} ${BOT} A${R} ${R} 0 0 0 ${TOUCH} ${MID} A${R} ${R} 0 0 1 ${C} ${TOP} A${R} ${R} 0 0 1 ${RIGHT} ${MID}`,
  `M${LEFT} ${MID} A${R} ${R} 0 0 0 ${A} ${BOT} L${B} ${BOT}`,
  `M${B - R} ${MID} A${R} ${R} 0 0 0 ${B} ${BOT}`,
];
// Drawn dotted in the track layer only. STROKES[0] is the solid twin of the
// second one, which is why that crescent turns solid as it lights.
const DOTTED = [
  `M${B - R} ${MID} A${R} ${R} 0 0 1 ${B} ${TOP}`,
  STROKES[0],
];

// The anchors are sentences, not two-word slogans, so they have to break.
// Split on the word boundary nearest the middle: balanced lines, no hyphens.
const twoLines = (t: string) => {
  const w = t.split(' ');
  let best = 1, gap = Infinity;
  for (let i = 1; i < w.length; i++) {
    const d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length);
    if (d < gap) { gap = d; best = i; }
  }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
};

// The same figure, small enough to sit at the foot of the screen. It is the
// diagram it tracks rather than a separate emblem — the strokes light in the
// same order, by the same rule. Stroke width is pinned to the device pixel, or
// a hairline at a tenth of the size would vanish.
function LoopMark({ p }: { p: number }) {
  const q = clamp(p);
  return (
    <svg className="ae-loop-mini" viewBox="0 0 1410 610" aria-hidden="true">
      <g className="ae-loop-mini-track">
        <circle cx={TOUCH - 100} cy={MID} r={100} />
        {DOTTED.map((d) => (
          <path key={d} d={d} />
        ))}
        {STROKES.slice(1).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g className="ae-loop-mini-scrub">
        {STROKES.map((d, i) => (
          <path
            key={d}
            d={d}
            style={{ opacity: clamp((q - i / STROKES.length) * STROKES.length * 1.7) }}
          />
        ))}
      </g>
    </svg>
  );
}

function Loop({ p, active }: { p: number; active: number }) {
  const q = clamp(p);
  return (
    <svg className="ae-loop" viewBox="0 0 1410 610" aria-hidden="true">
      {/* The track: every stroke, laid down once at a fifth of the ink. The
          drawing is whole from the first frame — nothing is waiting to appear. */}
      <g className="ae-loop-track">
        <circle className="ae-loop-dotted" cx={TOUCH - 100} cy={MID} r={100} />
        {DOTTED.map((d) => (
          <path key={d} className="ae-loop-dotted" d={d} />
        ))}
        {STROKES.slice(1).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* The scrub: the same six strokes at full strength, each fading in as
          you reach it. They light whole rather than drawing on, which is what
          keeps the figure from reading as a progress bar. */}
      <g className="ae-loop-scrub">
        {STROKES.map((d, i) => (
          <path
            key={d}
            d={d}
            style={{ opacity: clamp((q - i / STROKES.length) * STROKES.length * 1.7) }}
          />
        ))}
      </g>

      {/* Six stations. The bare one carries no numeral — it is where the middle
          circle reaches its left edge, and the reference marks it too. */}
      <circle className="ae-loop-dot" cx={BARE.x} cy={BARE.y} r={4} />
      {NODES.map((n, i) => {
        const reached = q >= i / (STAGES.length - 1) - 0.001;
        return (
          <g key={n.n} className={`ae-loop-node${reached ? ' is-past' : ''}`}>
            <circle className="ae-loop-dot" cx={n.x} cy={n.y} r={4} />
            <text className="ae-loop-num" x={n.x + n.dx} y={n.y + n.dy} textAnchor={n.anchor}>
              {n.n}
            </text>
          </g>
        );
      })}

      {/* The stage you are on, in the hollow of the right-hand circle. The
          stations carry numerals only, as the reference does, so this is where
          the numeral gets a name. Both lines have to stay inside R of that
          centre or they run into the station sitting on its edge. */}
      <text className="ae-loop-eyebrow" x={C} y={MID - 66} textAnchor="middle">
        {STAGES[active].n} · {STAGES[active].title}
      </text>
      <text className="ae-loop-say" x={C} y={MID - 8} textAnchor="middle">
        {twoLines(STAGES[active].anchor).map((line, i) => (
          <tspan key={line} x={C} dy={i === 0 ? 0 : 38}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>
  );
}

const Cross = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    <path d="M1 1l10 10M11 1L1 11" />
  </svg>
);

/* ------------------------------------------------------------------ */

// A background video: no controls, no chrome, and it only runs while its
// chapter is the one on screen.
function BgVideo({ clip, play }: { clip: string; play: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // older Safari (and jsdom) return undefined from play() instead of a promise
    if (play && !reduced) void Promise.resolve(v.play()).catch(() => {});
    else v.pause();
  }, [play]);
  // the poster is the clip's own first frame, so nothing flashes black while
  // the file arrives
  return (
    <video
      ref={ref}
      className="ae-bg"
      src={CLIP(`${clip}.mp4`)}
      poster={CLIP(`${clip}.jpg`)}
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}

/* ------------------------------------------------------------------ */

export function Aerious() {
  const rootRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLElement>(null);

  const [q, setQ] = useState(0); // through the opening
  const [pTrack, setPTrack] = useState(0); // through the five stages
  const [pMap, setPMap] = useState(0); // the diagram arriving
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const vh = window.innerHeight;
      const span = (el: HTMLElement | null) => {
        if (!el) return 0;
        const denom = el.offsetHeight - vh;
        return denom > 0 ? clamp(-el.getBoundingClientRect().top / denom) : 0;
      };
      setQ(span(openRef.current));
      setPTrack(span(trackRef.current));
      // the diagram is only one screen tall, so measure it arriving instead.
      // before layout it has no height — treat that as "not here yet", or the
      // ring would start life already closed.
      const m = mapRef.current;
      setPMap(m && m.offsetHeight > 0 ? clamp((vh - m.getBoundingClientRect().top) / vh) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    // the page is its own scroller — the document never moves, so listen there
    const el = rootRef.current;
    el?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMapOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mapOpen]);

  // which of the five is pinned right now
  const idx = Math.min(STAGES.length - 1, Math.round(pTrack * (STAGES.length - 1)));
  // the last node sits at 4/5, so the ring only closes on the diagram
  const pLoop = Math.min(1, pTrack * 0.8 + pMap * 0.2);

  // The opening hands one statement to the next. Exactly one may be lit, with a
  // dark gap between them: the three sit on top of each other, so any overlap
  // in these ranges prints both lines at once.
  const shown = q < 0.26 ? 0 : q < 0.34 ? -1 : q < 0.58 ? 1 : q < 0.66 ? -1 : 2;
  const say = [0, 1, 2].map((i) => (i === shown ? 1 : 0));
  const chromeHidden = q > 0.3 && q < 0.9;

  return (
    <div className="ae" ref={rootRef}>
      <header className={`ae-hd${chromeHidden ? ' is-hidden' : ''}`}>
        <button
          type="button"
          className="ae-wordmark"
          onClick={() => setMapOpen(true)}
          aria-label="View the Ærious system"
        >
          ÆRIOUS
          <Orbit />
        </button>
        <p className="ae-hd-sub ae-cap">
          Necessary
          <br />
          and unnoticed
        </p>
        <nav className="ae-hd-nav ae-cap">
          <span className="is-here">Process</span>
          <a href={MAIL}>Contact</a>
        </nav>
      </header>

      {/* opening --------------------------------------------------- */}
      <section className="ae-open" ref={openRef}>
        <div className="ae-open-stage">
          <BgVideo clip="hero" play={q < 0.62} />
          <div className="ae-scrim" />
          <div className="ae-fade" style={{ opacity: clamp((q - 0.8) / 0.18) }} />
          <h1 className="ae-say ae-say-1" style={{ opacity: say[0] }}>
            Nobody thanks the air
          </h1>
          <p className="ae-say ae-say-2" style={{ opacity: say[1] }}>
            Ærious™ — from aer, Latin for air. Tools that sit beside the work the way air sits in
            a room: the thing nobody thanks, and nobody can do without.
          </p>
          <p className="ae-say ae-say-3" style={{ opacity: say[2] }}>
            Not there yet. These are the five stages the work moves through:
          </p>
          <div className="ae-numerals" style={{ opacity: say[2] }}>
            {STAGES.map((s) => (
              <span key={s.n}>{s.n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* the five stages ------------------------------------------- */}
      <section className="ae-track" ref={trackRef}>
        {STAGES.map((s, i) => (
          <article className="ae-panel" key={s.n}>
            <BgVideo clip={s.video} play={i === idx} />
            <div className="ae-scrim" />
            <div className="ae-panel-row">
              <span className="ae-panel-num">{s.n}.</span>
              <h2 className="ae-panel-title">{s.title}</h2>
            </div>
            <p className="ae-panel-meta ae-body">
              <b className="ae-cap">{s.anchor}</b>
              {s.body}
            </p>
          </article>
        ))}
      </section>

      {/* the loop, full size --------------------------------------- */}
      <section className="ae-map" ref={mapRef}>
        <div className="ae-map-stage">
          <Loop p={pLoop} active={idx} />
        </div>
        <div className="ae-map-foot">
          <p className="ae-body">
            <b className="ae-cap">Ærious — from aer, Latin for air</b>
            A direction, not a company yet: AI automation an office leans on now, everyday software
            later, and one test for both. Five stages, and the reason each one leads to the next.
          </p>
          <div className="ae-chips">
            {STAGES.map((s) => (
              <span key={s.n}>
                <img src={CLIP(`${s.video}.jpg`)} alt="" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="ae-ft">
        <div className="ae-ft-mark">ÆRIOUS</div>
        {/* the year is read at render, so a build in January is not stale */}
        <p className="ae-ft-copy ae-cap">
          ÆRIOUS {new Date().getFullYear()}. All rights reserved.
        </p>
        <div className="ae-ft-links ae-cap">
          <a href={MAIL}>Contact</a>
          <a href="/privacy.html">Privacy</a>
        </div>
      </footer>

      <button
        type="button"
        className={`ae-mark${mapOpen ? ' is-hidden' : ''}`}
        onClick={() => setMapOpen(true)}
        aria-label="View the Ærious system"
      >
        <LoopMark p={pLoop} />
      </button>

      {mapOpen && (
        <div className="ae-overlay" role="dialog" aria-modal="true" aria-label="Ærious">
          <div className="ae-overlay-hd">
            <p className="ae-wordmark">
              ÆRIOUS
              <Orbit />
            </p>
            <button
              type="button"
              className="ae-close"
              onClick={() => setMapOpen(false)}
              aria-label="Close"
            >
              <Cross />
            </button>
          </div>
          <div className="ae-overlay-stage">
            <Loop p={pLoop} active={idx} />
          </div>
        </div>
      )}
    </div>
  );
}
