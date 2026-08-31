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
//   logo   — ring + the two circles. Header and overlay. Nothing moving.
//   meter  — the logo plus five ticks, a drawn arc and a travelling dot.
//
// The labelled version this used to carry is gone: the diagram it fed is now
// the Loop below, drawn from tangent circles instead of one ring.
//
// Ticks rather than dots for the five stages: five evenly spaced dots on a
// circle is the shape of a loading spinner, and reads as chrome instead of as
// a mark. The last node sits at 4/5, so the arc only closes on the diagram.
function Orbit({ p = 0, variant = 'logo' }: { p?: number; variant?: 'logo' | 'meter' }) {
  const RING = 34;
  const C = 2 * Math.PI * RING;
  const at = (deg: number, r = RING) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
  };
  const live = variant === 'meter';
  const w = live ? 2.2 : 2.6;
  const [rx, ry] = at(p * 360);

  return (
    <svg className="ae-orbit" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="ae-orbit-track" cx="50" cy="50" r={RING} strokeWidth={w} />
      {/* the Æ: two circles that share their overlap */}
      <circle className="ae-orbit-inner" cx={50 - RING * 0.26} cy="50" r={RING * 0.4} strokeWidth={w} />
      <circle className="ae-orbit-inner" cx={50 + RING * 0.26} cy="50" r={RING * 0.4} strokeWidth={w} />
      {live && (
        <>
          <circle
            className="ae-orbit-arc"
            cx="50"
            cy="50"
            r={RING}
            strokeWidth={w}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - p)}
            transform="rotate(-90 50 50)"
          />
          {STAGES.map((s, i) => {
            const deg = i * 72;
            const [x1, y1] = at(deg, RING - 3.4);
            const [x2, y2] = at(deg, RING + 3.4);
            return (
              <line
                key={s.n}
                className={`ae-orbit-tick${p >= i / 5 - 0.001 ? ' is-past' : ''}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={w}
              />
            );
          })}
          <circle className="ae-orbit-rider" cx={rx} cy={ry} r={5} />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* the loop, drawn at architectural scale                              */
/* ------------------------------------------------------------------ */

// Two circles of equal radius, set exactly 2R apart so they meet at a single
// point rather than overlapping. The figure is the S drawn over the top of one
// and under the other: one continuous line, five stations, and the pair of
// circles still legible behind it as the Æ.
//
// Every arc in here is the same radius and every join is tangent, so the line
// never kinks. That is the whole discipline of the drawing.
const R = 300;
const CY = 330;
const C1 = 504;                 // left centre
const C2 = C1 + 2 * R;          // right centre — tangent, not overlapping
const TOUCH = C1 + R;           // where they meet, and the middle station

// The five stations sit a quarter-turn apart along the line.
const NODES = STAGES.map((s, i) => {
  const pt = [
    { x: C1 - R, y: CY },       // I    left extreme
    { x: C1, y: CY - R },       // II   over the top
    { x: TOUCH, y: CY },        // III  the crossing
    { x: C2, y: CY + R },       // IV   under the bottom
    { x: C2 + R, y: CY },       // V    right extreme
  ][i];
  return { ...s, ...pt };
});

// Over the left circle, then under the right one. Sweep flips at the join.
const LINE =
  `M${C1 - R} ${CY} A${R} ${R} 0 0 1 ${TOUCH} ${CY}` +
  ` A${R} ${R} 0 0 0 ${C2 + R} ${CY}`;
const LEN = 2 * Math.PI * R;    // two half-turns

// The same S drawn the other way — under the left circle, over the right. It
// adds no new vocabulary and closes the two arcs into a pair of lenses, which
// is where the drawing gets its depth.
const MIRROR =
  `M${C1 - R} ${CY} A${R} ${R} 0 0 0 ${TOUCH} ${CY}` +
  ` A${R} ${R} 0 0 1 ${C2 + R} ${CY}`;

// Where the travelling dot is, walked along the same construction.
const walk = (u: number) => {
  const t = u * 2;                                   // which half we are in
  if (t <= 1) {
    const a = Math.PI - t * Math.PI;                 // left circle, over the top
    return { x: C1 + R * Math.cos(a), y: CY - R * Math.sin(a) };
  }
  const a = Math.PI - (t - 1) * Math.PI;             // right circle, under
  return { x: C2 + R * Math.cos(a), y: CY + R * Math.sin(a) };
};

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

function Loop({ p, active }: { p: number; active: number }) {
  const rider = walk(clamp(p));
  return (
    <svg className="ae-loop" viewBox="40 -80 1530 860" aria-hidden="true">
      {/* the two circles whole, dotted: the Æ standing behind the journey */}
      <circle className="ae-loop-ghost" cx={C1} cy={CY} r={R} />
      <circle className="ae-loop-ghost" cx={C2} cy={CY} r={R} />
      <circle className="ae-loop-ghost is-fine" cx={TOUCH} cy={CY} r={R / 3} />
      <path className="ae-loop-ghost" d={MIRROR} />

      <path className="ae-loop-track" d={LINE} />
      <path
        className="ae-loop-arc"
        d={LINE}
        strokeDasharray={LEN}
        strokeDashoffset={LEN * (1 - clamp(p))}
      />

      {NODES.map((n, i) => {
        const reached = p >= i / (STAGES.length - 1) - 0.001;
        // labels lean away from the line: outward at the ends, above the crest,
        // below the trough, so nothing ever sits on top of the stroke
        const above = n.y < CY;
        const side = n.x < C1 ? -1 : n.x > C2 ? 1 : 0;
        const lx = n.x + side * 46;
        const ly = n.y + (side !== 0 ? -34 : above ? -52 : 74);
        const anchor = side === 1 ? 'start' : side === -1 ? 'end' : 'middle';
        return (
          <g key={n.n} className={`ae-loop-node${reached ? ' is-past' : ''}`}>
            <circle className="ae-loop-dot" cx={n.x} cy={n.y} r={6} />
            <text className="ae-loop-num" x={lx} y={ly} textAnchor={anchor}>
              {n.n}
            </text>
            <text className="ae-loop-name" x={lx} y={ly + 26} textAnchor={anchor}>
              {n.title}
            </text>
          </g>
        );
      })}

      {/* the stage you are on, set in the hollow the line leaves open inside
          the right circle — above its arc, which dives under */}
      <text className="ae-loop-say" x={C2} y={CY - 74} textAnchor="middle">
        {twoLines(STAGES[active].anchor).map((line, i) => (
          <tspan key={line} x={C2} dy={i === 0 ? 0 : 52}>
            {line}
          </tspan>
        ))}
      </text>

      <circle className="ae-loop-rider" cx={rider.x} cy={rider.y} r={10} />
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
        <Orbit p={pLoop} variant="meter" />
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
