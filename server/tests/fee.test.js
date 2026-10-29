// FR-16 fee rule - unit tests with the STP boundary values (TC-EXT-03).
const { computeFee, GRACE_MINUTES } = require('../src/services/feeService');

const CAR = 3000; // Rs 30 per hour, in paise
const TWO_WHEELER = 1000; // Rs 10 per hour

describe('FR-16 fee calculation boundaries (TC-EXT-03)', () => {
  it('uses a fixed 15-minute grace period', () => {
    expect(GRACE_MINUTES).toBe(15);
  });

  it.each([
    [10, 0, 0],
    [15, 0, 0],
    [16, 1, 3000],
    [75, 1, 3000],
    [76, 2, 6000],
    [195, 3, 9000],
  ])('Car, %i min -> %i billable hours, %i paise', (minutes, hours, fee) => {
    expect(computeFee(minutes, CAR)).toEqual({ billableHours: hours, feePaise: fee });
  });

  it('Two-wheeler, 76 min -> Rs 20', () => {
    expect(computeFee(76, TWO_WHEELER).feePaise).toBe(2000);
  });

  it('15 min 30 s is over the grace period and is charged', () => {
    expect(computeFee(15.5, CAR).feePaise).toBe(3000);
  });

  it('a rate of Rs 0 gives a fee of 0', () => {
    expect(computeFee(500, 0).feePaise).toBe(0);
  });
});
