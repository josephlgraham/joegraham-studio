"""Write the gear item pages (camera, lenses, filters, bags, accessories).

    python build/gear_pages.py      # from the repo root

Edit the copy here, not in gear/*/index.html. gear/index.html is edited by hand.
Photos live in gear/img/ (1500px, metadata stripped: the originals carry home GPS).
"""
import os, shutil

HEAD = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} | Gear | Joe Graham Photography</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://joegraham.studio/gear/{slug}/">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/gear/gear.css">
<link rel="stylesheet" href="/assets/site.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap" rel="stylesheet">
</head>
<body>
<header class="top-bar">
  <div class="top-bar-inner">
    <a href="/" class="top-bar-logo">joe<span>graham</span></a>
    <nav class="top-bar-nav" aria-label="Primary navigation">
      <a href="/portfolio.html">Portfolio</a>
      <a href="/journal.html">Journal</a>
      <a href="/gear/" class="active" aria-current="page">Gear</a>
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
    </nav>
  </div>
</header>
<div class="container">
'''

FOOT = '''</div>
<footer>&copy; 2026 Joe Graham &middot; <a href="/gear/">Gear</a> &middot; <a href="/legal.html">Legal &amp; Privacy</a></footer>
</body>
</html>
'''

PAGES = [
  ('x-t30-ii', 'The camera', 'The camera'),
  ('lenses', 'The lenses', 'The lenses'),
  ('filters', 'The filters', 'The filters'),
  ('bags', 'The bags', 'The bags'),
  ('accessories', 'Accessories', 'Accessories'),
]

def specs(caption, rows):
    r = ''.join(f'<tr><th scope="row">{a}</th><td>{b}</td></tr>' for a, b in rows)
    return f'<table class="specs"><caption>{caption}</caption>{r}</table>'

def other(slug):
    links = ''.join(f'<a href="../{s}/">{label}</a>' for s, label, _ in PAGES if s != slug)
    return f'''  <nav class="module other" aria-label="Other gear">
    <div class="module-header">Also in the bag</div>
    <div class="module-body">{links}</div>
  </nav>
'''

def page(slug, title, desc, header, photo, alt, model, body_top, sections):
    out = HEAD.format(title=title, desc=desc, slug=slug)
    out += f'''  <p class="crumbs"><a href="/gear/">Gear</a> &rsaquo; {title}</p>
  <section class="module">
    <div class="module-header">{header}</div>
    <div class="module-body item-top">
      <figure class="print"><img src="/gear/img/{photo}.jpg" width="844" height="1500" alt="{alt}"></figure>
      <div>
        <h1>{title}</h1>
        <p class="model">{model}</p>
{body_top}
      </div>
    </div>
  </section>
'''
    for h, html in sections:
        out += f'''
  <section class="module">
    <div class="module-header">{h}</div>
    <div class="module-body">
{html}
    </div>
  </section>
'''
    out += '\n' + other(slug) + FOOT
    os.makedirs(f'gear/{slug}', exist_ok=True)
    open(f'gear/{slug}/index.html', 'w', encoding='utf-8', newline='\n').write(out)

# ---------------------------------------------------------------- camera
page('x-t30-ii', 'The camera',
  'The Fujifilm X-T30 II Joe Graham shoots with, and how it is set up.',
  'Main camera', 'camera',
  'A Fujifilm X-T30 II with a wood hand grip and a square metal lens hood, resting on a patterned camera strap on a log.',
  'Fujifilm X-T30 II',
  '''        <p>A small body with real dials on top: shutter speed, exposure comp, and a drive dial. I can change settings without digging through a menu.</p>
        ''' + specs('At a glance', [
          ('Sensor', '26.1 MP APS-C X-Trans CMOS 4'),
          ('Processor', 'X-Processor 4'),
          ('Viewfinder', '0.39 in OLED electronic viewfinder'),
          ('Screen', '3 in tilting touchscreen'),
          ('Shutter', 'Mechanical to 1/4000 s, electronic to 1/32000 s'),
          ('Video', '4K up to 30p'),
          ('Weather sealing', 'None. More on that under <a href="../bags/">the bags</a>.'),
        ]),
  [('How mine is dressed', '''      <p>It never goes out plain. There&rsquo;s a wood hand grip on the bottom, with 1/4 in screw holes on the side for mounting things, a square metal hood on the lens, a soft silicone eyecup on the viewfinder, and a patterned strap. I do like to accessorize. The full list is on the <a href="../accessories/">accessories</a> page.</p>
      <p>A circular polarizer lives on the front of whatever lens is mounted. It&rsquo;s how I like to shoot, and it protects the lens glass in case anything happens. <a href="../filters/">Why that works</a>.</p>''')])

# ---------------------------------------------------------------- lenses
page('lenses', 'The lenses',
  'The three lenses Joe Graham carries: the Fujinon XF18-55mm, the XF70-300mm, and a 7artisans 25mm f/1.8.',
  'Three lenses', 'xf70-300',
  'The Fujinon XF70-300mm lens standing on a weathered wooden rail, with its zoom lock switch and focal length markings showing.',
  'Fujinon XF18-55mm, Fujinon XF70-300mm, 7artisans 25mm',
  '''        <p>Most days it&rsquo;s the 18-55. The 70-300 comes along when something is far away.</p>''',
  [('The everyday lens', '''      <p class="model">Fujinon XF18-55mm F2.8-4 R LM OIS</p>
      <p>This is the one on the camera most of the time. It wears a square metal hood, which you can see in the camera photo.</p>
      ''' + specs('At a glance', [
          ('Range', '18 to 55 mm, about 27 to 84 mm in full-frame terms'),
          ('Aperture', 'f/2.8 at the wide end, f/4 at the long end'),
          ('Stabilized', 'Yes (OIS)'),
          ('Filter size', '58 mm'),
        ])),
   ('The long lens', '''      <p class="model">Fujinon XF70-300mm F4-5.6 R LM OIS WR</p>
      <p>For anything I can&rsquo;t walk closer to. Unlike the camera, this lens is weather resistant (that&rsquo;s the WR).</p>
      ''' + specs('At a glance', [
          ('Range', '70 to 300 mm, about 105 to 450 mm in full-frame terms'),
          ('Aperture', 'f/4 to f/5.6'),
          ('Stabilized', 'Yes (OIS)'),
          ('Weather resistant', 'Yes'),
          ('Filter size', '67 mm'),
        ]) + '''
      <figure class="inline-shot"><img src="/gear/img/xf70-300-side.jpg" width="844" height="1500" loading="lazy" alt="The XF70-300mm lens standing upright on a wooden rail, hood attached, with its focus and stabilizer switches on the side."></figure>'''),
   ('The little prime', '''      <p class="model">7artisans 25mm f/1.8</p>
      <p>A small, all-manual lens. There&rsquo;s no autofocus, so focusing is by hand. At f/1.8 the background goes soft fast.</p>
      ''' + specs('At a glance', [
          ('Focal length', '25 mm, about 37 mm in full-frame terms'),
          ('Aperture', 'f/1.8'),
          ('Focus', 'Manual only'),
        ]))])

# ---------------------------------------------------------------- filters
page('filters', 'The filters',
  'Why Joe Graham shoots with a circular polarizer and a variable ND filter, and what each one does to light.',
  'Glass in front of the glass', 'filter',
  'A round K&amp;F Concept variable ND filter with an orange adjustment tab, lying on dry leaves and grass.',
  'K&amp;F Concept Nano-X 3-in-1: Variable ND2-32, CPL, and Black Diffusion Mist 1/4 (58 mm and 67 mm)',
  '''        <p>A circular polarizer is always on my camera. When the sun is out, I use the ND. That&rsquo;s the one in the photo.</p>
        <p>I have the set in two sizes: 58 mm for the everyday lens and 67 mm for the long one.</p>''',
  [('The ND: sunglasses for the camera', '''      <p>ND stands for neutral density. It cuts the light coming into the lens without changing its color. That&rsquo;s the &ldquo;neutral&rdquo; part.</p>
      <p>Photographers count light in <b>stops</b>. One stop is half the light. This one is variable: turn the front ring and it goes from ND2 (one stop, half the light) to ND32 (five stops, one thirty-second of the light).</p>
      <h2>Superpower 1: slow things down in daylight</h2>
      <p>On a bright day at f/8, the camera might want 1/250 of a second. Five stops of ND turns that into 1/8 of a second: 1/125, 1/60, 1/30, 1/15, 1/8. That&rsquo;s slow enough for a waterfall to go silky and for moving water to smooth out, in the middle of the afternoon. A cable release helps here, so the camera doesn&rsquo;t shake when you press the button. I prefer mine over the phone app 10 to 1.</p>
      <h2>Superpower 2: shoot wide open in the sun</h2>
      <p>There&rsquo;s an old rule of thumb called Sunny 16: in full sun, f/16 at a shutter speed of about 1/ISO gets you a good exposure. Open up to f/2.8 for a blurry background and you&rsquo;ve let in five more stops. At the camera&rsquo;s base ISO that would take roughly 1/5000 of a second, faster than the mechanical shutter&rsquo;s 1/4000. The electronic shutter can go faster, but it reads the sensor line by line and can bend anything that moves. The ND takes away those five stops, and the mechanical shutter is back in range.</p>
      <h2>Superpower 3: video that moves like film</h2>
      <p>Video looks most natural with the shutter at about twice the frame rate, so 1/60 of a second at 30 frames per second. It&rsquo;s called the 180-degree rule, from film cameras with spinning shutters. In the sun, 1/60 lets in far too much light. The ND fixes that without closing the aperture down.</p>
      <h2>How a variable ND works</h2>
      <p>It&rsquo;s two polarizing layers. Turn one against the other and less light gets through both, like two pairs of polarized sunglasses held at an angle. Push one too far and the frame can go dark in a big uneven X, so it&rsquo;s best used inside its marked range.</p>'''),
   ('The polarizer: why it never comes off', '''      <p>Light bouncing off water, wet leaves, and glass comes off mostly vibrating in one direction. A circular polarizer (CPL) blocks that direction. Turn it and the glare on a river disappears so you can see the rocks underneath, and leaves go from shiny gray to green.</p>
      <p>It also darkens blue sky. The effect is strongest at 90 degrees from the sun, so with a wide lens you can sometimes see a darker band across the sky. It costs about a stop and a half of light.</p>
      <p>And if something is going to hit the front of the lens, I&rsquo;d rather it be the filter.</p>'''),
   ('The mist: a little glow', '''      <p>A black diffusion mist filter softens the brightest parts of the frame and lets them glow a bit, and takes some of the digital edge off. The 1/4 is the strength, and it&rsquo;s a light one.</p>''')])

# ---------------------------------------------------------------- bags
page('bags', 'The bags',
  'The Lowepro Fastpack BP 250 AW III and K&F Concept sling Joe Graham carries, and how he keeps gear dry in the field.',
  'What carries it', 'backpack-open',
  'An open Lowepro backpack on the grass, packed with a camera, a long lens, filters in orange pouches, and accessories in padded dividers.',
  'Lowepro Fastpack BP 250 AW III and K&amp;F Concept 2-in-1 Sling Bag 10L',
  '''        <p>I love a good bag.</p>''',
  [('The backpack', '''      <p class="model">Lowepro Fastpack BP 250 AW III</p>
      <p>This one has been great for travel. The camera section opens from the side, so I can get to it without setting the whole bag down, and there&rsquo;s room up top for everything else.</p>
      <p>Lowepro makes a newer, bigger version, and I might have to check it out. I could always use a little more room.</p>
      ''' + specs('At a glance', [
          ('Style', 'Backpack with side access to the camera section'),
          ('Weather', 'Built-in All Weather cover (the AW in the name)'),
        ])),
   ('The sling', '''      <p class="model">K&amp;F Concept 2-in-1 Sling Bag, 10L</p>
      <p>For little day trips, or to carry the overflow when the backpack is full. It&rsquo;s been very nice to use.</p>
      <figure class="inline-shot"><img src="/gear/img/sling.jpg" width="844" height="1500" loading="lazy" alt="A dark olive K&amp;F Concept sling bag hanging by its strap from a wooden post in the woods."></figure>'''),
   ('Keeping it dry', '''      <p>I always keep a desiccant pack or two in my bags, because you never know. In the field you can&rsquo;t predict the weather, and I want everything to stay as dry as possible. The camera isn&rsquo;t weather sealed, so it matters.</p>
      <figure class="inline-shot"><img src="/gear/img/desiccant.jpg" width="844" height="1500" loading="lazy" alt="A small white desiccant packet tucked into the gray lining of a camera bag."></figure>''')])

# ---------------------------------------------------------------- accessories
page('accessories', 'Accessories',
  'The tripod, spares, and small tools Joe Graham carries: K&F Concept carbon fiber tripod, cable release, blower, and more.',
  'I do like to accessorize', 'camera',
  'The camera with its wood grip, square hood, and patterned strap, resting on a log.',
  'Tripod, spares, and the little bag of tools',
  '''        <p>I&rsquo;ve fallen in love with K&amp;F Concept. You can tell they put a lot of thought into their products. They&rsquo;re great to use, and they seem to hold up well.</p>''',
  [('The tripod', '''      <p class="model">K&amp;F Concept 60 in carbon fiber travel tripod with 360&deg; ball head</p>
      <p>One leg unscrews and turns into a monopod. It&rsquo;s just wonderful when things work like that.</p>
      ''' + specs('At a glance', [
          ('Height', 'About 60 in'),
          ('Legs', 'Carbon fiber, one detaches as a monopod'),
          ('Head', '360&deg; ball head with quick release plate'),
          ('Rated load', '8 kg'),
          ('Spare plate', 'K&amp;F Concept K-28 quick release plate. For long exposures I sometimes roll with two tripod mounts on.'),
        ])),
   ('On the camera', specs('Always attached', [
          ('Hood', 'Haoge LH-X13 square metal hood, on the 18-55'),
          ('Eyecup', 'Soft silicone eyecup for the X-T30 II'),
          ('Strap', 'Vintage-pattern vegan leather strap'),
          ('Grip', 'Wood hand grip with 1/4 in screw holes on the side, so I can mount things to the side of the camera. The brand isn&rsquo;t sold anymore.'),
        ])),
   ('On the bag', specs('Clipped on', [
          ('Camera clip', 'Peak Design Capture clip, on my backpack strap'),
        ])),
   ('In the bag', '''      <p>A little bag of tools, a small towel, an extra tripod mount, an extra lens cap, extra batteries and cables, extra memory cards, and a little blower for dust.</p>
      ''' + specs('The named pieces', [
          ('Blower', 'VSGO V-B012E camera cleaning blower'),
          ('Cable release', 'Fotasy 100 cm mechanical cable release with bulb lock, for long exposures. I prefer it over the phone app 10 to 1.'),
          ('Light', 'K&amp;F Concept RGB video light, full color, 2500 to 9900K'),
          ('Desiccant', 'A pack or two, always. See <a href="../bags/">the bags</a>.'),
        ]))])

print('ok')
