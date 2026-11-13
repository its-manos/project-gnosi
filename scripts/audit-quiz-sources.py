#!/usr/bin/env python3
"""Refresh source retrieval evidence; this does not replace factual/editorial review.

Python standard library; PDF extraction additionally needs pdftotext (Poppler).
Downloaded source text stays in the ignored .cache directory.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import subprocess
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SOURCES = json.loads((ROOT / 'content/quiz/sources.json').read_text())
CACHE = ROOT / '.cache/quiz-source-pages'
CACHE.mkdir(parents=True, exist_ok=True)
CHECKED = datetime.now(ZoneInfo('Europe/Athens')).date().isoformat()


def fetch(item):
    key, (_, url, _) = item
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; GnosiEditorial/1.0)'})
        with urllib.request.urlopen(request, timeout=20) as response:
            data, final, status = response.read(), response.url, response.status
        if data.startswith(b'%PDF'):
            result = subprocess.run(['pdftotext', '-layout', '-', '-'], input=data, capture_output=True, check=True)
            text = result.stdout.decode()
        else:
            text = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', data.decode(errors='replace'), flags=re.S)
            text = re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', text))
        (CACHE / (key + '.txt')).write_text(text)
        return key, {'url': url, 'finalUrl': final, 'status': status, 'sha256': hashlib.sha256(data).hexdigest(),
                     'characters': len(text), 'checkedAt': CHECKED, 'format': 'pdf' if data.startswith(b'%PDF') else 'html'}
    except Exception as error:
        return key, {'url': url, 'error': str(error), 'checkedAt': CHECKED}


with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
    results = dict(executor.map(fetch, SOURCES.items()))
(ROOT / 'content/quiz/source-audit.json').write_text(json.dumps(results, indent=2) + '\n')
failures = {key: value.get('error', 'Source body too short') for key, value in results.items()
            if value.get('status') != 200 or value.get('characters', 0) < 700}
print(json.dumps({'checked': len(results), 'failures': failures}))
raise SystemExit(bool(failures))
