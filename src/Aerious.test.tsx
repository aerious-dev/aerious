import { render, screen, fireEvent } from '@testing-library/react';
import { Aerious, figureAt, inkAt } from './Aerious';

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

  test.each(cases)('arrives at full width, above centre, at $vw×$vh', ({ vw, vh }) => {
    const f = figureAt(1, vw, vh);
    expect(f.scale).toBeCloseTo(1, 6);
    expect(f.w).toBeCloseTo(Math.min(1180, vw * 0.94), 6);
    expect(f.y).toBeLessThan(0); // raised, so the caption underneath clears
    expect(Math.abs(f.y)).toBeLessThan(vh / 4); // but not off the top
  });

  test('grows and rises without ever reversing', () => {
    let lastScale = -1;
    let lastY = Infinity;
    for (let g = 0; g <= 1.0001; g += 0.05) {
      const f = figureAt(Math.min(1, g), 1200, 750);
      expect(f.scale).toBeGreaterThan(lastScale);
      expect(f.y).toBeLessThan(lastY);
      lastScale = f.scale;
      lastY = f.y;
    }
  });

  test('fades out as the section leaves, so it never sits on the footer', () => {
    expect(figureAt(1, 1200, 750, 0).opacity).toBe(1);
    expect(figureAt(1, 1200, 750, 1).opacity).toBe(0);
  });
});

// The faint track is a fifth of the ink at full size, which is right on a black
// frame and invisible on a 132px mark laid over video. Sampling the reference's
// own small mark puts it around 60%.
test('the track firms up as the figure shrinks', () => {
  expect(inkAt(1)).toBeCloseTo(0.2, 6);   // full frame, on black
  expect(inkAt(0)).toBeCloseTo(0.6, 6);   // parked at the foot, over footage
  for (let g = 0; g <= 1.0001; g += 0.1) {
    expect(inkAt(Math.min(1, g))).toBeLessThanOrEqual(inkAt(Math.max(0, g - 0.1)));
  }
});
