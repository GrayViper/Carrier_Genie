import { describe, it, expect } from 'vitest';
import { calculateAtsScore, generateAtsSuggestions } from './resume';

describe('resume utils', () => {
  it('calculates ATS score with skills and report score', () => {
    const skills = ['React', 'Node.js', 'Docker', 'Postgres'];
    const score = calculateAtsScore(skills, 80);
    // reportScore weighted 0.6 => 48 + skillContribution (4*5=20) => 68
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('generates suggestions when score is low', () => {
    const suggestions = generateAtsSuggestions(['React'], { weaknesses: ['no tests'], suggestions: ['Add tests'] }, 55);
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.some(s => s.toLowerCase().includes('keywords') || s.toLowerCase().includes('testing'))).toBe(true);
  });

  it('returns positive message when resume strong', () => {
    const suggestions = generateAtsSuggestions(['A','B','C','D','E','F','G'], { suggestions: [] }, 85);
    expect(suggestions.length).toBeGreaterThan(0);
  });
});
