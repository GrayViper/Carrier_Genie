import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from './scoring';

describe('calculateMatchScore', () => {
    const jobSkills = ['React', 'Node.js', 'JavaScript', 'CSS'];

    it('should return 100 for a perfect match', () => {
        const userSkills = ['React', 'Node.js', 'JavaScript', 'CSS'];
        expect(calculateMatchScore(jobSkills, userSkills)).toBe(100);
    });

    it('should return 50 for a half match', () => {
        const userSkills = ['React', 'Node.js'];
        // 2/4 skills match = 50%, which is > 35, so it should return 50.
        expect(calculateMatchScore(jobSkills, userSkills)).toBe(50);
    });

    it('should be case-insensitive', () => {
        const userSkills = ['react', 'node.js'];
        expect(calculateMatchScore(jobSkills, userSkills)).toBe(50);
    });

    it('should handle partial matches (e.g., "JavaScript" vs "JS")', () => {
        const userSkillsWithPartial = ['JS', 'React'];
        // The logic `us.includes(js) || js.includes(us)` should catch this.
        expect(calculateMatchScore(jobSkills, userSkillsWithPartial)).toBe(50);
    });

    it('should return a base score of 30 if the user has no skills', () => {
        const userSkills = [];
        expect(calculateMatchScore(jobSkills, userSkills)).toBe(30);
    });

    it('should return 0 if the job has no skills listed', () => {
        const userSkills = ['React', 'Node.js'];
        expect(calculateMatchScore([], userSkills)).toBe(0);
    });
});