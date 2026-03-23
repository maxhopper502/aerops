#!/usr/bin/env python3
"""Run this before deploying to strip injections and inline pilot-app.js"""
import re, os

# Work relative to this script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(script_dir, 'index.html')
js_path = os.path.join(script_dir, 'pilot-app.js')

c = open(path).read()
js = open(js_path).read()

# Strip injections
c = re.sub(r'<script[^>]*>(?:(?!</script>)[\s\S])*?__iframeHighlightInitialized[\s\S]*?</script>', '', c)
c = re.sub(r'\n{4,}', '\n\n', c)

# Remove any previously inlined module script
c = re.sub(r'<script type="module" src="pilot-app\.js"></script>', '', c)
c = re.sub(r'<script type="module">\s*// pilot-app\.js[\s\S]*?</script>', '', c)
c = re.sub(r'<script type="module">([\s\S]{8000,}?)</script>', '', c)

# Re-inline fresh copy of pilot-app.js before </body>
inline = '<script type="module">\n// pilot-app.js\n' + js + '\n</script>'
c = c.replace('</body>', inline + '\n</body>')

open(path, 'w').write(c)
injections = c.count('__iframeHighlightInitialized')
print(f"Ready to deploy: {len(c)} chars, injections: {injections}")
if injections > 0:
    print("WARNING: injection still present!")
