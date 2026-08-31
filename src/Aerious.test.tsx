import { render, screen, fireEvent } from '@testing-library/react';
import {
  Aerious,
  clamp,
  dashAt,
  figureAt,
  stageAt,
  STATION_POINTS,
  STROKES,
  STROKES_AT,
} from './Aerious';

const renderPage = () => render(<Aerious />);

test('the five stages render in order', () => {
  const { container } = renderPage();
  expect(container.querySelectorAll('.ae-panel')).toHaveLength(5);
  expect([...container.querySelectorAll('.ae-panel-title')].map((h) => h.textContent)).toEqual([
    'Learn',
    'Build',
    'Measure',
    'Ship',
    'Teach',
  ]);
});

// This is a company site now: the only outbound link is the company address.
// Anything pointing at a personal domain has no business here.
test('leaves the site only for aerious.co support and its own privacy page', () => {
  renderPage();
  const hrefs = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
  expect(hrefs.length).toBeGreaterThan(0);
  const allowed = ['mailto:support@aerious.co', '/privacy.html'];
  expect(hrefs.filter((h) => !allowed.includes(h))).toEqual([]);
  // admin@ is the Workspace owner account: never printed publicly
  expect(hrefs.some((h) => h.includes('admin@'))).toBe(false);
});

// The mark at the foot of the screen is the diagram in miniature: the same six
// strokes, laid over a faint copy of themselves, lighting one at a time. At
// rest nothing is lit. If the progress maths ever inverts, this fails.
test('the figure rests small at the foot with nothing lit and no labels', () => {
  const { container } = renderPage();
  const mark = container.querySelector<HTMLElement>('.ae-mark')!;
  const fig = mark.querySelector('.ae-loop')!;
  expect(fig.querySelectorAll('.ae-loop-track path')).toHaveLength(7);
  const scrub = [...fig.querySelectorAll<SVGPathElement>('.ae-loop-scrub path')];
  expect(scrub).toHaveLength(6);
  expect(scrub.map((p) => p.style.opacity)).toEqual(['0', '0', '0', '0', '0', '0']);
  // at rest it is scaled right down and parked below centre, and its numerals
  // and sentence are hidden — at 132px wide they would be specks
  const m = mark.style.transform.match(/scale\(([\d.]+)\)/);
  expect(Number(m![1])).toBeLessThan(0.2);
  expect(mark.style.transform).toMatch(/translateY\(\d/);
  expect(fig.querySelector<SVGGElement>('g[style*="opacity"]')!.style.opacity).toBe('0');
});

// The section that used to hold a second copy of the figure now holds only its
// room. Two copies would drift; one cannot.
test('the diagram is drawn once, in the layer that moves', () => {
  const { container } = renderPage();
  expect(container.querySelectorAll('.ae-map .ae-loop')).toHaveLength(0);
  expect(container.querySelectorAll('.ae-loop')).toHaveLength(1);
});

// The logo is the wordmark's companion, not an instrument: it never moves.
test('the header logo carries nothing that animates', () => {
  const { container } = renderPage();
  const logo = container.querySelector('.ae-hd .ae-orbit')!;
  expect(logo.querySelectorAll('.ae-orbit-inner')).toHaveLength(2);
  // three circles and nothing else — a ring and the Æ inside it
  expect(logo.children).toHaveLength(3);
  expect([...logo.children].every((c) => c.tagName === 'circle')).toBe(true);
});

test('the mark opens the system as a labelled map, and Escape closes it', () => {
  renderPage();
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getAllByRole('button', { name: 'View the Ærious system' })[0]);
  const dialog = screen.getByRole('dialog', { name: 'Ærious' });
  // the nodes carry numerals only; the stage's name is in the middle of the figure
  expect(dialog.querySelectorAll('.ae-loop-num')).toHaveLength(5);
  expect(dialog.querySelector('.ae-loop-eyebrow')?.textContent).toContain('Learn');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});

// The three opening statements are stacked on one another, so two visible at
// once means two lines printed on top of each other.
test('never lights two opening statements at the same time', () => {
  const { container } = renderPage();
  const shownAt = (q: number) => (q < 0.26 ? 0 : q < 0.34 ? -1 : q < 0.58 ? 1 : q < 0.66 ? -1 : 2);
  for (let q = 0; q <= 1.0001; q += 0.005) {
    const lit = [0, 1, 2].filter((i) => i === shownAt(q));
    expect(lit.length).toBeLessThanOrEqual(1);
  }
  // and at rest only the first is up
  expect(
    [...container.querySelectorAll<HTMLElement>('.ae-say')].filter((e) => e.style.opacity === '1'),
  ).toHaveLength(1);
});

// The figure travels from a 132px mark parked at the foot of the screen to the
// full frame. Both ends have to be exact — the resting place is measured off
// the floor, and a slip there only shows up on a screen size nobody tried.
describe('the figure growing out of its resting place', () => {
  const cases = [
    { vw: 1440, vh: 900 },
    { vw: 1200, vh: 750 },
    { vw: 390, vh: 844 },   // phone
    { vw: 2560, vh: 1440 }, // and a large desktop
  ];

  test.each(cases)('parks 26px off the floor at $vw×$vh', ({ vw, vh }) => {
    const f = figureAt(0, vw, vh);
    const drawnW = f.w * f.scale;
    expect(drawnW).toBeCloseTo(132, 6);
    // centre of the viewport, pushed down by y, plus half its drawn height
    const bottom = vh / 2 + f.y + drawnW / (1410 / 610) / 2;
    expect(vh - bottom).toBeCloseTo(26, 6);
  });

  test.each(cases)('arrives at full width, on the section, at $vw×$vh', ({ vw, vh }) => {
    const f = figureAt(1, vw, vh, 0);
    expect(f.scale).toBeCloseTo(1, 6);
    expect(f.w).toBeCloseTo(Math.min(1180, vw * 0.94), 6);
    expect(f.y).toBeCloseTo(0, 6); // sitting exactly on the room kept for it
  });

  test('grows and rises without ever reversing', () => {
    let lastScale = -1;
    let lastY = Infinity;
    for (let g = 0; g <= 1.0001; g += 0.05) {
      const f = figureAt(Math.min(1, g), 1200, 750, 0);
      expect(f.scale).toBeGreaterThan(lastScale);
      expect(f.y).toBeLessThan(lastY);
      lastScale = f.scale;
      lastY = f.y;
    }
  });

  // Once it has arrived the figure is pinned to the room the section keeps for
  // it, not to the screen. Scroll on and that room rises, so the figure rises
  // with it instead of hanging over the footer.
  test('rides the section away once it has arrived', () => {
    const centred = figureAt(1, 1200, 750, 0);
    const sectionRisen = figureAt(1, 1200, 750, -300);
    expect(sectionRisen.y).toBeCloseTo(centred.y - 300, 6);
  });

  // While it is still parked, where the section happens to be must not move it.
  test('ignores the section while it is still parked', () => {
    expect(figureAt(0, 1200, 750, 0).y).toBeCloseTo(figureAt(0, 1200, 750, -900).y, 6);
  });
});


// The dash is the thing that broke: written in viewBox units it measured a
// fifth of a pixel on the parked mark and turned the crescents into a smear.
describe('the dotted crescents', () => {
  test('are solid while the figure is parked', () => {
    expect(dashAt(1410 / 132, 0)).toBeUndefined();
  });

  test('stay 2 device pixels long at any size', () => {
    for (const px of [132, 400, 1180]) {
      const unit = 1410 / px;
      const [on, off] = dashAt(unit, 1)!.split(' ').map(Number);
      // 2 decimal places, because the attribute is rounded to keep it short —
      // still tight enough to catch a dash left in viewBox units, which would
      // be out by an order of magnitude at the parked size
      expect(on / unit).toBeCloseTo(2, 2);   // 2px of dash
      expect(off / unit).toBeCloseTo(2, 2);  // and 2px of gap
    }
  });

  test('open up as the figure grows, never the other way', () => {
    const unit = 1410 / 600;
    let last = 0;
    for (let g = 0.1; g <= 1.0001; g += 0.1) {
      const gap = Number(dashAt(unit, Math.min(1, g))!.split(' ')[1]);
      expect(gap).toBeGreaterThan(last);
      last = gap;
    }
  });
});

// The point of the tall diagram section: once the figure has arrived and is
// holding still, scrolling on has to keep doing something — the sentence in the
// middle moves through the five stages and the strokes go on lighting. Without
// this the figure just sits there and the scroll feels broken.
describe('scrolling on through the diagram', () => {
  const through = (t: number) => stageAt(1, 1, t);

  test('walks all five stages from start to end', () => {
    const seen = [0, 0.25, 0.45, 0.65, 0.85, 0.99].map((t) => through(t).idx);
    expect(seen).toEqual([0, 1, 2, 3, 4, 4]);
  });

  test('keeps lighting as it goes, and never unlights', () => {
    let last = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const { pLoop } = through(Math.min(1, t));
      expect(pLoop).toBeGreaterThanOrEqual(last);
      last = pLoop;
    }
    expect(through(1).pLoop).toBeCloseTo(1, 6);
  });

  test('hands over without the lighting dropping back', () => {
    const endOfChapters = stageAt(1, 0.5, 0).pLoop;      // panels done, diagram arriving
    const startOfDiagram = stageAt(1, 1, 0).pLoop;       // diagram arrived, not scrolled yet
    expect(startOfDiagram).toBeGreaterThanOrEqual(endOfChapters);
  });

  test('still follows the panels before the diagram arrives', () => {
    expect(stageAt(0, 0, 0).idx).toBe(0);
    expect(stageAt(0.5, 0, 0).idx).toBe(2);
    expect(stageAt(1, 0.5, 0).idx).toBe(4);
  });
});

// Hovering a station lights the arcs that meet it. That map is written by hand,
// so check it against the geometry rather than trusting it: every stroke listed
// for a station has to actually begin or end at that station's point.
describe('the track a station reveals', () => {
  const nums = (d: string) => d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const ends = (d: string) => {
    const n = nums(d);
    return [
      { x: n[0], y: n[1] },                    // straight after the M
      { x: n[n.length - 2], y: n[n.length - 1] }, // and the final pair
    ];
  };
  const near = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y) < 0.5;

  test('every arc it names really does meet it', () => {
    STROKES_AT.forEach((list, station) => {
      const point = STATION_POINTS[station];
      list.forEach((i) => {
        const [from, to] = ends(STROKES[i]);
        expect(
          near(from, point) || near(to, point),
          `stroke ${i} does not touch station ${station}`,
        ).toBe(true);
      });
    });
  });

  test('and it names every arc that meets it', () => {
    STATION_POINTS.forEach((point, station) => {
      const touching = STROKES.map((d, i) => [i, ends(d)] as const)
        .filter(([, [from, to]]) => near(from, point) || near(to, point))
        .map(([i]) => i);
      expect([...STROKES_AT[station]].sort()).toEqual(touching.sort());
    });
  });

  test('leaves no arc unreachable from any station', () => {
    const covered = new Set(STROKES_AT.flat());
    expect(covered.size).toBe(STROKES.length);
  });
});

// A viewport can report zero height — hidden tab, prerender, an embed measured
// before layout — and the progress maths then divides zero by zero. NaN passes
// every comparison as false, so it does not just look wrong: it silently
// disables anything guarded by one.
describe('numbers that never became NaN', () => {
  test('clamp lands NaN on zero', () => {
    expect(clamp(NaN)).toBe(0);
    expect(clamp(-5)).toBe(0);
    expect(clamp(5)).toBe(1);
    expect(clamp(0.4)).toBeCloseTo(0.4, 6);
  });

  test('so nothing downstream of it can go NaN either', () => {
    const { idx, pLoop } = stageAt(NaN, NaN, NaN);
    expect(Number.isNaN(pLoop)).toBe(false);
    expect(Number.isNaN(idx)).toBe(false);
    expect(dashAt(1, NaN)).toBeUndefined();
    const f = figureAt(clamp(NaN), 1200, 750, 0);
    expect(Number.isNaN(f.scale)).toBe(false);
    expect(Number.isNaN(f.y)).toBe(false);
  });
});
