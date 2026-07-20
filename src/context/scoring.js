/**
 * Calculates a match score between a user's skills and a job's required skills.
 * @param {string[]} userSkills - Array of the user's skills.
 * @param {string[]} jobSkills - Array of the job's required skills.
 * @returns {number} - A match score percentage from 0 to 100.
 */
export const calculateMatchScore = (userSkills, jobSkills) => {
    if (!userSkills || !jobSkills || jobSkills.length === 0) {
        return 0;
    }

    const userSkillSet = new Set(userSkills.map(s => s.toLowerCase()));
    const matchedSkills = jobSkills.filter(s => userSkillSet.has(s.toLowerCase()));

    return Math.round((matchedSkills.length / jobSkills.length) * 100);
};