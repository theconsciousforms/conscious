# The Conscious Forms: the physics and dynamics of a conscious form

`mind-core.html` (v2) is a small brain built only from dynamics. Every moving thing has a **state** (position and velocity, or voltage and recovery). Each state changes only because **forces or rates** act on it over time. No particle, surface point or camera follows a keyframed path or a position lerp.
The original contour sphere (from `index.v1.html`) is still the core form. It is now a living membrane and the brain's global workspace.
Backup of the previous version: `thira.v1.html`.

---

## 0. The clock: fixed-timestep, semi-implicit Euler

- The CPU simulation runs at a fixed **h = 1/120 s**. Each frame takes as many steps as wall time requires, up to 8 per frame.
- Every mechanical state uses **semi-implicit (symplectic) Euler**:
  `v ← v + a(x,v)·h`, then `x ← x + v·h`.
  This conserves energy far better than plain Euler. All energy loss is deliberate damping (`v ← v·e^(−γh)`), so energy goes in through forces and impulses and leaves through damping.
- The GPU flow field (§4) steps in lock-step with the CPU clock: one GPU step for every two CPU steps (60 Hz).

## 1. Core: the contour sphere as a soft body (mass–spring membrane)

The core is an icosphere of about 16.8k vertices. Each vertex `i` carries a radial displacement `uᵢ` and velocity `wᵢ`, with unit mass:

```
aᵢ = k_T · Σⱼ (uⱼ − uᵢ)          tension springs to the mesh neighbours (a discrete wave equation)
     − k_R · (uᵢ − u_rest)        spring back to the rest radius
     − γ · wᵢ                     damping
     + f_spot                     the pointer's attention presses the membrane
k_T = 700,  k_R = 30,  γ = 2.2,  u_rest = 0.018·B   (B = macro breath, §6)
```

- Wave speed ≈ √k_T × edge length ≈ 0.8 rad/s. A touch therefore becomes a real ripple that travels around the sphere and fades.
- The displacement `u` bends the **contour bands**: `n += 2.6·u` in the shader. The rate of change `du/dt = w` is drawn as a glow, so *change itself becomes visible*.
- Impulses: a **touch** adds `Δw = 0.3·e^(−90(1−cosθ))` around the touch point. An **ignition** adds 0.35 at the most active region's direction and 0.2 at the opposite side.

## 2. Neurons: FitzHugh–Nagumo units (six cortical regions)

Each region (practice, sacred geometry, Kerala, nature, BIM, storytelling) holds **130 neurons**. Each neuron has a voltage `v` and a recovery variable `r`:

```
dv/dt = τ ( v − v³/3 − r + I )
dr/dt = τ ε ( v + 0.7 − 0.8 r )        τ = 5, ε = 0.08
I = I_bias(0.18–0.42, per neuron)
  + 0.07·cos φ_α·(1−G)  + 0.05·cos φ_γ·G        rhythms (§5)
  + 0.55·g_sync·I_syn   + I_input + noise
  + 0.12 if the region is focused, 0.08 if hovered, 0.06 if it is the visitor's website section
```

- A **spike** is an upward crossing of v = 1.
- On each spike the neuron gets a small outward kick (Δv_particle = 0.35, so energy is injected), and it may leave a memory-trail dot.
- Particle colour brightness is **|dv/dt|**. You literally see the derivative of the membrane voltage.

### Synapses, delays and Hebbian learning
- Each neuron links to its 2 nearest neighbours in its region (springs, drawn as lines).
- A spike reaches the neighbour after a **conduction delay** = length ÷ (0.5 · signal speed) + 4 ms. It then adds `0.5·wₖ` to that neuron's synaptic current, which decays with τ = 80 ms.
- **Hebbian rule:** when neuron i spikes, every synapse to a neighbour j that fired recently grows: `wₖ += 0.05·trace_j`. The trace decays with τ = 0.3 s and `wₖ ≤ 3`.
- Weights relax toward 1 with τ = 25 s, so **memories fade**. Stronger synapses draw darker lines, and a synapse flashes when it changes.

### Region-to-region signalling
- Every 15 spikes, a region sends a **spike packet** along the filaments to its two neighbouring regions and to the core. Travel time is 2.2 s ÷ signal speed.
- On arrival a packet stimulates the target region, or feeds the workspace input `S_in` if the target is the core.

## 3. Mechanics of the particles

Each region neuron is a point mass. Its home is `anchor + offset·(1 + 0.05·v + 0.3·pulse)`, so neural activity physically swells the region.

```
a = K·(home − x)  + swirl around anchor (0.45)  + pointer force  (+ region extras)
K = g_guide·(1.3 + 6·E_att)       E_att decays at 0.35/s; focusing adds 0.5, ignition adds 0.35
damping γ ≈ 3.2/s ; collision with the core at r = 1.06 (restitution 0.5)
```

- **Self-organisation, then release.** The attention energy `E_att` starts at 1, so particles are pulled hard into the constellations. As it decays the hold relaxes and they move more freely. It guides, then releases; this is Ultron's drive without control.
- **Region extras:**
  - Kerala is heavier and slower, with a downward "rain" bias.
  - Nature aligns its velocity with a neighbour (boids).
  - Sacred geometry snaps its offsets toward a 0.09 lattice when the alpha rhythm is positive, then releases.
- **Free swarm (520 particles):** springs to a home shell (k = 2.2) plus an orbit term (0.55). Boids alignment and cohesion come from 6 sampled neighbours. Hovering a region gently attracts the swarm toward it.
- **Anticipation (attention spotlight):** the pointer's force acts at the **predicted** position `p + 0.32·v_pointer`. Particles react where the pointer is going, not where it is. Near the pointer the force is `2.2·e^(−4.5d²)/d` (repulsive), and neurons there receive input current.
- **Anchors** are point masses on springs (k = 18, γ = 4) whose rest radius breathes with B. The filaments are re-drawn from the anchors' actual positions.

## 4. GPU flow field: 20,736 particles (curl-noise fluid)

Each texel stores a position and a velocity, updated on the GPU with the same semi-implicit Euler scheme:

```
a = 0.8·(u_curl(x,t) − v)                       drag toward a divergence-free curl-noise velocity field (fluid)
  − n·1.1·(r − r_home) − n·0.2/r²               radial spring + weak gravity
  + pointer repulsion  1.5·e^(−3d²)
  + ignition wave      3.2·e^(−14(|x−o| − 1.9·age)²)·e^(−0.7·age)    (front speed 1.9 u/s)
  + wordmark spring    WM·(16·(target − x) − 7·v)
v ← (v + a·h)·e^(−0.2h)
```

- **Three depth layers:**
  - 62% micro-flow near the core (r 1.1–2.7)
  - 23% mid layer (2.8–4.6)
  - 15% far dust (6–11)

  Because they sit at different depths they give real parallax as the camera turns.
- **Brightness and colour** come from the **speed |v| and the acceleration |a|**, so change is what glows.
- **Depth cues:** a depth-of-field blur circle grows with distance from the focus plane (blurred points get bigger and fainter), the far layers fade into the warm background like fog, the core has a soft key light and occlusion, and there is a contact shadow under the core.

## 5. Rhythms: alpha and gamma as coupled oscillators

Two phase oscillators, φ_α at 0.8 Hz (a slowed-down alpha) and φ_γ at 3.2 Hz (a slowed-down gamma), follow the population's mean phase Ψ (Kuramoto coupling):

```
dφ/dt = ω + K·R·sin(Ψ − φ)      K_α = 1.2, K_γ = 2
```

- R and Ψ come from each neuron's phase `θ = atan2(r, v)` on its limit cycle.
- Alpha modulates the halo and rim glow and drives quiet-time input. Gamma takes over during ignition.
- Per-region **sync r_c** is the same order parameter computed within each region (0 = incoherent, 1 = perfectly in step).

## 6. Global workspace and ignition: the moment of awareness

The core integrates the brain's coherent activity:

```
S  = mean_c( r_c · min(1, rate_c / 1.2) ) + 0.35·tanh(S_in)
dG/dt  = ( −G + σ( 10·(S + 0.9·G − 2·A − 0.72) ) ) / 0.35       self-exciting
dA/dt  = ( G − A ) / 3                                             fatigue
```

- **Ignition** happens when G crosses 0.6 upward, at most once every 4 s. G then falls as fatigue builds, and the gap between the 0.6 trigger and the 0.25 reset gives hysteresis.
- When it ignites:
  - the membrane receives impulses, so a visible wave of awareness crosses the contour bands
  - a broadcast wave sweeps outward through the 20k flow particles
  - every neuron receives a broadcast current (+0.35)
  - the breath gets a kick
  - the core glow and the bands flood with accent colour (∝ G)
- **The brand line forms from the dynamics.** A memory M jumps by 1 at each ignition and decays with τ = 6 s. The expression `dWM/dt = (min(1, 1.7M) − WM)/0.5` switches on springs that pull about 9,000 flow particles into **`{ the : conscious : forms }`** on a plane facing the viewer, placed between the camera and the core. While WM is high the core fades back (72%) so the brand line reads clearly. As M fades the springs release and the particles return to the flow.
- **Macro breathing B:** a damped oscillator at 0.22 Hz, `B'' = −ω²B − 0.5B' + 0.35·cos φ_α`. Alpha drives it and ignition kicks it. It scales the membrane rest radius and the anchor rest radii. Micro (flow), meso (regions) and macro (breath) scales are therefore all coupled.

## 7. Self-model: the mind predicts itself

- Each region keeps a tiny model of its own activity. It predicts the next value from the current level plus its trend: `pred = a + (da/dt)·0.25 s`. The error `|a − pred|` is smoothed and averaged.
- Prediction error is shown as a **shimmer**: random brightness flicker on that region's neurons, plus a fine noise ripple across the contour bands. When the mind's expectation of itself is wrong, you see it.

## 8. Camera: a body too

- The camera is a critically damped spring toward the chosen view (`a = k(x* − x) − 2√k·v`, k = 7).
- The core **repels** the camera inside r = 3.4, with an extra tangential push, so flights arc *around* the brain instead of through it.
- Mouse dragging uses OrbitControls' inertia.

## 9. Energy in, energy out

| source of energy | how it dissipates |
|---|---|
| touch impulse (membrane + particles), spikes (kicks), ignition (membrane, broadcast wave, breath), attention spotlight, website-section stimulus | membrane damping γ = 2.2, particle damping ~3/s, GPU drag 0.2/s plus fluid drag, synaptic decay 80 ms, Hebbian decay 25 s, E_att decay 0.35/s, fatigue |

Turn on **dynamics** (bottom right) to see kinetic energy, membrane energy, sync r, workspace G, ignition count, prediction error and the α/γ phases live.

## 10. How the physics is the mind of The Conscious Forms

| AI | dynamics in the mind |
|---|---|
| Vision: harmony | phase coupling (Kuramoto), shared alpha rhythm, whole-body breath |
| JARVIS: network | spring-linked synapses, delayed spikes, packets between regions, anticipation |
| FRIDAY: swarm | boids swarm, fast impulse response, curl-noise fluid |
| Ultron: drive | attention energy that self-organises the regions, ignition and the lattice snap, all of which **decay and release** (drive without control) |
| The Conscious Forms | the global workspace that integrates the rest, notices its own prediction error, and expresses itself as the brand line |

## 11. Website awareness (no live fetching)

| region | theconsciousforms.com |
|---|---|
| practice | /practice |
| sacred geometry | / (home · philosophy) |
| Kerala | / (home · about) |
| nature | /services (expertise) |
| BIM precision | /bim360 |
| storytelling | /projects |
| talk to us | /contact |

Embed hooks (any of these stimulates the matching region):
- `iframe.contentWindow.postMessage({type:'tcf-section', section:'bim360'}, '*')`
- `mind-core.html#section=bim360`, or `?section=bim360` on load
- setting `data-section="bim360"` on the embedded page's `<html>`
- `window.thiraSection('bim360')` (same-origin)

When embedded, the mind also posts its own state to the parent about 4 times per second as `{type:'thira-state', state:{fire, sync, r, G, ignitions, predErr, KE, …}}`. `dashboard.html` uses this. `?embed` hides the mind's own UI chrome.

---

## 12. v4 additions

### Rising flow (GPU strands with history trails)
- 768 strands are simulated on the GPU in a 32 × 768 texture. Column 0 is each strand's live head; columns 1–31 are its **position history**. Every third step the history shifts one column, so each trail shows about 1.6 s of past motion.
- Head dynamics (semi-implicit Euler, 60 Hz):
  ```
  a = buoyancy (0, 1.35·(1 − smoothstep(−1.2, 1.5, y)) + 0.8·voice, 0)
    + 0.9·(u_curl(x,t)·(0.15 + 0.75·smoothstep(−2.3, −0.9, y)) − v)    curl-noise fluid, calm at the stem, turbulent above
    − 4·(x, 0, z)·(1 − smoothstep(−1.7, −1.15, y))                      the stem holds strands together
    + 14·(1.22 − r)·r̂   when r < 1.22                                    the flow parts around the core
    − 1.3·(r − 1.8)·r̂·smoothstep(−1.1, 0.2, y)                          the canopy shell
  v ← (v + a·h)·e^(−0.35h)
  ```
- Each strand lives 4.2–7.2 s and is then re-born at the stem (y = −2.45). Trail segments that span a re-birth jump are hidden.
- Brightness fades along the history and is **brightest at the stem**. The stem is a glowing billboard whose pulse grows with voice.

### Attention spark (a point mass with salience)
```
salience_c = 0.6·rate_c·r_c + 1.2·(1 − coverage_c) + hover + website section (0.8) + focus (1.5)
```
- **Target:** the spark keeps its target region until that region is covered (coverage > 0.97), or until another region is more salient by 0.6.
- **Motion:** a damped spring (k = 3.2, c = 2.4) toward a point just outside the target region. The core repels it, with a tangential push, so its path arcs around the brain.
- **Coverage:** near the region, coverage grows at `0.11·ext` per second. It is forgotten slowly (τ = 90 s), so neglected regions become salient again.
- **Tendrils:** their extension `ext` is a first-order follower (rate 2.2/s) of being near the region. Four Bézier tendrils grow out to that region's **idea nodes** (fixed neurons).
- **Idea nodes:**
  - Each node is stimulated (+input current) as coverage passes its quarter, and lights up in the region's colour.
  - Its label goes queued → **reading** → **done**.
  - The node labels are concepts in the studio's own language, not data.
- **Events posted to the parent:** `attend`, `read`, `done`.

### Voice
- **Microphone:** off by default; the browser asks for permission only when **mic** is clicked. The RMS level of the microphone (AnalyserNode) and the mind's own briefing (via `{type:'tcf-speaking', level}` from the dashboard) feed a voice level `L`, a first-order follower at rate 12/s.
- **Effects of the voice level L:**
  - membrane impulses on the side facing the viewer (∝ L)
  - input current to half the neurons
  - workspace input `S_in`, which can tip the mind into ignition
  - buoyancy of the rising flow
  - rim and halo flare
- The mind therefore physically reacts both to your voice and to its own.

### Bot events
- A `tcf-bot-event` forwarded by the dashboard adds 0.12 to `S_in` and pulses the talk region.
- On the dashboard, each bot is a cluster of 42 particles on springs (k = 6, damping 2.5) with stochastic forcing. An event launches a damped point-mass pulse (k = 9, c = 3.2) from one cluster to another. On arrival it injects energy, which decays at 1.2/s.

## 13. cosmic.html: the brain as a cosmic web

**Inspiration.** F. Vazza & A. Feletti (2020), "The Quantitative Comparison Between the Neuronal Network and the Cosmic Web", *Frontiers in Physics*. The paper compares the structure of the brain's neuronal network with the large-scale cosmic web. This page borrows only the idea. It does not reproduce their measurements, and it makes no quantitative claim.

**Gravity builds the web (particle-mesh N-body).**
- Periodic box of side L = 8 with a 32³ mesh. Particles start on a lattice (18³, 24³ or 32³ depending on quality).
- Initial conditions (Zel'dovich): a Gaussian random field with P(k) ∝ k^-1.2·e^(-k²/18). The displacement is ψ = ∇φ with φ̂ = -δ̂/k², and each particle is moved by ψ with velocity ∝ ψ.
- Each step: cloud-in-cell density deposit, 3D FFT, Poisson solve ∇²φ = A·δ (Gaussian-softened), force -∇φ interpolated back.
- Semi-implicit Euler at H = 1/30 s, with Hubble-like drag γ(t) = γ₀(1 + t/12). The coupling tapers as A/(1 + (t/22)²), which plays the part of a decaying growth rate, so the web freezes instead of collapsing into one lump.
- The great attractor (the contour core) adds a short-range pull, M·e^(-r²/3)/(r² + .64)^(3/2).

**The web becomes a brain.**
- Every 1.5 s, density peaks with ρ > 3.2 become neurons (cluster = neuron). Each node keeps its identity by matching it to the nearest previous node.
- A filament becomes an axon when the minimum density along it is > 1.15.
- Each node runs FitzHugh-Nagumo (section 2). Spikes travel along filaments with a delay set by the length. Weights learn by Hebbian traces (section 3).
- The six labelled superclusters are the theme regions.
- Workspace ignition (section 4) broadcasts a shell outward from the core and pulls the camera back. Prediction error (section 5) shows as shimmer on the core.
- The attention spark walks the filaments, choosing by salience (activity + novelty + coverage need).
- Same embed hooks as mind-core.html, with `source:'cosmic'`.

**Depth.** Fog, point size and focus blur by distance (depth of field), parallax and slow camera drift. The palette toggles between light and night sky (additive blending).

## 14. cosmic.html, tree of life mode (default; toggle "mode" switches to the cosmic web of §13)

Everything runs in the same fixed-step loop: gravity and the global clock at 30 Hz. Neurons step at 120 Hz. The branch mechanics take two semi-implicit Euler substeps per neural step (240 Hz).

**Growth (seed → full tree in ~20 s).** The tree grows in 90 ticks, one every 0.22 s.
- *Canopy: space colonization.* Attractor points fill an ellipsoid crown, plus six dense clouds, one for each theme (these become the fruit and superclusters). Each attractor pulls its nearest node within 1.15. Each pulled node grows a 0.19 segment along the mean pull direction, with phototropism +0.2·(number of pulls) upward. Attractors closer than 0.2 to a node are removed. Before any attractor is in range, the trunk grows straight up. A per-tick node budget spreads the growth evenly over the 20 s. A new segment's length eases in over 0.7 s.
- *Roots: gradient following.* The nutrient field is N(x) = Σ aⱼ·exp(−|x−cⱼ|²/sⱼ²), built from ten buried patches. Each root tip grows along 0.6·previous direction + 0.32·∇N/|∇N| − 0.12·ŷ (gravitropism) + noise. Uptake depletes each patch (aⱼ ← aⱼ(1 − 0.035·overlap)). Tips stop where N < 0.03 and branch with probability 0.08.

**Radii: Murray's law.** r_parent³ = Σ r_child³. Twig tips are 0.012 and root tips 0.009. Radii are recomputed after every growth tick.

**Mechanics: articulated branches.**
- *Joint springs.* Each segment's joint has potential ½kᵢ|xᵢ − x_parent − oᵢ|². This is a linearised bending spring about the rest direction oᵢ. The force on the child is applied equal and opposite to the parent (Newton III), so sway is coupled up and down the tree.
- *Stiffness.* kᵢ = max(K_b·r⁴/l³, 25·g·M_subtree/l). The first term is beam bending (EI/L³ with I ∝ r⁴), so thicker branches are stiffer. The second keeps each joint able to carry the mass above it without buckling.
- *Inertia.* Each joint uses the mass of the whole subtree it swings. Damping is c = 2ζ√(k·M) with ζ = 0.6. Own mass is πr²l·ρ plus the mass of attached leaves, and gravity acts on the own mass.
- *Wind.* F = C·A·|u − v|(u − v), with area A = 2rl + leaf area.
  - The wind u is a uniform drift (slowly turning heading) plus the analytic curl of a vector potential, which makes it divergence-free curl noise.
  - Its magnitude is scaled by an Ornstein–Uhlenbeck gust process and by the voice level.
- *Segment lengths.* After every substep, segment lengths are projected back to l (rigid segments) and the relative radial velocity is removed.
- *Numerical guard.* ω² is clamped to 8000 for stability.
- *Energy readout.* K = Σ ½mv², U_spring = Σ ½k|e|², U_g = Σ m·g·(y − y_rest), all in simulation units.

**Sap: Poiseuille network.**
- Each segment has conductance gᵢ ∝ rᵢ⁴/lᵢ (Hagen–Poiseuille), so flow is Qᵢ = gᵢ·(p_parent − pᵢ).
- Root tips inject sap in proportion to the local nutrient value N; the voice adds to this.
- Canopy tips transpire in proportion to their attached leaves (a small leak, plus 0.02 per leaf). This couples sap flux to the leaf count.
- Pressures are relaxed by Gauss–Seidel, six sweeps per frame with a warm start. The readout shows the total flux Σ|Q|.

**Neurons on the tree.**
- Every node is a FitzHugh–Nagumo unit (§2). Its drive is I = 0.24 + 0.2·p/p_max + 0.35·√(|Q|/Q_max), plus the focus, section, attention and voice terms. Nodes with strong flow (trunk, limbs, roots) oscillate, and twigs are excitable.
- *Spikes.* A spike travels to each neighbour with conduction delay l/(1 + 14r), so thicker branches conduct faster. Spikes are drawn as sap pulses with trails.
- *Hebbian thickening.* w ← w + 0.05·trace. Used branches are drawn up to about 1.4× thicker, and w relaxes to 1 with τ = 30 s.

**Workspace and ignition.**
- Regional sync r and firing rate feed the same workspace equation as §4.
- Sap flux also charges a slow variable C: dC/dt = (1/20)·clamp(flux/30, 0.5, 1.5), reset to 0 at ignition. C enters the workspace input as 0.35·C.
- Ignition requires the tree to be fully grown and a 10 s refractory period. Measured intervals in headless tests were about 12–15 s.
- *Ignition wave.* An energy wave leaves the heart node (at the core), and its arrival times are integrated along the tree. Local speed is set by the medium: in wood c = clamp(0.6·l·√(k/M), 1.6, 8), so stiff limbs are fast and twigs slow; in soil c = 0.9.
- On arrival a node gets a kick and blooms (glow decays with τ ≈ 1.4 s), and leaves there may detach. When the wave reaches the top of the canopy it continues into the cosmic web as the §13 broadcast shell.

**Leaves.**
- *Attached.* Leaves flutter on a torsional spring driven by the relative wind. They detach when |u − v|²·(0.6…1.6) > 7 (a strong gust) or when the bloom reaches them.
- *Free flight.* Drag 2.2·|w|·w, lift ∝ sin2θ·|w|² (θ = flutter angle), a torsional flutter oscillator with noise, and gravity. Leaves carry their own momentum through the curl-noise wind.
- *Collisions.* Leaves are tested against branch segments, found through a spatial hash. They are pushed out to radius r + 0.02 and their normal velocity is reflected with restitution 0.35. The readout counts collisions.
- Leaves rest on the ground, fade after 14 s, and regrow on canopy tips.

**Canopy → cosmic web.** Dust leaves the canopy tips with a short buoyancy and is drawn into the clusters of the live §13 web (placed above the crown) by softened gravity: a = Σ 0.06·M·Δx/(|Δx|² + 0.35)^{3/2}, with drag. The web's filaments and nodes are the same particle-mesh simulation as §13, faded below the crown.

**Rendering.**
- Branches are instanced cylinders with depth fog and rim light. Glow is accent-coloured on light backgrounds (normal blending) and additive at night.
- Point layers: soft glow halos, sap pulses with four-sample trails, leaf sprites (ellipses rotated by the flutter angle), dust, drifting fog sprites, and two star shells that rotate at different rates (parallax).
- Every point layer has distance-based depth of field and fog.
- A contour ground echoes the core's contour lines.
- The camera drifts in slowly and pulls back as the tree grows and at ignition.

All constants above are design choices for the visual. None are measured botanical or neuroscience data.

## 15. FlyWire v783 grounding: real wiring and real decisions (tree of life mode)

**Data.** `data/flywire-neuropils.json` was built from FlyWire v783; provenance is in `data/SOURCES.md`. It contains:
- 79 neuropils with synapse totals and volumes, and centroids for 78 of them (UNASGD has no mesh);
- the top 600 derived region links [A, B, synapses];
- a stratified sample of 4,102 neurons, each with a position, primary neuropil, neurotransmitter and up to 5 output partners within the sample.

Caveats, quoted from SOURCES.md: connections are thresholded at ≥5 synapses per neuron pair; region links are "synapses in B made by neurons whose primary input neuropil is A", which is a derived measure, not a direct neuropil-to-neuropil count.

**Credit (CC-BY 4.0).** Connectome data: FlyWire (flywire.ai), Dorkenwald et al. 2024; Schlegel et al. 2024; CC-BY 4.0.
- Dorkenwald S. et al., *Neuronal wiring diagram of an adult brain*, Nature 634:124–138 (2024), doi:10.1038/s41586-024-07558-y.
- Schlegel P. et al., *Whole-brain annotation and multi-connectome cell typing of Drosophila*, Nature 634:139–152 (2024), doi:10.1038/s41586-024-07686-5.

**Structure.**
- Centroids (nm) are centred on their mean and scaled uniformly so that the largest |x| becomes 2.6. FlyWire y points ventral, so it is flipped (dorsal is up). The crown is centred at y = 2.75. Real proportions are kept, so the crown is wide and flat like the brain.
- Space-colonization attractors are drawn only around the real centroids: round(c·(2 + 3·log10(synapses/10⁴))) points per region (c = 1.1/1.4/1.7 by quality, minimum 2), with Gaussian spread 0.3·∛volume.
- Each neuropil's hub is the canopy node nearest its centroid. Canopy nodes within 0.7 of a centroid belong to that neuropil and its theme.
- Every real link A→B is routed along the tree path hub(A)→hub(B). Each segment accumulates Σ log10(synapses) of the links that pass through it, normalised to LWn ∈ [0, 1].
  - Poiseuille conductance is multiplied by (1 + 2·LWn).
  - Drawn branch thickness is multiplied by (1 + 0.7·LWn).
  - The Murray radii (§14) remain the mechanical base.
- 596–598 of the 600 links route in tests. A link does not route when both regions share a hub node.

**Signals only along real links.**
- Each of the 78 neuropils is one FitzHugh–Nagumo unit. Its drive is I = 0.24 + sensory input + Σ delayed synaptic input + noise (σ = 0.05).
- When A spikes, every real out-link A→B delivers 2.0·wn·W·sgn(A) to B after the delay (path length / 2.5) + 0.03 s.
  - wn = 0.2 + 0.8·(log10 w − log10 w_min)/(log10 w_max − log10 w_min) (log scale over the 600 links).
  - W is the Hebbian weight.
- The pulse travels visibly along that link's branch path, red when the net sign is inhibitory.
- *Sign from the sample.* sgn(A) = (n_E − n_I)/(n_E + n_I), counting sampled neurons whose primary neuropil is A. Acetylcholine and glutamate count as excitatory (as specified for this build); GABA counts as inhibitory. Dopamine, serotonin and octopamine are modulatory and excluded from the sign. Regions with no sampled ACh, Glut or GABA neurons are treated as excitatory (sgn = 1). This is an assumption, not data. Note that in flies glutamate is often inhibitory via GluCl; the brief asked for it to be treated as excitatory.
- *Hebbian learning.* When B spikes, each in-link gets W += 0.04·trace(A); W relaxes to 1 with τ = 90 s.
- *Neuron sample.* Neurons are drawn at their real positions (1/3, 1/2 or all of the sample, by quality), bound to the nearest branch so they sway with it. Colour shows the neurotransmitter: ACh/Glut blue (excitatory), GABA red (inhibitory), DA/5-HT/OA violet (modulatory). Brightness follows the activity of the neuron's neuropil.

**Inputs reach real sensory neuropils.**
- Ambient light: medulla ME_L/ME_R +0.25. This is a model constant, not data.
- Pointer motion: ME, LO and LOP on the hemisphere matching the screen half, +0.5·speed.
- Voice and website section: antennal lobes AL_L/AL_R, +0.6·voice + 0.4·tanh(section input).
- Attention: the spark's current neuropil +0.12, plus the ipsilateral ME +0.1.
- Hover or focus on a theme: +0.06 to each of its neuropils.
- From these inputs, activity spreads only through the real graph.

**Decisions: three real circuits compete.** A leaky competing accumulator, the Usher–McClelland model (a drift-diffusion-style winner-take-all), runs between:
- the mushroom body (all MB_* neuropils): memory and learning → **recall**;
- the central complex (FB, EB, PB, NO): navigation → **explore**;
- the lateral horn (LH_L/R): innate response → **react**.

The equations:
- Evidence eₖ = (mean firing rate of group k ÷ (whole-brain mean + 0.05)) · (1 − adaptation Fₖ), capped at 3.
- dXₖ = (0.6·eₖ − Xₖ − 0.5·Σ_{j≠k} Xⱼ)·dt + 0.18·dW, with Xₖ ≥ 0.
- A decision is made when max Xₖ > 0.5, at least 1.5 s after the last one, and once the spark has finished its previous path. Then X ← 0.2·X and the winner's adaptation Fₖ += 0.5 (τ = 6 s).

Each mode picks a target in its own way:
- *Recall:* the MB out-link to a non-MB region that maximises wn·W·(0.5 + rate). This is the strongest learned association.
- *Explore:* the neuropil with the most novelty and least theme coverage: (1 − coverage) + 1/(1 + visits) + 0.1·log10(synapses).
- *React:* the LH out-link whose target is currently most active (rate·wn).

After a decision:
- *Reinforcement:* every link from the winning group to the chosen target gets W += 0.15, so past choices bias future ones.
- *Spark:* the attention spark travels along the tree path to the target's hub.
- *Logging:* each decision is shown in the on-page thought stream and posted as a `thira-event` of kind `decide`. The event carries the mode, the winning circuit, the target neuropil and theme, a reason quoting the real synapse count and learned weight, the evidence for MB, CX and LH, and the accumulator values. The dashboard thought stream renders it.

**Themes → real neuropil groups** (a design mapping, not a claim about the brain):

| Theme | Neuropils |
|---|---|
| practice (premotor / output) | LAL, VES, SPS, IPS, GNG, EPA, GOR, CAN, FLA, PRW, SAD |
| sacred geometry (central complex, the compass) | FB, EB, PB, NO, BU, GA |
| kerala (innate and context) | LH, SLP, SIP, SMP, CRE |
| nature (senses) | ME, LO, LOP, LA, AME (vision); AL (olfaction); AMMC, WED (mechanosensation and hearing) |
| BIM precision (memory) | MB_CA, MB_PED, MB_VL, MB_ML |
| storytelling (integration) | AVLP, PVLP, PLP, AOTU, SCL, ICL, IB, ATL, OCG |

Theme labels sit at the hub of each theme's largest neuropil (by synapses). Theme sync and rate, and therefore the workspace ignition of §14, are now computed from the region units.

**Not data.** All gains, thresholds, time constants and the input mapping are modelling choices. The data are the region positions, volumes and synapse totals, the 600 link weights, and the neuron positions and neurotransmitters.

## 16. mind.html: one engine, three looks

`engine.js` is a rendering-free ES module holding the mind of The Conscious Forms: the FlyWire v783 region network (78 FitzHugh–Nagumo units coupled only through the 600 real links, log-scaled synapse weights, neurotransmitter sign, conduction delay = Euclidean centroid distance / 2.5 + 30 ms), Hebbian link plasticity, the MB / CX / LH leaky competing accumulator (§15), global-workspace ignition (a slow charge C, dC/dt = (1/20 s)·clamp(mean rate/0.3, 0.5, 1.5), with refractory adaptation) and the self-model. `mind.html` imports it and renders it three ways. Engine step: fixed h = 1/120 s. (`cosmic.html` still holds its own copy of these equations, because there they are bound to the tree's branch paths.)

**Spike phase and coherence.** Each region's phase φ = 2π·frac((t − t_last spike)/ISI), where ISI is an EMA of inter-spike intervals. Coherence r = |Σ wᵢ e^{iφᵢ}| / Σ wᵢ, with w = min(1, rate) (Kuramoto order, rate-weighted).

**Self-model.** Each region forecasts its own activity: m ← low-pass(act, τ = 0.6 s), trend ṁ ← low-pass(dm/dt, 0.4 s), prediction p = max(0, m + 0.3 s·ṁ). Error e ← low-pass(|act − p|, 0.5 s). Awareness A ← low-pass((0.6 G + 0.4 r)·(1 − min(1, ē/0.05)), 1.2 s).

**Stream.** Fluid parcels with semi-implicit Euler: dv/dt = 2(U − vₓ) x̂ − 1.2 v_⊥ + (0.08 + 0.05·age)·curl-noise + 3e^{−age/2.2 s}(y_lane − y). U = 1.05 units/s, so the x axis is time (ticks every 2 s). Region i emits (1.5 + 60·actᵢ + 6·rateᵢ) parcels/s at the "now" line. A decision steers the winning circuit's parcels, plus 30 % of the others, toward the target's lane for 2.2 s, and they then adopt that lane (the fork). Ignition is a front x_w = x₀ + 3.2 (t − t_ign) that pushes parcels away from the axis (gain 9e^{−Δt/2.5 s}): a widening, brightening wave.

**Field.** u_tt = c²∇²u − γu_t + Σᵢ Aᵢ sin(Ωτ + φᵢ) g(x − xᵢ) on a 128–256² GPU grid (leapfrog, c = 1, dt = 0.7·dx/√2, γ = 0.9, clamped circular rim). Sources sit at the real (x, z) centroids; Aᵢ = 0.25 + 2.2 actᵢ + 0.6 min(1, rateᵢ), boosted ×2.5 on the attended region for 1.5 s after a decision. On ignition all phases lock to 0 for about 3 s. Ω = 26 is a shared carrier, so phase alignment decides the interference. Display: signed u, and nodal lines where the time-averaged energy ⟨u²⟩ (EMA) is low, which is where Chladni sand settles. A display-only auto-gain samples the texture every 0.5 s.

**Mirror.** Points on a Fibonacci sphere, each owned by the region with the nearest standardised centroid direction. Outer shell: radius 2 + 0.55 act + 0.12 min(1, rate). Inner shell: radius (1.45 + 0.5·conf) + 0.55 p, with conf = 1 − min(1, ē/0.05), blended toward the outer radius by A/4 (convergence). Points are masses on radial springs (k = 40 / 28, damping 5 / 4) with jitter proportional to error (the shimmer). Tension lines join each region's actual and predicted anchors, with opacity ∝ eᵢ. The "I" at the centre scales with A and flashes on ignition, and a ray from the centre marks the attended region.

Every look keeps the FlyWire attribution on the page.
