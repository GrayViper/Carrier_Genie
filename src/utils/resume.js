export function calculateAtsScore(parsedSkills = [], reportScore = 50) {
  // Simple heuristic ATS score:
  // - base from AI report score (0-100) weighted 0.6
  // - skills coverage contributes up to 40 points (more skills => higher ATS)
  const skillContribution = Math.min(parsedSkills.length * 5, 40); // each skill up to 5 points
  const score = Math.round((reportScore * 0.6) + skillContribution);
  return Math.max(0, Math.min(100, score));
}

export function generateAtsSuggestions(parsedSkills = [], feedback = {}, atsScore = 50) {
  const suggestions = [];

  if (atsScore < 70) {
    suggestions.push('Add role-specific keywords (look at job descriptions for exact phrasing).');
  }

  if ((parsedSkills || []).length < 6) {
    suggestions.push('List more concrete technical skills with versions (e.g., React 18, Node 20).');
  }

  if (feedback && feedback.weaknesses && feedback.weaknesses.length > 0) {
    suggestions.push(...feedback.suggestions.slice(0, 3));
  }

  if (suggestions.length === 0) suggestions.push('Resume looks strong for ATS parsing. Emphasize measurable outcomes where possible.');

  return suggestions;
}
