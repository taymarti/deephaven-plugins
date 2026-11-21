import {
  computeTimezoneOffsetSeconds,
  getTimezoneOffsetSeconds,
} from '../TradingViewUtils';

const MIN = 60 * 1000;
const ZONES = [
  'America/New_York', // DST at 02:00 local
  'Europe/London', // DST at 01:00 UTC
  'Asia/Kolkata', // +05:30, no DST
  'Asia/Kathmandu', // +05:45
  'Australia/Lord_Howe', // 30-minute DST shift
  'UTC',
];

describe('getTimezoneOffsetSeconds cache', () => {
  it('matches the uncached offset at every minute around each 2026 transition', () => {
    for (const tz of ZONES) {
      // walk 2026 in 15-minute steps; where the offset changes, check every minute of that bucket
      const start = Date.UTC(2026, 0, 1);
      const end = Date.UTC(2027, 0, 1);
      for (let t = start; t < end; t += 15 * MIN) {
        const a = computeTimezoneOffsetSeconds(t, tz);
        const b = computeTimezoneOffsetSeconds(t + 15 * MIN - 1000, tz);
        if (a !== b) {
          for (let m = t; m < t + 15 * MIN; m += MIN) {
            expect(getTimezoneOffsetSeconds(m, tz)).toBe(
              computeTimezoneOffsetSeconds(m, tz)
            );
          }
        }
        expect(getTimezoneOffsetSeconds(t, tz)).toBe(a);
      }
    }
  });

  it('does not call Intl again for instants in an already-seen bucket', () => {
    const spy = jest.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts');
    const t = Date.UTC(2031, 5, 1, 12, 0, 0); // a bucket no other test touches
    getTimezoneOffsetSeconds(t, 'America/Chicago');
    const calls = spy.mock.calls.length;
    for (let s = 1; s < 900; s += 1) {
      getTimezoneOffsetSeconds(t + s * 1000, 'America/Chicago');
    }
    expect(spy.mock.calls.length).toBe(calls);
    spy.mockRestore();
  });

  it('falls back to the browser zone when no zone is given', () => {
    const t = Date.UTC(2026, 6, 1);
    expect(getTimezoneOffsetSeconds(t)).toBe(
      -(new Date(t).getTimezoneOffset() * 60)
    );
  });
});
