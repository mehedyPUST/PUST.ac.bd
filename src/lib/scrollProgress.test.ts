import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp01, computeScrollMetrics } from './scrollProgress';

test('clamp01 constrains arbitrary and non-finite inputs safely between 0 and 1', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(0), 0);
  assert.equal(clamp01(0.42), 0.42);
  assert.equal(clamp01(1.5), 1);
  assert.equal(clamp01(Number.NaN), 0);
  assert.equal(clamp01(Number.POSITIVE_INFINITY), 0);
});

test('computeScrollMetrics returns 0% and hides Go to Top on short or un-scrolled pages', () => {
  assert.deepEqual(
    computeScrollMetrics({
      scrollY: 0,
      scrollHeight: 900,
      clientHeight: 900,
    }),
    {
      progress: 0,
      percent: 0,
      maxScroll: 0,
      isScrollable: false,
      showGoToTop: false,
    }
  );

  assert.deepEqual(
    computeScrollMetrics({
      scrollY: 100,
      scrollHeight: 980,
      clientHeight: 900,
    }),
    {
      progress: 1,
      percent: 100,
      maxScroll: 80,
      isScrollable: false,
      showGoToTop: false,
    }
  );
});

test('computeScrollMetrics tracks scroll ratio and toggles Go to Top at threshold', () => {
  const beforeThreshold = computeScrollMetrics({
    scrollY: 200,
    scrollHeight: 2900,
    clientHeight: 900,
  });
  assert.equal(beforeThreshold.isScrollable, true);
  assert.equal(beforeThreshold.percent, 10);
  assert.equal(beforeThreshold.showGoToTop, false);

  const pastThreshold = computeScrollMetrics({
    scrollY: 1000,
    scrollHeight: 2900,
    clientHeight: 900,
  });
  assert.equal(pastThreshold.progress, 0.5);
  assert.equal(pastThreshold.percent, 50);
  assert.equal(pastThreshold.showGoToTop, true);

  const atBottom = computeScrollMetrics({
    scrollY: 2400,
    scrollHeight: 2900,
    clientHeight: 900,
  });
  assert.equal(atBottom.progress, 1);
  assert.equal(atBottom.percent, 100);
  assert.equal(atBottom.showGoToTop, true);
});
