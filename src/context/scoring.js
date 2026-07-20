/**
 * Calculates a match score between a job's required skills and a user's skills.
 * @param {string[]} jobSkills - Array of the job's required skills.
 * @param {string[]} userSkills - Array of the user's skills.
 * @returns {number} - A match score percentage from 0 to 100.
 *                     Returns 30 as a base score when the user has no skills.
 *                     Returns 0 when the job has no skills listed.
 */
export const calculateMatchScore = (jobSkills, userSkills) => {
    if (!jobSkills || jobSkills.length === 0) {
        return 0;
    }
    if (!userSkills || userSkills.length === 0) {
        return 30;
    }

    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const matchedSkills = jobSkills.filter(js => {
        const jsLower = js.toLowerCase();
        return userSkillsLower.some(
            us => us === jsLower || us.includes(jsLower) || jsLower.includes(us)
        );
    });

    return Math.round((matchedSkills.length / jobSkills.length) * 100);
};