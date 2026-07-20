/**
 * Calculates a match score between a job's required skills and a user's skills.
 * @param {string[]} jobSkills - An array of skills required for the job.
 * @param {string[]} [userSkills=[]] - An array of the user's skills.
 * @returns {number} A match score percentage between 0 and 100.
 */
export const calculateMatchScore = (jobSkills, userSkills = []) => {
    if (!jobSkills || jobSkills.length === 0) return 0;
    if (!userSkills || userSkills.length === 0) return 30; // base score if they have some general profile

    const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
    const userSkillsLower = userSkills.map(s => s.toLowerCase());

    let matchCount = 0;
    jobSkillsLower.forEach(js => {
        if (userSkillsLower.some(us => us.includes(js) || js.includes(us))) {
            matchCount++;
        }
    });

    const percent = Math.round((matchCount / jobSkills.length) * 100);
    // Return at least 35% if they have some general matching, max 100%
    return Math.max(percent, 35);
};