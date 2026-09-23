# Journal voice guide

Read this before writing any trip page. `HANDOFF.md` covers how a page is
built. This file covers how it should sound. Where the two disagree, this file
wins.

The reference pages for this voice are `big-island-page.html` and
`journal/yosemite/index.html` (Yosemite has no separate source file; edit it
directly).

---

## 1. The idea in one line

**Happy sound, dark lyrics.** The photos and captions are the song everyone can
hum along to: warm, upbeat, a little funny. Under each one runs a quiet line of
true history that changes what you just looked at. A reader should enjoy the
postcard, then read the small print and think *wait*.

## 2. What the lyrics are about: power and control

Joe believes power and control are what "bad men" chase. Where the facts
support it, the lyrics show that machinery at work:

- **Who gained power or control**, and **how**. The usual tools are land law,
  money (sugar, the Big Five, resorts), the military, language policy, and
  who gets a vote.
- **Who paid for it.**
- **Who pushed back.** This matters just as much. See section 3.

**Show the structure. Let the reader name the bad men.** State who held the
power, what they did with it, and who paid, with a source for every fact. Never
call anyone a villain, and never use loaded adjectives. The facts carry the
weight. The line lands harder when the reader reaches the conclusion alone, and
a plain fact is harder to argue with than an opinion.

## 3. Find the others

Timothy Leary's line, which Terence McKenna championed: *find the others.* For
these pages it means one thing: **we are not writing to appeal to everyone.**
Write for curious, independent-minded readers who like a place more once they
know its real story, and don't soften the history to keep everybody
comfortable.

This shapes **how** you write, not **what** you write:

- Never mention "the others," speak to "readers like you," add hidden messages
  or sign-offs, or turn it into a game. Nothing on the page should draw
  attention to the idea.
- No conspiracy tone, no "wake up," no calls to action. It should read as a
  thoughtful photographer who knows his history, nothing more.
- When the facts include people who pushed back (the petition signers, the
  kiaʻi on Mauna Kea, the Hawaiian-language teachers), include them the way you
  include any other sourced fact.

## 4. Captions (the happy sound)

- One or two short sentences, upbeat and present-tense in feel, in Joe's voice.
- **No trip logistics.** Cut "on the first trip," "then we drove to," and "the
  first evening." Joe does not want a travelogue.
- Use his real, lived details when he gives them (the crawl into the cave, the
  Taste of Kauaʻi, the earthquake during a conference). One good detail beats
  three generic ones.
- Never invent a feeling, a person, or a detail he didn't give you. If you
  don't know, leave it out.
- No apologies, no self-deprecation, no mood lines.

## 5. Lyrics (the dark lyrics)

- One line, sometimes two, directly under the caption, in
  `<p class="lyric">`. It renders in an italic serif with a thin rule, like
  small print.
- Tie it to the photo when you can: coffee at a hotel named for Mauna Kea, then
  who decides what goes on Mauna Kea's summit.
- Cryptic is good. Short, plain, and a little dry. Examples that work:
  - *The first goats came as gifts from European ships in the 1700s. Gifts from
    ships have a way of staying.*
  - *All this fruit, and Hawaiʻi still imports about 85 to 90 percent of its
    food.*
  - *I get to keep coming back. Not everyone born here gets to stay.*
- Every fact in a lyric needs a source in the page's Sources list.
- Be precise where people argue. The 1896 law made English the language of
  instruction; it did not technically "ban" Hawaiian, so say exactly what it
  did.
- Not every post needs a lyric. Skip it before you force it.

## 6. The rest of the page

- **Intro:** the place's history leads. It can end with the postcard and small-print
  framing.
- **History table:** tells the power arc: who held the land and the vote, how
  that changed, and who resisted. It is not a list of attractions.
- **Facts tables:** keep them. They are the useful, neutral layer: heights,
  dates, how to visit.
- **Status posts** (whales, earthquakes, bears) are where Joe's personality
  shows most. Keep them.

## 7. Interactives and galleries

- **Two or three at most per trip.** Joe called five "too many gimmicks."
- A photo with text labels on it is **not** an interactive. Joe's example was
  the Glass Beach close-up. If the labels only name things, use a facts table.
- A good interactive shows something only the photos can show: the El Capitan
  zoom, the wet side / dry side slider, Kīlauea then and now.
- **Side-scroll galleries:** once or twice per trip at most, only for a run of
  photos that belong together. "Everything isn't a gallery."

## 8. Photos and credits

- People and pets are fine.
- **Never name a phone as the camera.** No "Samsung" or "Phone camera" in
  footers, tags, or metadata. Leave the footer credit empty. Real camera credits
  (Fujifilm) are fine.
- Strip GPS from published images (`prep_photos.py` does this).
- **Light editing where it needs it.** Some frames come in dark, flat, or hazy.
  Run `light_edit.py` on the staged full-size frames before `prep_photos.py`:
  gentle levels, a midtone lift, and a touch of color. The originals are never
  touched. Look at a before/after of every changed frame; skip anything that
  is dark on purpose (a cave, dusk). No heavy looks, no filters, no HDR.
- **Never publish anything blurry by accident.** Run `check_photos.py` before a
  page goes live and look at every flagged frame at full size. Softness on
  purpose is fine (shallow depth of field on a flower, a smooth sky). A frame
  that is soft because of shake, missed focus, or heavy digital zoom does not go
  up. If it is the only record of something important, ask Joe first.
- Outside photos only when they are public domain or clearly licensed, and
  credited on the image (for example, USGS).

## 9. Carrying it to the next trips

| Trip | Where the power story is |
|---|---|
| Kauaʻi | Plantations and Grove Farm; Niʻihau sold to one family; SPAM and the military; the cave on company land; the first Pūnana Leo opened in Kekaha in 1984 |
| Boston | The Tea Party as a protest against taxation without a vote, set beside the same country later ruling Hawaiʻi without one |
| Yellowstone | The first national park (1872), made "empty" by removing the Native nations who used it |
| Alabama | Who lives next to the industry and who profits from it (use the Encyclopedia of Alabama; see the "lift all boats" note) |
| California and others | Find the land, water, and labor story in each place before writing |

## 10. Hard rules, repeated

- No em dashes anywhere in copy.
- Quotes under 15 words, attributed.
- Hedge honestly ("most likely") and never build a post on a guess.
- Sources list and a "Details checked" date on every page.
