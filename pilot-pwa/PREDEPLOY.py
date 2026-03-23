#!/usr/bin/env python3
"""Run this before deploying to strip injections and inline pilot-app.js"""
import re

path = '/workspace/aerotech-platform/pilot-pwa/index.html'
js_path = '/workspace/aerotech-platform/pilot-pwa/pilot-app.js'

c = open(path).read()
js = open(js_path).read()

# Strip injections — broader pattern to catch any variant
c = re.sub(r'<script[^>]*>(?:(?!</script>)[\s\S])*?__iframeHighlightInitialized[\s\S]*?</script>', '', c)
c = re.sub(r'\n{4,}', '\n\n', c)

# Remove any previously inlined module script (handles prior PREDEPLOY runs)
c = re.sub(r'<script type="module" src="pilot-app\.js"></script>', '', c)
c = re.sub(r'<script type="module">\s*// pilot-app\.js[\s\S]*?</script>', '', c)
# Strip any large inlined module block (>8000 chars = definitely inlined app code)
c = re.sub(r'<script type="module">([\s\S]{8000,}?)</script>', '', c)

# Re-inline fresh copy of pilot-app.js before </body>
inline = '<script type="module">\n// pilot-app.js\n' + js + '\n</script>'
c = c.replace('</body>', inline + '\n</body>')

open(path, 'w').write(c)
injections = c.count('__iframeHighlightInitialized')
print(f"Ready to deploy: {len(c)} chars, injections: {injections}")
if injections > 0:
    print("WARNING: injection still present!")
