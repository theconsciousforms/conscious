# FlyWire data sources for flywire-neuropils.json

Built 2026-10-15 by tools/build.py. No sign-in was used. All values are computed from the files below; nothing is estimated or made up.

## Files used
1. **FlyWire Whole-brain Connectome Connectivity Data**, version 783.0, Zenodo, DOI 10.5281/zenodo.10676866, licence **CC-BY 4.0** (checked against the Zenodo record metadata). Author: FlyWire Consortium.
   - `proofread_connections_783.feather` (852,022,274 bytes, md5 f48f972d262323a102aed49af1396b8a, which matches Zenodo): https://zenodo.org/api/records/10676866/files/proofread_connections_783.feather/content
   - `per_neuron_neuropil_count_pre_783.feather` (md5 90fcdb42…, which matches; downloaded but not used in the final build): https://zenodo.org/api/records/10676866/files/per_neuron_neuropil_count_pre_783.feather/content
2. **FlyWire neuron annotations** (Schlegel et al. 2024), tag **v2.1.0**, which is the version reported in the papers (materialization 783): https://raw.githubusercontent.com/flyconnectome/flywire_annotations/v2.1.0/supplemental_files/Supplemental_file1_neuron_annotations.tsv
   This GitHub repo has no licence file. The paper and the Zenodo supplement (DOI 10.5281/zenodo.10877326) are CC-BY 4.0.
3. **Neuropil surface meshes**: JFRC2 neuropils mapped into FlyWire (FAFB14.1) space, from `fafbseg/data/JFRC2NP.surf.fw.zip` in https://github.com/navis-org/fafbseg-py (commit d0da95123ee606e204ae2c702e7bc78538646fbd, GPL-3.0 code repo). Its README says these were downloaded from `gs://flywire_neuropil_meshes/neuropils/neuropil_mesh_v141_v6`, which is public. Only the derived centroids and volumes are stored here.

## Citations (checked with Crossref)
- Dorkenwald S. et al. *Neuronal wiring diagram of an adult brain.* Nature 634(8032):124–138 (2024). doi:10.1038/s41586-024-07558-y (CC-BY 4.0)
- Schlegel P. et al. *Whole-brain annotation and multi-connectome cell typing of Drosophila.* Nature 634(8032):139–152 (2024). doi:10.1038/s41586-024-07686-5 (CC-BY 4.0)
- Data credit: FlyWire Consortium / Princeton University. Credit line required by CC-BY: "Connectome data: FlyWire (flywire.ai), Dorkenwald et al. 2024; Schlegel et al. 2024; CC-BY 4.0."

## Derivations and caveats
- The proofread connections in the v783 release only include neuron pairs with at least 5 synapses in a neuropil. Synapse totals here therefore come to 54,492,922 rather than the full ~130M.
- `region_edges` is a derived measure: synapses in neuropil B made by neurons whose main input neuropil is A. It is not a direct neuropil-to-neuropil synapse count.
- Neuron positions use soma coordinates where they exist and the annotation point otherwise. They are converted from 4×4×40 nm voxels to nm. That voxel size is the standard FlyWire one, and it is consistent with the mesh coordinates.
- Region `UNASGD` (unassigned synapses) has no mesh or centroid.
- The Codex download page (codex.flywire.ai/api/download) was not used because it requires sign-in.
