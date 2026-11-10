# Civil design implementation backlog

## Completed milestone: 0.2 civil foundations

Drafting, editable geometry, layers, parcels, traverses, survey CSV, unconstrained TIN, contours, fixed terrain view, flat-datum volumes, tangent alignments, existing-ground profiles, ASCII DXF primitives, image underlay and scaled SVG. See README for precise limitations.

## Next milestone: reliable terrain and project architecture

1. Extract application state/commands from UI; stable entity references, schema migrations and object-level dependency invalidation. In progress: project defaults, validation and legacy migration are isolated in `ui/project-model.js`; document transactions and undo/redo are isolated in `ui/document-history.js`; terrain/profile dependency checks are isolated in `ui/document-dependencies.js`; application state and UI effects remain coupled.
2. Implement constrained triangulation with breaklines, outer boundaries and holes; handle coincident/conflicting points explicitly. A first implementation now supports selected-linework role inference, interpolated boundary/hole elevations and breakline-to-survey-point matching, with unsupported/conflicting geometry rejected.
3. Validate constraint recovery against independent reference datasets and broader topologies: concave boundaries, multiple holes, shared constraint vertices, hull coverage, topology, interpolation, contours and quantity conservation. This remains incomplete; the feature is not engineering-validated.
4. Coordinate reference system and unit conversion contracts; separate horizontal units, vertical units and datums.
5. Point editing/grouping, survey import diagnostics and spatial indexing for larger datasets.

Acceptance: boundary and breakline topology preserved, excluded regions never triangulated; analytical slopes and surface comparisons reproduce known results; edits invalidate all affected derived objects. The current constrained-TIN implementation is a tested first slice, not yet acceptance-complete.

## Horizontal and vertical design

- Circular/compound/reverse curves, tangent continuity and spirals.
- Station/offset querying and geometry event sampling.
- Vertical PVI/tangent/parabolic-curve profiles, design elevations and grade reports.
- Versioned design criteria and explicit warnings; no silent jurisdiction assumptions.

Acceptance: known horizontal/vertical geometry cases, station continuity, exact endpoints, curve tangency, and independent profile checks.

## Grading and quantities

- 3D feature lines, elevation rules, target surfaces and daylighting.
- Bounded proposed surfaces and exact surface-to-surface earthwork.
- Materials, stripping, bulking/compaction factors and quantity reports.

## Corridors and sections

- Assemblies/subassemblies, regional baseline assignment and dependencies.
- Crossfall/superelevation, corridor sampling and daylight targets.
- Sample lines, cross-sections, intersections and corridor-derived surfaces.

## Drainage and utilities

- Gravity structures/pipes, invert/rim elevations and network topology.
- Pipe profile views, cover/interference checks and hydraulic calculations.
- Catchments, hydrologic methods, storm inputs, storage/pond routing.
- Pressure networks and validated analysis models.

## Drawing production and exchange

- Completed first slice: catalog civil symbols stamped as editable grouped geometry; editable leader notes; generated major-contour text labels; independently framed, clipped model viewports in Paper Space; and bounded ASCII DXF import for bulged/classic 2D polylines plus supported single-loop hatch patterns.
- Remaining drafting work: user-defined reusable blocks, fillet/chamfer, advanced trim/extend, richer object snaps and constraints.
- Remaining production work: annotation scaling, LandXML, GIS imports, references and broader interoperability tests. Draft Civil-native `.draft` sheet-set metadata and same-size multi-page PDF publishing are available; Autodesk `.DST` compatibility and mixed-paper-size multi-page PDF publishing are not.
- DWG: evaluate a supported/licensed compatibility solution; do not claim native support through primitive DXF exchange.
- Cloud persistence, file/version history, collaboration, permissions and large-file processing.

## Completion policy

Deliver working vertical slices with regression tests, documented limits and preserved project compatibility. Do not expose inactive tools as if implemented. Autodesk feature descriptions are a scope baseline, not a promise of binary compatibility or equivalent engineering validation. Full product parity requires substantial continuing development, independent validation and potentially licensed interoperability components.

Official reference: https://www.autodesk.com/products/civil-3d/product-details

## Completed update: 0.3 plan templates and borders

Four editable plan starters; four preset border layouts; four exact paper sizes; editable project metadata, notes, legend and grid; live preview; fixed/automatic scale; full-plan and blank-border SVG export. This extends production-sheet support without implying native AutoCAD paper-space or DWG layout interoperability.

## Completed update: Editable Paper Space

Projects now migrate their existing single sheet into a validated multi-sheet collection. Paper Space supports adding, duplicating and deleting sheets; custom border mode; and editable paper-space lines, rectangles and text with selection, move/resize grips, text/style editing, and zoom/pan. Paper-space objects persist with each sheet and appear in SVG/PDF exports; the existing preset sheet editor remains available. This is a focused 2D sheet workflow, not native CAD paper-space or DWG layout interoperability.

## Completed update: Paper-space images and schedules

Custom sheets can embed local PNG, JPEG or WebP images (up to 1.6 MB per file and 12 MiB of image data per project), adjust opacity, and move or resize them on the page. Tab-separated cell data can be pasted as a bounded table, then edited, moved and resized. Images and tables persist per sheet and render into SVG/PDF output. This supports map insets and schedules, but does not add model-space image references, spreadsheet formulas, or reusable symbol/block libraries.

## Completed update: layer appearance and hatches

Layer-controlled colors, linetypes and lineweights; per-object solid, ANSI31 and crosshatch patterns for closed outlines; object and multi-selection layer reassignment; DXF export of linetypes, weights and hatch entities. DXF hatch import and advanced hatch scaling remain future interoperability work.

## Completed update: Draft Civil sheet sets and Paper Space editing

The existing version-2 `.draft` project format now stores bounded sheet-set name, description, issue and set-revision metadata while retaining per-sheet revision fields and migration of older projects. Paper Space supports Shift/Ctrl multi-selection, group move, Ctrl-drag copy, group delete, keyboard Delete/Backspace and Undo/Redo, preserving per-sheet paper objects and existing placement/edit/resize/style workflows. The desktop PDF IPC path validates every rendered sheet; one ordered multi-page PDF is supported when all sheets share a paper size. Mixed-size sets must be deliberately exported as separate PDFs, each at its own physical size. This is a Draft Civil-native format, not Autodesk `.DST` or DWG layout interoperability.
