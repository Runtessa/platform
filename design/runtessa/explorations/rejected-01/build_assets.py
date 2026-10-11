"""Build the Runtessa identity study. Requires fontTools and system Inter fonts."""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parent
INK, PAPER, LIVE, FOREST, MUTED = '#172820', '#F4F3EC', '#C3F26B', '#2D674A', '#65746B'
FONT_ROOT = Path('/usr/share/fonts/rsms-inter-fonts')
FONTS = ROOT / 'fonts'
FONTS.mkdir(exist_ok=True)
for style in ['Regular', 'SemiBold']:
    font = TTFont(FONT_ROOT / f'Inter-{style}.ttf')
    font.flavor = 'woff2'
    font.save(FONTS / f'Inter-{style}.woff2')
(FONTS / 'LICENSE.txt').write_text(Path('/usr/share/licenses/rsms-inter-fonts/LICENSE.txt').read_text())

def svg(width, height, content, title):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{title}"><title>{title}</title>{content}</svg>\n'

def mark(main=INK, accent=FOREST):
    return f'<path fill="{main}" fill-rule="evenodd" d="M16 16H60L80 36V52L64 68H34V84H16ZM34 34V50H56L64 42L56 34Z"/><path fill="{accent}" d="M46 60H66L86 84H64Z"/>'

def wordmark(color=INK, x=0, y=0, size=64):
    font = TTFont(FONT_ROOT / 'Inter-SemiBold.ttf')
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale, cursor, paths = size / font['head'].unitsPerEm, 0, []
    for char in 'Runtessa':
        name = cmap[ord(char)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        paths.append(f'<path transform="translate({cursor:.3f},0)" d="{pen.getCommands()}"/>')
        cursor += font['hmtx'][name][0] - font['head'].unitsPerEm * .024
    return f'<g fill="{color}" transform="translate({x},{y}) scale({scale},-{scale})">{"".join(paths)}</g>'

def lockup(main, accent):
    return svg(420, 96, mark(main, accent) + wordmark(main, 112, 69, 58), 'Runtessa logo')

for name, main, accent in [('logo', INK, FOREST), ('logo-dark', PAPER, LIVE), ('logo-mono', INK, INK)]:
    (ROOT / f'{name}.svg').write_text(svg(96, 96, mark(main, accent), 'Runtessa symbol'))
    (ROOT / f'{name}-wordmark.svg').write_text(lockup(main, accent))
(ROOT / 'favicon.svg').write_text(svg(96, 96, f'<rect width="96" height="96" rx="20" fill="{INK}"/>' + mark(PAPER, LIVE), 'Runtessa'))

def rect(x, y, w, h, fill, radius=0, stroke=None):
    border = f' stroke="{stroke}"' if stroke else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}"{border}/>'

def text(x, y, value, size=18, fill=INK, weight=400, spacing=0, family='Inter, sans-serif'):
    return f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" letter-spacing="{spacing}" fill="{fill}">{value}</text>'

def symbol(x, y, size, main=INK, accent=FOREST):
    return f'<g transform="translate({x},{y}) scale({size / 96})">{mark(main, accent)}</g>'

def rule(y):
    return f'<path d="M64 {y}H1496" stroke="#D8DED3"/>'

board = rect(0, 0, 1560, 1270, PAPER)
board += symbol(54, 38, 68) + wordmark(INK, 142, 86, 43)
board += text(1150, 79, 'IDENTITY STUDY / 01', 14, MUTED, 600, 1.3)
board += text(64, 191, 'A LIVE APPLICATION PLATFORM', 13, FOREST, 600, 1.8)
board += text(58, 289, 'Change code.', 83, INK, 600, -3.5)
board += text(58, 385, 'Keep running.', 83, INK, 600, -3.5)
board += text(64, 438, 'Backend, models and React. One evolving application.', 22, MUTED)
board += rect(1036, 140, 460, 334, INK, 8)
board += symbol(1166, 159, 220, PAPER, LIVE)
board += text(1070, 437, 'A modular R. A forward-running stroke.', 16, PAPER)
board += rule(514)
board += text(64, 556, '01 / THE MARK', 13, MUTED, 600, 1.4)
for x, bg, main, accent, caption in [(64, '#FFFFFF', INK, FOREST, 'Primary'), (324, INK, PAPER, LIVE, 'Reverse'), (584, LIVE, INK, INK, 'Monochrome')]:
    board += rect(x, 579, 240, 161, bg, 6)
    board += symbol(x + 74, 602, 106, main, accent)
    board += text(x, 770, caption, 15, MUTED)
board += text(894, 556, '02 / THE PALETTE', 13, MUTED, 600, 1.4)
for i, (name, color) in enumerate([('Paper', PAPER), ('Ink', INK), ('Live', LIVE), ('Forest', FOREST), ('Muted', MUTED)]):
    x = 894 + i * 123
    board += rect(x, 579, 110, 110, color, 6, '#D8DED3' if color == PAPER else None)
    board += text(x, 718, name, 15, INK, 600) + text(x, 744, color, 13, MUTED)
board += rule(809)
board += text(64, 852, '03 / TYPE &amp; VOICE', 13, MUTED, 600, 1.4)
board += text(62, 927, 'Inter', 66, INK, 600, -2)
board += text(64, 973, 'Aa Bb Cc  0123456789', 26, INK)
board += text(64, 1015, 'Clear headings. Quiet labels. Readable code.', 19, MUTED)
board += text(64, 1062, 'Build the application.', 27, INK, 600, -.6)
board += text(64, 1099, 'Keep the platform running.', 27, INK, 600, -.6)
board += text(64, 1152, 'return { statusCode: 200 };', 17, FOREST, family='DejaVu Sans Mono, monospace')
board += text(624, 852, '04 / WEBSITE APPLICATION STUDY', 13, MUTED, 600, 1.4)
board += rect(624, 881, 872, 306, INK, 8)
board += symbol(648, 900, 34, PAPER, LIVE) + wordmark(PAPER, 694, 925, 22)
board += text(1226, 922, 'Docs', 13, PAPER) + text(1310, 922, 'GitHub', 13, PAPER)
board += text(655, 961, 'SELF-HOSTED · DEVELOPER PREVIEW', 10, LIVE, 600, 1.1)
board += text(652, 1015, 'Build live.', 46, PAPER, 600, -1.4)
board += text(652, 1067, 'Keep evolving.', 46, PAPER, 600, -1.4)
board += rect(655, 1105, 190, 44, LIVE, 4) + text(675, 1133, 'Build your first app', 14, INK, 600)
board += text(870, 1133, 'Explore the source ↗', 14, PAPER)
board += rect(1150, 973, 318, 176, '#223B2D', 5)
board += text(1168, 1004, 'Modules/api/hello.js', 12, '#BDCFBF', family='DejaVu Sans Mono, monospace')
board += text(1168, 1048, 'return {', 16, PAPER, family='DejaVu Sans Mono, monospace')
board += text(1184, 1078, 'statusCode: 200,', 16, LIVE, family='DejaVu Sans Mono, monospace')
board += text(1184, 1108, "body: { message: 'v2' }", 14, PAPER, family='DejaVu Sans Mono, monospace')
board += text(1168, 1138, '};', 16, PAPER, family='DejaVu Sans Mono, monospace')
board += text(64, 1237, 'RUNTESSA / VECTOR LOGO · LIGHT &amp; DARK · MONOCHROME · WEB &amp; GITHUB', 12, MUTED, 600, 1)
(ROOT / 'brand-board.svg').write_text(svg(1560, 1270, board, 'Runtessa visual identity: logo, colors, typography and website study'))

social = rect(0, 0, 1280, 640, INK)
social += symbol(56, 43, 66, PAPER, LIVE) + wordmark(PAPER, 142, 91, 44)
social += text(63, 200, 'THE LIVE APPLICATION PLATFORM', 14, LIVE, 600, 1.6)
social += text(55, 310, 'Change code.', 86, PAPER, 600, -3)
social += text(55, 410, 'Keep running.', 86, PAPER, 600, -3)
social += text(64, 488, 'Backend, models and React. On your infrastructure.', 26, '#BDCFBF')
social += symbol(978, 254, 220, PAPER, LIVE)
social += rect(64, 554, 6, 18, LIVE) + text(86, 570, 'OPEN SOURCE · DEVELOPER PREVIEW', 13, PAPER, 600, 1.3)
(ROOT / 'github-social.svg').write_text(svg(1280, 640, social, 'Runtessa GitHub social preview'))

tokens = {'name': 'Runtessa', 'status': 'Visual identity study; repository naming unchanged',
          'colors': {'paper': PAPER, 'ink': INK, 'live': LIVE, 'forest': FOREST, 'muted': MUTED},
          'type': {'body': 'Inter Regular', 'heading': 'Inter SemiBold', 'code': 'ui-monospace, Consolas, monospace'},
          'mark': {'minimumPixels': 24, 'clearSpace': 'At least one stem width', 'smallSizes': 'Use favicon, never the wordmark'},
          'usage': {'primary': 'Ink and Forest on Paper', 'reverse': 'Paper and Live on Ink', 'mono': 'One color; no gradient'},
          'license': {'originalArtwork': 'Apache-2.0, following the repository license', 'Inter': 'SIL Open Font License 1.1; see fonts/LICENSE.txt'}}
(ROOT / 'brand-tokens.json').write_text(json.dumps(tokens, indent=2) + '\n')
print(f'Built vector identity, outlined wordmarks, social preview and Inter web fonts in {ROOT}')
