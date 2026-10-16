# The Conscious Forms: deploy-ready bundle

| file | what it is |
|---|---|
| `index.html` | The mind's dashboard: live brain, readouts, thought stream, and "not connected yet" business panels |
| `mind-core.html` | the living brain (standalone page or embed) |
| `physics.md` | every equation and parameter, in plain words |

The bundle is static: no build step and no server code. It loads three.js 0.160 from unpkg and the Inter Tight and JetBrains Mono fonts from Google Fonts. Host the files together in one folder on any static host (Netlify, Vercel, GitHub Pages, S3, the Framer asset host and so on). Nothing has been deployed yet.

## Embed in Framer
Add an **Embed** component, choose **HTML**, and paste:

```html
<iframe id="thira" src="https://YOUR-HOST/mind-core.html?embed"
  style="width:100%;height:100%;border:0;background:transparent"
  title="The Conscious Forms · the conscious mind" loading="lazy" allow="autoplay"></iframe>
```

For the full dashboard, use `https://YOUR-HOST/index.html` instead.

URL options for `mind-core.html`:

| option | effect |
|---|---|
| `?embed` | hides the mind's own pills, panels and footer |
| `?hud` | opens the dynamics readout |
| `?q=0`, `?q=1`, `?q=2` | fixes the quality level (otherwise it adapts to frame rate) |
| `?section=bim360` or `#section=bim360` | stimulates a region on load |

## Website hook: make the mind aware of the visitor's section
From the host page, tell the mind which section the visitor is reading:

```html
<script>
  const thira = document.getElementById('thira');
  function tellThira(section){ thira.contentWindow.postMessage({type:'tcf-section', section}, '*'); }
  // e.g. on page load or when a section scrolls into view:
  tellThira('bim360');   // accepted: practice, home, about, services, bim360, projects, contact
</script>
```

Other ways to send the section:
- link to `mind-core.html#section=projects`
- set `data-section="projects"` on the embedded page's `<html>` (same origin)
- call `thiraSection('projects')` (same origin)

| site section | brain region |
|---|---|
| /practice | practice |
| / (home) | sacred geometry |
| about | Kerala |
| /services | nature |
| /bim360 | BIM precision |
| /projects | storytelling |
| /contact | talk to us |

## Listening to the mind
When embedded, the mind posts two kinds of message to the parent page:

- **State**, about 4 times per second:
  `{type:'thira-state', state:{fire[], sync[], r, G, ignitions, predErr, KE, coreE, alpha, gamma, quality, …}}`
- **Events**, when they happen:
  `{type:'thira-event', event:{kind:'ignite'|'release'|'surge'|'surprise', region, t, G, r, …}}`

The dashboard's thought stream turns these real events into lines in the mind's voice.

## v4: attention, voice and the team

### Attention
- `mind-core.html` posts `thira-event` messages of kind `attend`, `read` and `done`.
- `state.coverage[6]` holds coverage per region, and `state.attention` names the region being attended.
- The dashboard shows these as an attention log and a coverage radar.

### Voice
- **mic** (in `mind-core.html`) is off by default. The browser asks for microphone permission only when it is clicked.
- **brief me** (dashboard) speaks with the browser's own `speechSynthesis`, using only live state. Ops, website, SEO and CRM are reported as "not connected yet".
- While it speaks, the dashboard sends `{type:'tcf-speaking', level}` to the brain, so the core reacts to its own voice, and the numbers being spoken are highlighted.
- Without a speech voice, the transcript is paced word by word instead.

### Team hook
Post to the dashboard window (`index.html`):

```js
dashboardWindow.postMessage({type:'tcf-bot-event', bot:'seo-checker', action:'audit finished', to:'thira'}, '*');
```

- Bot ids: `thira`, `seo-checker`, `website`, `crm-ui`, `elv-connector`, `honeywell-fov`. `to` is optional and defaults to `thira`.
- Each event fires a pulse between clusters, adds a line to the run log and stimulates the mind.
- By default no events are generated. The **demo pulse (not real)** button is labelled as a demo and its log lines say "[demo, not real]".

## Notes
- **Performance:**
  - Quality adapts to the measured frame rate: membrane vertex count, flow particles (35%, 65% or 100% of 20,736) and pixel ratio.
  - Touch devices start at the middle quality level.
  - `prefers-reduced-motion` stops auto-rotation and lowers the quality level.
- **Honesty:** the brief form in `mind-core.html` does **not** submit anywhere. Business panels (ops, website, SEO, CRM) show "not connected yet" and display no data.

## v5: cosmic web
- `cosmic.html`: the brain as a cosmic web (gravity-formed filaments as axons, clusters as neurons). Linked from thira and from the dashboard menu ("Cosmic web"). It uses the same hooks (`tcf-section`, `tcf-speaking`, `tcf-bot-event`) and posts `thira-state` and `thira-event` with `source:"cosmic"`. Add `?palette=night` for the night sky. Framer embed: point the iframe at `cosmic.html?embed`.

## v6: tree of life
- `cosmic.html` now opens in **tree of life** mode, and the "mode" button switches to the cosmic web. `?mode=web` starts in web mode and `?palette=night` starts on the night palette. Global functions: `cosmicMode("tree"|"web")`, `cosmicState()` (in tree mode it also reports growth, segments, roots, energy, sapFlux, leaves and collisions). Physics: physics.md section 14. Backup of the previous version: `cosmic.v1.html` (not in dist).

## v7: FlyWire wiring (tree of life)
- `cosmic.html` loads `data/flywire-neuropils.json` locally (copied into `dist/data/` together with `SOURCES.md`). If the file cannot be loaded, the page says "FlyWire data: not connected yet" and falls back to the design layout.
- What the data drives: the tree grows toward the 78 real neuropils; signals travel only along the 600 real links (log-weighted by synapse count, signed by neurotransmitter); and the mushroom body, central complex and lateral horn compete to decide the next focus (recall, explore or react). Each decision is posted as a `thira-event` of kind `decide`, with its reason and evidence. Use `cosmicDecisions()` to read the decision log. Details are in physics.md section 15.
- **Attribution (CC-BY 4.0, required):** Connectome data: FlyWire (flywire.ai), Dorkenwald et al. 2024; Schlegel et al. 2024; CC-BY 4.0.
  - Dorkenwald S. et al., *Neuronal wiring diagram of an adult brain*, Nature 634:124–138 (2024), https://doi.org/10.1038/s41586-024-07558-y
  - Schlegel P. et al., *Whole-brain annotation and multi-connectome cell typing of Drosophila*, Nature 634:139–152 (2024), https://doi.org/10.1038/s41586-024-07686-5


## v8: mind (three looks)
`mind.html`: Stream / Field / Mirror (pills, keys 1 2 3 or s f m, `?look=stream|field|mirror`, `n` for night, `?q=0|1|2` quality). All three share `engine.js` (FlyWire-wired sim, decisions, ignition, self-model). Linked from the dashboard (Mind) and from cosmic.html. Needs `engine.js` and `data/flywire-neuropils.json` beside it. FlyWire data CC-BY 4.0 (Dorkenwald et al. 2024; Schlegel et al. 2024).
