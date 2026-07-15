import base64
import json
import os
import re
import sys
import urllib.request

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')
OPENAI_ENDPOINT = os.getenv('OPENAI_ENDPOINT', 'https://api.openai.com/v1/chat/completions')


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
    keywords = ['react', 'javascript', 'python', 'node', 'express', 'tailwind', 'docker', 'aws', 'mongodb', 'git', 'testing', 'nlp', 'machine learning']
    found = {kw: len(re.findall(rf'\b{re.escape(kw)}\b', text, re.I)) for kw in keywords}
    return [kw for kw, count in found.items() if count > 0]


def score_resume(text, skills):
    score = 60
    if 'resume' in text.lower():
        score += 6
    if 'experience' in text.lower():
        score += 8
    score += min(len(skills) * 3, 20)
    score += min(int(len(text) / 300), 10)
    return min(score, 100)


def build_feedback(skills, text):
    strengths = []
    weaknesses = []
    suggestions = []

    if any(k in skills for k in ['react', 'javascript', 'tailwind']):
        strengths.append('Strong modern frontend technology mention.')
    if any(k in skills for k in ['docker', 'aws', 'mongodb']):
        strengths.append('Includes cloud or containerization experience.')
    if any(k in skills for k in ['python', 'nlp', 'machine learning']):
        strengths.append('Highlights data or ML-related skills.')

    lower_text = text.lower()
    if 'test' not in lower_text and 'jest' not in lower_text and 'vitest' not in lower_text:
        weaknesses.append('No automated testing frameworks explicitly mentioned.')
        suggestions.append('Add a section that mentions testing tools or automation practices.')
    if 'docker' not in lower_text and 'kubernetes' not in lower_text:
        weaknesses.append('Limited container deployment or cloud infrastructure detail.')
        suggestions.append('Consider adding a Docker/Kubernetes or cloud deployment example.')
    if 'data' not in lower_text and 'sql' not in lower_text and 'mongodb' not in lower_text and 'api' not in lower_text:
        suggestions.append('Include more backend, database, or API implementation details if relevant.')

    if not strengths:
        strengths.append('Resume has a clear structure and readable content.')
    if not weaknesses:
        weaknesses.append('Add more explicit technical detail for a stronger score.')
    if not suggestions:
        suggestions.append('Refine the resume with more concrete examples of projects and tools used.')

    return strengths, weaknesses, suggestions


def openai_analyze(text, file_name):
    if not OPENAI_API_KEY:
        raise RuntimeError('OPENAI_API_KEY is not configured')

    prompt = (
        'You are an AI resume reviewer. Analyze the candidate resume text and return a JSON object with keys:'
        ' score, atsScore, skills, strengths, weaknesses, suggestions.'
        ' Use numeric values for score and atsScore, and arrays for skills, strengths, weaknesses, suggestions.'
        ' Do not return any additional fields.'
        ' Resume text:'
        f'\n\n{text[:4000]}'
    )

    body = {
        'model': OPENAI_MODEL,
        'messages': [
            {'role': 'system', 'content': 'You are a helpful resume analysis assistant.'},
            {'role': 'user', 'content': prompt}
        ],
        'temperature': 0.3,
        'max_tokens': 500
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
        raw_response = response.read().decode('utf-8')
        data = json.loads(raw_response)
        content = data['choices'][0]['message']['content']
        return json.loads(content)


def analyze_with_openai(text, file_name):
    try:
        result = openai_analyze(text, file_name)
        if not isinstance(result, dict):
            raise ValueError('OpenAI response not a JSON object')
        return result
    except Exception as err:
        print(f'OpenAI analysis failed: {err}', file=sys.stderr)
        return None


def main():
    payload = load_input()
    content_base64 = payload.get('contentBase64', '')
    file_name = payload.get('fileName', 'resume.pdf')

    text = decode_resume_content(content_base64)
    if not text and file_name.lower().endswith('.pdf'):
        text = f'Parsed resume file: {file_name}'

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
        'analysisType': 'python-nlp'
    }

    if OPENAI_API_KEY:
        openai_result = analyze_with_openai(text, file_name)
        if openai_result:
            result.update({
                'score': openai_result.get('score', result['score']),
                'atsScore': openai_result.get('atsScore', result['atsScore']),
                'skills': openai_result.get('skills', result['skills']),
                'strengths': openai_result.get('strengths', result['strengths']),
                'weaknesses': openai_result.get('weaknesses', result['weaknesses']),
                'suggestions': openai_result.get('suggestions', result['suggestions']),
                'analysisType': 'openai'
            })

    sys.stdout.write(json.dumps(result))


if __name__ == '__main__':
    main()
