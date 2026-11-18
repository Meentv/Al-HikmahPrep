"""Bundle a portable, dependency-free HikmahPrep static release."""
from base64 import b64encode
from hashlib import sha256
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
SITE = ROOT / 'site'


def asset(name, media):
    return f'data:{media};base64,' + b64encode((SRC / 'assets' / name).read_bytes()).decode('ascii')


style = '\n'.join((SRC / 'css' / name).read_text() for name in ['system.css', 'shell.css', 'desk.css', 'learning.css', 'glass.css'])
for token, name, media in [
    ('@@FONT_MANROPE@@', 'manrope.woff2', 'font/woff2'),
    ('@@FONT_ARABIC@@', 'noto-arabic.woff2', 'font/woff2'),
    ('@@DESK_ART@@', 'glass-book.webp', 'image/webp'),
]:
    style = style.replace(token, asset(name, media))

modules = ['core', 'catalog', 'store', 'analytics', 'components', 'dashboard', 'quiz', 'sessions', 'learning', 'insights', 'notebook', 'overlays', 'motion']
sources = [SRC / 'questions.js', SRC / 'gns204.js', *(SRC / 'data' / f'{name}.js' for name in ['arabic-revision','business-revision','revision']), *(SRC / 'modules' / f'{name}.js' for name in modules), SRC / 'app.js']
script = "\n(() => {\n'use strict';\n" + '\n'.join(path.read_text(encoding='utf-8') for path in sources) + '\n})();\n'
assert '</script' not in script.lower(), 'Closing script token in source'
digest = b64encode(sha256(script.encode('utf-8')).digest()).decode('ascii')
csp = ("default-src 'none'; " + f"script-src 'sha256-{digest}'; "
       "style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; "
       "object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'")

markup = (SRC / 'shell.html').read_text(encoding='utf-8')
markup = markup.replace('@@SPRITE@@', (SRC / 'sprite.svg').read_text(encoding='utf-8'))
markup = markup.replace('@@CSP@@', csp).replace('@@STYLE@@', style).replace('@@SCRIPT@@', script)
licenses = '\n\n'.join((SRC / 'licenses' / name).read_text(encoding='utf-8').strip() for name in ['Manrope-OFL.txt', 'Noto-Sans-Arabic-OFL.txt'])
markup = markup.replace('</html>', f'<!-- Embedded font licence notices\n{licenses}\n-->\n</html>')
assert not re.search(r'@@[A-Z_]+@@', markup), 'One or more asset placeholders were not embedded'
SITE.mkdir(exist_ok=True)
temporary = SITE / '.index.new'
temporary.write_bytes(markup.encode('utf-8'))
temporary.replace(SITE / 'index.html')
(SITE / '_headers').write_text(f'''/*
  Content-Security-Policy: {csp}; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Frame-Options: DENY
''', encoding='utf-8')
print(f'Built site/index.html ({len(markup.encode("utf-8")) / 1024:.0f} KiB) and site/_headers')
