import base64
import json
import os
import re
import sys
import urllib.request

GEMINI_API_KEY  = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL    = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
GEMINI_ENDPOINT = os.getenv(
    'GEMINI_ENDPOINT',
    f'https://generativelanguage.googleapis.com/v1beta/models/{os.getenv("GEMINI_MODEL", "gemini-1.5-flash")}:generateContent'
)


def load_input():
    try:
        raw = sys.stdin.read()
        if not raw:
            raise ValueError('no input received')
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f'Invalid JSON input: {exc}')


def decode_resume_content(encoded):
    try:
        return base64.b64decode(encoded).decode('utf-8', errors='ignore')
    except Exception:
        return ''


def analyze_keywords(text):
    keywords = [
        'react', 'javascript', 'typescript', 'python', 'node', 'express',
        'tailwind', 'docker', 'aws', 'mongodb', 'postgresql', 'git',
        'testing', 'jest', 'nlp', 'machine learning', 'fastapi', 'graphql'
    ]
    found = {kw: len(re.findall(rf'\b{re.escape(kw)}\b', text, re.I)) for kw in keywords}
    return [kw for kw, count in found.items() if count > 0]


def score_resume(text, skills):
    score = 60
    if 'experience' in text.lower():
        score += 8
    score += min(len(skills) * 3, 20)
    score += min(int(len(text) / 300), 10)
    return min(score, 100)


def build_feedback(skills, text):
    strengths, weaknesses, suggestions = [], [], []

    if any(k in skills for k in ['react', 'javascript', 'typescript', 'tailwind']):
        strengths.append('Strong modern frontend technology stack mentioned.')
    if any(k in skills for k in ['docker', 'aws', 'mongodb', 'postgresql']):
        strengths.append('Includes cloud, database, or containerisation experience.')
    if any(k in skills for k in ['python', 'nlp', 'machine learning', 'fastapi']):
        strengths.append('Highlights data science or ML-related skills.')

    lower = text.lower()
    if 'test' not in lower and 'jest' not in lower and 'vitest' not in lower:
        weaknesses.append('No automated testing frameworks explicitly mentioned.')
        suggestions.append('Add a section mentioning testing tools or automation practices.')
    if 'docker' not in lower and 'kubernetes' not in lower:
        weaknesses.append('Limited container or cloud infrastructure detail.')
        suggestions.append('Consider adding a Docker/cloud deployment example.')
    if 'api' not in lower and 'backend' not in lower and 'server' not in lower:
        suggestions.append('Include backend or API implementation details if relevant.')

    if not strengths:
        strengths.append('Resume has a clear structure and readable content.')
    if not weaknesses:
        weaknesses.append('Add more explicit technical detail for a stronger score.')
    if not suggestions:
        suggestions.append('Refine the resume with concrete project and tooling examples.')

    return strengths, weaknesses, suggestions


def gemini_analyze(text):
    """Call the Gemini generateContent API and return parsed feedback dict."""
    if not GEMINI_API_KEY:
        raise RuntimeError('GEMINI_API_KEY is not configured')

    prompt = (
        'You are an expert resume reviewer. Analyse the following resume text and return '
        'ONLY a valid JSON object with exactly these keys: '
        'score (integer 0-100), atsScore (integer 0-100), '
        'skills (array of strings), strengths (array of strings), '
        'weaknesses (array of strings), suggestions (array of strings). '
        'Do not include markdown, code fences, or any text outside the JSON object.\n\n'
        f'Resume text:\n{text[:4000]}'
    )

    body = {
        'contents': [
            {
                'parts': [{'text': prompt}]
            }
        ],
        'generationConfig': {
            'temperature': 0.3,
            'maxOutputTokens': 600
        }
    }

    url = f'{GEMINI_ENDPOINT}?key={GEMINI_API_KEY}'
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.loads(response.read().decode('utf-8'))

    # Gemini wraps the response in candidates[0].content.parts[0].text
    raw_text = data['candidates'][0]['content']['parts'][0]['text'].strip()

    # Strip markdown code fences if Gemini wraps the JSON anyway
    if raw_text.startswith('```'):
        raw_text = re.sub(r'^```[a-z]*\n?', '', raw_text)
        raw_text = re.sub(r'\n?```$', '', raw_text).strip()

    return json.loads(raw_text)


def analyze_with_gemini(text):
    try:
        result = gemini_analyze(text)
        if not isinstance(result, dict):
            raise ValueError('Gemini response is not a JSON object')
        return result
    except Exception as err:
        print(f'Gemini analysis failed: {err}', file=sys.stderr)
        return None


def main():
    payload = load_input()
    content_base64 = payload.get('contentBase64', '')
    file_name      = payload.get('fileName', 'resume.pdf')

    text = decode_resume_content(content_base64)
    if not text and file_name.lower().endswith('.pdf'):
        text = f'Parsed resume file: {file_name}'

    # Local keyword-based fallback analysis (always runs first)
    skills = analyze_keywords(text)
    score  = score_resume(text, skills)
    strengths, weaknesses, suggestions = build_feedback(skills, text)
    ats_score = max(50, min(100, score - 4))

    result = {
        'score':        score,
        'atsScore':     ats_score,
        'skills':       skills,
        'strengths':    strengths,
        'weaknesses':   weaknesses,
        'suggestions':  suggestions,
        'analysisType': 'python-nlp'
    }

    # Upgrade with Gemini AI analysis when API key is present
    if GEMINI_API_KEY:
        gemini_result = analyze_with_gemini(text)
        if gemini_result:
            result.update({
                'score':        gemini_result.get('score',       result['score']),
                'atsScore':     gemini_result.get('atsScore',    result['atsScore']),
                'skills':       gemini_result.get('skills',      result['skills']),
                'strengths':    gemini_result.get('strengths',   result['strengths']),
                'weaknesses':   gemini_result.get('weaknesses',  result['weaknesses']),
                'suggestions':  gemini_result.get('suggestions', result['suggestions']),
                'analysisType': 'gemini'
            })

    sys.stdout.write(json.dumps(result))


if __name__ == '__main__':
    main()
