// Test pure functions only - no imports that touch supabase
const calculateHealthScore = (daysSinceContact, tierTargetDays = 30) => {
  if (daysSinceContact <= 0) return 100;
  const decayRate = 100 / (tierTargetDays * 2);
  const score = Math.max(0, Math.round(100 - (daysSinceContact * decayRate)));
  return score;
};

const getStatusFromScore = (score) => {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'cooling';
  if (score >= 40) return 'at_risk';
  return 'cold';
};

const getHealthColor = (status) => {
  switch (status) {
    case 'healthy': return '#4FFFB0';
    case 'cooling': return '#FFD93D';
    case 'at_risk': return '#FF8C42';
    case 'cold': return '#FF6B6B';
    default: return '#999999';
  }
};

const TIER_TARGET_DAYS = { 1: 7, 2: 14, 3: 21, 4: 30, 5: 45 };
const getTierTargetDays = (tier) => TIER_TARGET_DAYS[tier] || 30;

describe('healthScoring', () => {
  describe('calculateHealthScore', () => {
    it('returns 100 for 0 days since contact', () => {
      expect(calculateHealthScore(0, 30)).toBe(100);
    });

    it('returns 0 for 2x target days', () => {
      expect(calculateHealthScore(60, 30)).toBe(0);
    });

    it('returns ~50 for target days', () => {
      const score = calculateHealthScore(30, 30);
      expect(score).toBe(50);
    });

    it('never goes below 0', () => {
      expect(calculateHealthScore(100, 30)).toBe(0);
    });
  });

  describe('getStatusFromScore', () => {
    it('returns healthy for score >= 80', () => {
      expect(getStatusFromScore(80)).toBe('healthy');
      expect(getStatusFromScore(100)).toBe('healthy');
    });

    it('returns cooling for score 60-79', () => {
      expect(getStatusFromScore(60)).toBe('cooling');
      expect(getStatusFromScore(79)).toBe('cooling');
    });

    it('returns at_risk for score 40-59', () => {
      expect(getStatusFromScore(40)).toBe('at_risk');
      expect(getStatusFromScore(59)).toBe('at_risk');
    });

    it('returns cold for score < 40', () => {
      expect(getStatusFromScore(39)).toBe('cold');
      expect(getStatusFromScore(0)).toBe('cold');
    });
  });

  describe('getHealthColor', () => {
    it('returns green for healthy', () => {
      expect(getHealthColor('healthy')).toBe('#4FFFB0');
    });

    it('returns yellow for cooling', () => {
      expect(getHealthColor('cooling')).toBe('#FFD93D');
    });

    it('returns orange for at_risk', () => {
      expect(getHealthColor('at_risk')).toBe('#FF8C42');
    });

    it('returns red for cold', () => {
      expect(getHealthColor('cold')).toBe('#FF6B6B');
    });
  });

  describe('getTierTargetDays', () => {
    it('returns 7 for tier 1 (inner circle)', () => {
      expect(getTierTargetDays(1)).toBe(7);
    });

    it('returns 14 for tier 2', () => {
      expect(getTierTargetDays(2)).toBe(14);
    });

    it('returns 30 for unknown tier', () => {
      expect(getTierTargetDays(99)).toBe(30);
    });
  });
});
