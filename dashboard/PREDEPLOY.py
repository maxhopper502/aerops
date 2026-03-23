#!/usr/bin/env python3
"""Dashboard PREDEPLOY: strips iframe injection scripts before every deploy."""
import re, sys

path = '/workspace/aerotech-platform/dashboard/index.html'
c = open(path).read()
before = len(c)

# Pattern 1: injection blocks with Chinese comment header
c = re.sub(r'\n?<script>\n/\*\*\n \* Iframe [\s\S]*?</script>', '', c)
# Pattern 2: any script block containing the injection marker
c = re.sub(r'<script>(?:(?!</script>)[\s\S])*?__iframeHighlightInitialized[\s\S]*?</script>', '', c)
# Pattern 3: minimax floating ball (if unwanted)
# c = re.sub(r'<div id="minimax-floating-ball"[\s\S]*?</div>\s*<script>[\s\S]*?initFloatingBall[\s\S]*?</script>', '', c)

after = len(c)
remaining = c.count('__iframeHighlightInitialized')
print(f"Stripped {before-after} chars | injections remaining: {remaining} | file: {after}")
if remaining > 0:
    print("WARNING: injections still present!")
    sys.exit(1)
open(path, 'w').write(c)
print("✅ Clean and ready to deploy")
