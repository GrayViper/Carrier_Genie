import base64
import json
import os
import re
import sys
import urllib.request

# Gemini is the preferred AI provider (free tier available).
# OpenAI is used as fallback if GEMINI_API_KEY is not set.
# If neither key is set, the local NLP analyser runs instead.

GEMINI_API_KEY  = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL    = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
GEMINI_ENDPOINT = (
    f'https://generativelanguage.googleapis.com/v1beta/models/'
    f'{os.getenv("GEMINI_MODEL", "gemini-1.5-flash")}:generateContent'
)

OPENAI_API_KEY  = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL    = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')
OPENAI_ENDPOINT = os.getenv('OPENAI_ENDPOINT', 'https://api.openai.com/v1/chat/completions')


# ---------------------------------------------------------------------------
# Input / decode helpers
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Local NLP fallback (no external API)
# ---------------------------------------------------------------------------

def analyze_keywords(text):
    keywords = [
        'react', 'javascript', 'python', 'node', 'express', 'tailwind',
        'docker', 'aws', 'mongodb', 'git', 'testing', 'nlp', 'machine learning',
        'typescript', 'graphql', 'kubernetes', 'ci/cd', 'agile', 'sql', 'java',
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
    lower = text.lower()

    if any(k in skills for k in ['react', 'javascript', 'tailwind', 'typescript']):
        strengths.append('Strong modern frontend technology stack mentioned.')
    if any(k in skills for k in ['docker', 'aws', 'kubernetes', 'ci/cd']):
        strengths.append('Includes cloud or containerisation experience.')
    if any(k in skills for k in ['python', 'nlp', 'machine learning', 'sql']):
        strengths.append('Highlights data, ML, or backend engineering skills.')

    if 'test' not in lower and 'jest' not in lower and 'vitest' not in lower:
        weaknesses.append('No automated testing frameworks explicitly mentioned.')
        suggestions.append('Add testing tools or automation practices (Jest, Vitest, Cypress).')
    if 'docker' not in lower and 'kubernetes' not in lower:
        weaknesses.append('Limited container or cloud infrastructure detail.')
        suggestions.append('Consider adding a Docker/cloud deployment example.')
    if 'api' not in lower and 'mongodb' not in lower and 'sql' not in lower:
        suggestions.append('Include more backend, database, or API implementation details.')

    if not strengths:
        strengths.append('Resume has a clear structure and readable content.')
    if not weaknesses:
        weaknesses.append('Add more explicit technical detail for a stronger score.')
    if not suggestions:
        suggestions.append('Refine with concrete project examples and specific tools used.')

    return strengths, weaknesses, suggestions


# ---------------------------------------------------------------------------
# Gemini API
# ---------------------------------------------------------------------------

RESUME_PROMPT = (
    'You are an expert resume reviewer for a tech recruitment platform. '
    'Analyse the resume text below and return ONLY a valid JSON object with exactly these keys: '
    'score (integer 0-100), atsScore (integer 0-100), skills (array of strings), '
    'strengths (array of strings), weaknesses (array of strings), suggestions (array of strings). '
    'Do not include markdown, code fences, or any other text. '
    'Resume text:\n\n'
)


def gemini_analyze(text):
    if not GEMINI_API_KEY:
        raise RuntimeError('GEMINI_API_KEY is not configured')

    url = f'{GEMINI_ENDPOINT}?key={GEMINI_API_KEY}'
    body = {
        'contents': [
            {
                'parts': [
                    {'text': RESUME_PROMPT + text[:6000]}
                ]
            }
        ],
        'generationConfig': {
            'temperature': 0.2,
            'maxOutputTokens': 1024,
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.loads(response.read().decode('utf-8'))
        # Gemini returns: candidates[0].content.parts[0].text
        raw_text = data['candidates'][0]['content']['parts'][0]['text'].strip()
        # Strip any accidental markdown fences
        raw_text = re.sub(r'^```(?:json)?\s*', '', raw_text)
        raw_text = re.sub(r'\s*```$', '', raw_text)
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


# ---------------------------------------------------------------------------
# OpenAI API (fallback)
# ---------------------------------------------------------------------------

def openai_analyze(text):
    if not OPENAI_API_KEY:
        raise RuntimeError('OPENAI_API_KEY is not configured')

    body = {
        'model': OPENAI_MODEL,
        'messages': [
            {'role': 'system', 'content': 'You are a helpful resume analysis assistant.'},
            {'role': 'user', 'content': RESUME_PROMPT + text[:4000]}
        ],
        'temperature': 0.3,
        'max_tokens': 600
    }
    req = urllib.request.Request(
        OPENAI_ENDPOINT,
        data=json.dumps(body).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {OPENAI_API_KEY}'
        },
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.loads(response.read().decode('utf-8'))
        content = data['choices'][0]['message']['content'].strip()
        content = re.sub(r'^```(?:json)?\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        return json.loads(content)


def analyze_with_openai(text):
    try:
        result = openai_analyze(text)
        if not isinstance(result, dict):
            raise ValueError('OpenAI response is not a JSON object')
        return result
    except Exception as err:
        print(f'OpenAI analysis failed: {err}', file=sys.stderr)
        return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    payload = load_input()
    content_base64 = payload.get('contentBase64', '')
    file_name = payload.get('fileName', 'resume.pdf')

    text = decode_resume_content(content_base64)
    if not text and file_name.lower().endswith('.pdf'):
        text = f'Parsed resume file: {file_name}'

    # Local NLP baseline (always runs first, AI may override)
    skills = analyze_keywords(text)
    score = score_resume(text, skills)
    strengths, weaknesses, suggestions = build_feedback(skills, text)
    ats_score = max(50, min(100, score - 4))

    result = {
        'score': score,
        'atsScore': ats_score,
        'skills': skills,
        'strengths': strengths,
        'weaknesses': weaknesses,
        'suggestions': suggestions,
        'analysisType': 'local-nlp'
    }

    # Prefer Gemini, fall back to OpenAI, fall back to local NLP
    if GEMINI_API_KEY:
        ai_result = analyze_with_gemini(text)
        if ai_result:
            result.update({
                'score':       ai_result.get('score',       result['score']),
                'atsScore':    ai_result.get('atsScore',    result['atsScore']),
                'skills':      ai_result.get('skills',      result['skills']),
                'strengths':   ai_result.get('strengths',   result['strengths']),
                'weaknesses':  ai_result.get('weaknesses',  result['weaknesses']),
                'suggestions': ai_result.get('suggestions', result['suggestions']),
                'analysisType': 'gemini'
            })
    elif OPENAI_API_KEY:
        ai_result = analyze_with_openai(text)
        if ai_result:
            result.update({
                'score':       ai_result.get('score',       result['score']),
                'atsScore':    ai_result.get('atsScore',    result['atsScore']),
                'skills':      ai_result.get('skills',      result['skills']),
                'strengths':   ai_result.get('strengths',   result['strengths']),
                'weaknesses':  ai_result.get('weaknesses',  result['weaknesses']),
                'suggestions': ai_result.get('suggestions', result['suggestions']),
                'analysisType': 'openai'
            })

    sys.stdout.write(json.dumps(result))


if __name__ == '__main__':
    main()
