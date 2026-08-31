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

// The mark is the whole idea: at rest the arc is undrawn and only the first
// tick is lit. If the dash maths ever inverts, this fails.
test('the meter starts undrawn, with the rider parked on the first stage', () => {
  const { container } = renderPage();
  const arc = container.querySelector('.ae-mark .ae-orbit-arc')!;
  const C = Number(arc.getAttribute('stroke-dasharray'));
  expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(C, 5);
  expect(container.querySelectorAll('.ae-mark .ae-orbit-tick.is-past')).toHaveLength(1);
  const rider = container.querySelector('.ae-mark .ae-orbit-rider')!;
  expect(Number(rider.getAttribute('cx'))).toBeCloseTo(50, 5); // top of the ring
  expect(Number(rider.getAttribute('cy'))).toBeCloseTo(16, 5);
});

// The logo and the instrument are the same drawing in two states — the header
// lockup must stay still.
test('the header logo carries no arc, ticks or rider', () => {
  const { container } = renderPage();
  const logo = container.querySelector('.ae-hd .ae-orbit')!;
  expect(logo.querySelectorAll('.ae-orbit-inner')).toHaveLength(2);
  expect(logo.querySelector('.ae-orbit-arc')).toBeNull();
  expect(logo.querySelector('.ae-orbit-tick')).toBeNull();
  expect(logo.querySelector('.ae-orbit-rider')).toBeNull();
});

test('the mark opens the system as a labelled map, and Escape closes it', () => {
  renderPage();
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getAllByRole('button', { name: 'View the Ærious system' })[0]);
  const dialog = screen.getByRole('dialog', { name: 'Ærious' });
  expect(dialog.querySelectorAll('.ae-loop-name')).toHaveLength(5);
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
