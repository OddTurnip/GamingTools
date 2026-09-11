/**
 * ancient-anchors.js - Ancient Anchors dice system
 *
 * Pure functions for Ancient Anchors dice rolling.
 * Uses d6 dice pools where you take the highest result.
 *
 * Results: 1-3 = Crisis, 4-5 = Costly, 6 = Success, Multiple 6s = Critical Success
 *
 * Unlike Blades in the Dark there is no zero-dice roll: the pool is always
 * at least one die, and the default pool is two dice.
 */

import { rollSingleDie } from '../code/dice-library.js';

/** Smallest allowed dice pool */
export const MIN_DICE = 1;

/** Largest allowed dice pool */
export const MAX_DICE = 6;

/** Default dice pool */
export const DEFAULT_DICE = 2;

/**
 * Roll a single d6
 * @returns {number} 1-6
 */
export function rollD6() {
    return rollSingleDie(6);
}

/**
 * Clamp a dice count into the allowed pool range (MIN_DICE..MAX_DICE)
 * Useful for the +/- stepper controls in the UI.
 * @param {number} numDice - Requested number of dice
 * @returns {number} A valid dice count
 */
export function clampDiceCount(numDice) {
    if (!Number.isFinite(numDice)) {
        return DEFAULT_DICE;
    }

    const rounded = Math.round(numDice);

    if (rounded < MIN_DICE) return MIN_DICE;
    if (rounded > MAX_DICE) return MAX_DICE;

    return rounded;
}

/**
 * Determine the outcome based on the result
 * @param {number} result - The highest die result
 * @param {boolean} [isCritical=false] - Whether this is a critical success
 * @returns {string} - The outcome text
 */
export function getOutcome(result, isCritical = false) {
    if (isCritical) {
        return 'Critical Success';
    } else if (result === 6) {
        return 'Success';
    } else if (result >= 4) {
        return 'Costly';
    } else {
        return 'Crisis';
    }
}

/**
 * Get the color for an outcome (for UI styling)
 * Colors are intentionally hardcoded: they signal game mechanics, not theme.
 * @param {string} outcome - The outcome text
 * @returns {string} - Color code
 */
export function getOutcomeColor(outcome) {
    switch (outcome) {
        case 'Critical Success':
            return '#FFD700'; // Gold
        case 'Success':
            return '#4CAF50'; // Green
        case 'Costly':
            return '#FFA500'; // Orange
        case 'Crisis':
        default:
            return '#F44336'; // Red
    }
}

/**
 * Get CSS class for a die value
 * @param {number} value - Die value 1-6
 * @returns {string} CSS class name
 */
export function getDieClass(value) {
    if (value <= 3) return 'crisis';
    if (value <= 5) return 'costly';
    return 'success';
}

/**
 * Evaluate a dice pool result
 * @param {number[]} dice - Array of die values
 * @returns {Object} { result, outcome, isCritical, selectedIndex }
 */
export function evaluateDicePool(dice) {
    if (!Array.isArray(dice) || dice.length === 0) {
        throw new Error('Cannot evaluate an empty dice pool.');
    }

    const sixCount = dice.filter(d => d === 6).length;
    const result = Math.max(...dice);
    const isCritical = sixCount >= 2;
    const outcome = getOutcome(result, isCritical);

    // Index of the die that decided the result (first occurrence)
    const selectedIndex = dice.indexOf(result);

    return {
        result,
        outcome,
        isCritical,
        selectedIndex
    };
}

/**
 * Roll an Ancient Anchors dice pool
 * @param {number} numDice - Number of dice to roll (1-6)
 * @returns {Object} - { rolls: number[], result: number, outcome: string, isCritical: boolean }
 */
export function rollAncientAnchorsDice(numDice) {
    if (!Number.isInteger(numDice) || numDice < MIN_DICE) {
        throw new Error(`Invalid number of dice: ${numDice}. Must be an integer of at least ${MIN_DICE}.`);
    }

    const rolls = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(rollSingleDie(6));
    }

    const { result, outcome, isCritical } = evaluateDicePool(rolls);

    return {
        rolls,
        result,
        outcome,
        isCritical
    };
}

/**
 * Format an Ancient Anchors roll for history display
 * @param {Object} result - Result object from rollAncientAnchorsDice
 * @returns {string} - Formatted string like "Rolled 3d6 [4, 6, 2] = 6 (Success)"
 */
export function formatAncientAnchorsRoll(result) {
    const { rolls, result: dieResult, outcome } = result;
    const rollsString = rolls.join(', ');

    return `Rolled ${rolls.length}d6 [${rollsString}] = ${dieResult} (${outcome})`;
}

/**
 * Calculate outcome probabilities for Ancient Anchors dice pools
 * @param {number} numDice - Number of dice in the pool (1-6)
 * @returns {Object} - { crisis: number, costly: number, success: number, critical: number }
 */
export function getAncientAnchorsProbabilities(numDice) {
    if (!Number.isInteger(numDice) || numDice < MIN_DICE || numDice > MAX_DICE) {
        throw new Error(`Invalid number of dice: ${numDice}. Must be ${MIN_DICE}-${MAX_DICE}.`);
    }

    // Exact probabilities for "highest of Nd6", crit = two or more 6s
    const crisis = Math.pow(1 / 2, numDice);                                 // all dice 1-3
    const costly = Math.pow(5 / 6, numDice) - crisis;                        // highest is 4 or 5
    const success = numDice * (1 / 6) * Math.pow(5 / 6, numDice - 1);        // exactly one 6
    const critical = 1 - crisis - costly - success;                          // two or more 6s

    return { crisis, costly, success, critical };
}
