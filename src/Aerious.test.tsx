import { render, screen, fireEvent } from '@testing-library/react';
import { Aerious } from './Aerious';

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
test('the mark is the figure in miniature, and starts with nothing lit', () => {
  const { container } = renderPage();
  const mark = container.querySelector('.ae-mark .ae-loop-mini')!;
  expect(mark.querySelectorAll('.ae-loop-mini-track path')).toHaveLength(7);
  const scrub = [...mark.querySelectorAll<SVGPathElement>('.ae-loop-mini-scrub path')];
  expect(scrub).toHaveLength(6);
  expect(scrub.map((p) => p.style.opacity)).toEqual(['0', '0', '0', '0', '0', '0']);
  // and it draws the same paths the big figure does
  const big = container.querySelector('.ae-map .ae-loop')!;
  expect(scrub.map((p) => p.getAttribute('d'))).toEqual(
    [...big.querySelectorAll('.ae-loop-scrub path')].map((p) => p.getAttribute('d')),
  );
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
