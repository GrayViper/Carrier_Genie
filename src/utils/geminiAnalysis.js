/**
 * Calls the Gemini API directly from the browser to analyze a resume.
 * Falls back to keyword-based local analysis if the key is missing or call fails.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL   = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/** Extract plain text from a base64-encoded file (best-effort for PDFs) */
function extractText(base64) {
  try {
    return atob(base64);
  } catch {
    return '';
  }
}

/** Simple keyword-based fallback when Gemini is unavailable */
function localAnalysis(text) {
  const keywords = [
    'react', 'javascript', 'typescript', 'python', 'node', 'express',
    'tailwind', 'docker', 'aws', 'mongodb', 'postgresql', 'git',
    'testing', 'jest', 'machine learning', 'fastapi', 'graphql'
  ];
  const lower = text.toLowerCase();
  const skills = keywords.filter(k => lower.includes(k));
  const score  = Math.min(100, 60 + skills.length * 3 + Math.min(10, Math.floor(text.length / 300)));
  const atsScore = Math.max(50, score - 4);

  return {
    score,
    atsScore,
    skills,
    strengths: [
      skills.length > 0
        ? `Detected ${skills.length} relevant technical skill${skills.length > 1 ? 's' : ''}: ${skills.slice(0, 3).join(', ')}.`
        : 'Resume content was read successfully.',
      'Document structure appears well-formatted.'
    ],
    weaknesses: [
      !lower.includes('test') ? 'No testing framework mentioned.' : 'Could expand on testing experience.',
      !lower.includes('docker') && !lower.includes('aws') ? 'Limited cloud/DevOps keywords.' : 'Could add more deployment detail.'
    ],
    suggestions: [
      'Add quantifiable achievements (e.g. "reduced load time by 40%").',
      'Include links to GitHub or portfolio projects.',
      'List tools and frameworks explicitly in a skills section.'
    ],
    analysisType: 'local-keyword'
  };
}

/** Call Gemini and parse the JSON response */
async function callGemini(text) {
  const prompt = `You are an expert resume reviewer. Analyse the following resume text and return ONLY a valid JSON object with exactly these keys:
- score: integer 0-100 (overall resume quality)
- atsScore: integer 0-100 (ATS compatibility)
- skills: array of strings (technical skills detected)
- strengths: array of 3 strings (what the resume does well)
- weaknesses: array of 3 strings (what is missing or weak)
- suggestions: array of 3 strings (specific improvements)

Do not include markdown, code fences, or any text outside the JSON object.

Resume text:
${text.slice(0, 4000)}`;

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
    })
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json();
  let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  // Strip markdown code fences if present
  raw = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();

  return { ...JSON.parse(raw), analysisType: 'gemini' };
}

/**
 * Main entry point.
 * @param {string} base64 - base64-encoded resume file content
 * @param {string} fileName - original file name
 * @returns {Promise<object>} analysis result
 */
export async function analyzeResume(base64, fileName) {
  const text = extractText(base64) || `Resume file: ${fileName}`;

  if (!GEMINI_API_KEY) {
    return localAnalysis(text);
  }

  try {
    const result = await callGemini(text);
    // Validate the response has required fields
    if (result && typeof result.score === 'number' && Array.isArray(result.strengths)) {
      return result;
    }
    return localAnalysis(text);
  } catch (err) {
    console.warn('Gemini analysis failed, using local fallback:', err.message);
    return localAnalysis(text);
  }
}
