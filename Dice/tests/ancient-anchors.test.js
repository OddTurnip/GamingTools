/**
 * Tests for ancient-anchors.js - Ancient Anchors dice system
 *
 * Run with: npm test
 */

import { describe, it, expect, vi } from 'vitest';
import {
    rollD6,
    rollAncientAnchorsDice,
    evaluateDicePool,
    clampDiceCount,
    getOutcome,
    getOutcomeColor,
    getDieClass,
    formatAncientAnchorsRoll,
    getAncientAnchorsProbabilities,
    MIN_DICE,
    MAX_DICE,
    DEFAULT_DICE
} from '../ancient-anchors.js';

describe('pool constants', () => {
    it('allows 1-6 dice with a default of 2', () => {
        expect(MIN_DICE).toBe(1);
        expect(MAX_DICE).toBe(6);
        expect(DEFAULT_DICE).toBe(2);
    });
});

describe('rollD6', () => {
    it('returns a value between 1 and 6', () => {
        for (let i = 0; i < 50; i++) {
            const value = rollD6();
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(6);
        }
    });
});

describe('rollAncientAnchorsDice', () => {
    it('rolls the specified number of dice', () => {
        const result = rollAncientAnchorsDice(3);

        expect(result.rolls).toHaveLength(3);
        expect(result.rolls.every(r => r >= 1 && r <= 6)).toBe(true);
    });

    it('returns the highest die as the result', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        // Math.floor(0.5 * 6) + 1 = 4
        mockRandom.mockReturnValue(0.5);

        const result = rollAncientAnchorsDice(3);

        expect(result.result).toBe(4);
        expect(result.rolls).toEqual([4, 4, 4]);

        mockRandom.mockRestore();
    });

    it('detects critical success (multiple 6s)', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom.mockReturnValue(0.99); // 6

        const result = rollAncientAnchorsDice(3);

        expect(result.isCritical).toBe(true);
        expect(result.outcome).toBe('Critical Success');

        mockRandom.mockRestore();
    });

    it('single 6 is a success but not critical', () => {
        const mockRandom = vi.spyOn(Math, 'random');
        mockRandom
            .mockReturnValueOnce(0.99)  // 6
            .mockReturnValue(0.3);      // 2

        const result = rollAncientAnchorsDice(3);

        expect(result.isCritical).toBe(false);
        expect(result.outcome).toBe('Success');

        mockRandom.mockRestore();
    });

    it('rejects 0 dice - there is no zero-dice roll', () => {
        expect(() => rollAncientAnchorsDice(0)).toThrow('Invalid number of dice');
    });

    it('throws for other invalid dice counts', () => {
        expect(() => rollAncientAnchorsDice(-1)).toThrow('Invalid number of dice');
        expect(() => rollAncientAnchorsDice(1.5)).toThrow('Invalid number of dice');
    });
});

describe('clampDiceCount', () => {
    it('keeps counts inside the allowed range', () => {
        expect(clampDiceCount(1)).toBe(1);
        expect(clampDiceCount(4)).toBe(4);
        expect(clampDiceCount(6)).toBe(6);
    });

    it('clamps below the minimum and above the maximum', () => {
        expect(clampDiceCount(0)).toBe(MIN_DICE);
        expect(clampDiceCount(-3)).toBe(MIN_DICE);
        expect(clampDiceCount(9)).toBe(MAX_DICE);
    });

    it('rounds fractional counts', () => {
        expect(clampDiceCount(2.4)).toBe(2);
        expect(clampDiceCount(2.6)).toBe(3);
    });

    it('falls back to the default for non-numeric input', () => {
        expect(clampDiceCount(NaN)).toBe(DEFAULT_DICE);
        expect(clampDiceCount(undefined)).toBe(DEFAULT_DICE);
    });
});

describe('evaluateDicePool', () => {
    it('takes the highest die and reports its index', () => {
        const evaluation = evaluateDicePool([2, 5, 3]);

        expect(evaluation.result).toBe(5);
        expect(evaluation.outcome).toBe('Costly');
        expect(evaluation.isCritical).toBe(false);
        expect(evaluation.selectedIndex).toBe(1);
    });

    it('flags two or more 6s as critical', () => {
        const evaluation = evaluateDicePool([6, 1, 6]);

        expect(evaluation.isCritical).toBe(true);
        expect(evaluation.outcome).toBe('Critical Success');
    });

    it('throws for an empty pool', () => {
        expect(() => evaluateDicePool([])).toThrow('empty dice pool');
    });
});

describe('getOutcome', () => {
    it('returns "Critical Success" for critical', () => {
        expect(getOutcome(6, true)).toBe('Critical Success');
    });

    it('returns "Success" for 6', () => {
        expect(getOutcome(6, false)).toBe('Success');
    });

    it('returns "Costly" for 4-5', () => {
        expect(getOutcome(4, false)).toBe('Costly');
        expect(getOutcome(5, false)).toBe('Costly');
    });

    it('returns "Crisis" for 1-3', () => {
        expect(getOutcome(1, false)).toBe('Crisis');
        expect(getOutcome(2, false)).toBe('Crisis');
        expect(getOutcome(3, false)).toBe('Crisis');
    });
});

describe('getOutcomeColor', () => {
    it('returns the right color for each outcome', () => {
        expect(getOutcomeColor('Critical Success')).toBe('#FFD700'); // Gold
        expect(getOutcomeColor('Success')).toBe('#4CAF50'); // Green
        expect(getOutcomeColor('Costly')).toBe('#FFA500'); // Orange
        expect(getOutcomeColor('Crisis')).toBe('#F44336'); // Red
    });

    it('returns red for an unknown outcome', () => {
        expect(getOutcomeColor('Unknown')).toBe('#F44336');
    });
});

describe('getDieClass', () => {
    it('maps die values to outcome classes', () => {
        expect(getDieClass(1)).toBe('crisis');
        expect(getDieClass(3)).toBe('crisis');
        expect(getDieClass(4)).toBe('costly');
        expect(getDieClass(5)).toBe('costly');
        expect(getDieClass(6)).toBe('success');
    });
});

describe('formatAncientAnchorsRoll', () => {
    it('formats a roll for the history log', () => {
        const result = {
            rolls: [3, 5, 2],
            result: 5,
            outcome: 'Costly',
            isCritical: false
        };

        expect(formatAncientAnchorsRoll(result)).toBe('Rolled 3d6 [3, 5, 2] = 5 (Costly)');
    });
});

describe('getAncientAnchorsProbabilities', () => {
    it('returns all four outcomes for every legal pool', () => {
        for (let i = MIN_DICE; i <= MAX_DICE; i++) {
            const probabilities = getAncientAnchorsProbabilities(i);

            expect(probabilities).toHaveProperty('crisis');
            expect(probabilities).toHaveProperty('costly');
            expect(probabilities).toHaveProperty('success');
            expect(probabilities).toHaveProperty('critical');
        }
    });

    it('probabilities sum to 1 for every legal pool', () => {
        for (let i = MIN_DICE; i <= MAX_DICE; i++) {
            const { crisis, costly, success, critical } = getAncientAnchorsProbabilities(i);

            expect(crisis + costly + success + critical).toBeCloseTo(1.0, 10);
        }
    });

    it('matches hand-calculated values for 1 die', () => {
        const { crisis, costly, success, critical } = getAncientAnchorsProbabilities(1);

        expect(crisis).toBeCloseTo(0.5, 10);
        expect(costly).toBeCloseTo(1 / 3, 10);
        expect(success).toBeCloseTo(1 / 6, 10);
        expect(critical).toBeCloseTo(0, 10);
    });

    it('matches hand-calculated values for 2 dice', () => {
        const { crisis, costly, success, critical } = getAncientAnchorsProbabilities(2);

        expect(crisis).toBeCloseTo(9 / 36, 10);
        expect(costly).toBeCloseTo(16 / 36, 10);
        expect(success).toBeCloseTo(10 / 36, 10);
        expect(critical).toBeCloseTo(1 / 36, 10);
    });

    it('more dice means less crisis and more criticals', () => {
        const small = getAncientAnchorsProbabilities(1);
        const large = getAncientAnchorsProbabilities(4);

        expect(large.crisis).toBeLessThan(small.crisis);
        expect(large.critical).toBeGreaterThan(small.critical);
    });

    it('throws for dice counts outside the allowed range', () => {
        expect(() => getAncientAnchorsProbabilities(0)).toThrow('Invalid number of dice');
        expect(() => getAncientAnchorsProbabilities(7)).toThrow('Invalid number of dice');
    });
});
