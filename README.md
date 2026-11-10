# Draft Civil Desktop 0.5.0

A Windows-oriented desktop edition of the Draft Civil web implementation. The existing drawing tools, parcels, survey/TIN tools, templates, and sheet borders are preserved. The hosted website is unchanged.

## Ready-to-run Windows bundle

1. Extract the ENTIRE Windows ZIP to a writable folder on your PC.
2. Open the extracted folder and run `DraftCivil.exe`.
3. Keep the EXE together with its DLLs, `resources`, and other bundled files. Do not copy the EXE by itself.

The Windows bundle is a portable x64 (Intel/AMD) application. It includes Electron and does not require Node.js, Python, a browser tab, a server, or a ChatGPT sign-in to run. It is an unsigned development build; a publisher code-signing certificate and Windows-native end-to-end testing are not included.

## Desktop features

- Native application window, File/Edit/View/Help menus and desktop keyboard shortcuts.
- Native Open, Save and Save As for `.draft` projects; Save updates the file you opened.
- Native save dialogs for SVG, DXF and CSV exports.
- PDF export from Sheet setup at the selected physical page size and scale. Paper Space can publish up to 50 sheets as one multi-page PDF when every sheet uses the same paper size (8 MiB per rendered sheet, 24 MiB aggregate; output page count is verified). Mixed-size sets are deliberately exported as separate per-sheet PDFs so each physical size is preserved; the current Electron print pipeline does not claim mixed-size multi-page support. Print at actual size / 100%.
- Editable multi-sheet Paper Space with custom borders, legends and notes; create, move, resize and style paper-space lines, rectangles and text, add local PNG/JPEG/WebP images (1.6 MB per file; 12 MiB aggregate image data), tables from tab-separated cells, and independently framed model viewports. Paper Space tools and sheet controls are organized in a scrollable side panel with collapsible groups, keeping the sheet visible while editing. Sheet and viewport scales include common site presets from **1″ = 10′** through **1″ = 200′**, alongside custom scale entry. Viewports support a dynamic scale, model pan, and frame resize that preserves scale. Placing a viewport hides the fitted full-sheet model view; use **Show full model** to toggle it back on. Tables can be placed by clicking the sheet or using **Place table at sheet center**. Shift/Ctrl-click selects multiple paper objects; drag moves the group, Ctrl-drag copies it, and Delete/Backspace removes the selection. Undo/redo work inside Paper Space. Paper items persist per sheet. **Publish all sheets PDF** creates one ordered multi-page PDF for same-size sets; **Export PDFs separately** is the explicit mixed-size alternative. SVG export remains available for the active sheet.
- Multiple model-space raster references for PNG/JPEG/WebP images or rendered PDF pages. Use **Rasters** on the left toolbar to import, show/hide, select and remove references. Selecting one exposes its placement, opacity, lock and calibration controls in the right inspector. Visible references are included in fitted model views and model viewports when sheets are exported. Projects support up to 64 references, with a 2.2 MB encoded-data limit per reference and a 12 MiB aggregate budget. Model-space raster references are separate from images placed directly on a Paper Space sheet.
- Model-space inspector sections are collapsible. Selecting an object filters the right inspector to its relevant editing controls (including inline text-annotation editing); clearing the selection restores the general drawing panels.
- `.draft` projects include bounded Draft Civil-native sheet-set name, description, issue and set-revision metadata. Per-sheet revision remains independent. This is not an Autodesk `.DST` file or an AutoCAD Sheet Set Manager integration.
- User-defined reusable blocks: create a named definition from selected objects with a chosen base point, place linked uniform-scale/rotation instances by clicking, edit shared primitive geometry, inspect/rename definitions, and delete definitions with their instances. Block definitions persist in version-2 `.draft` projects; DXF export expands instances into their supported primitive geometry.
- Named, reusable civil label styles for parcel labels, generated contour labels, and alignment station/report labels. Create, edit and select project-saved styles with text height and layer/custom color; parcel styles control area/distance precision and area format, contour styles control elevation precision, and alignment styles control station notation/precision, distance precision and elevation precision. Apply a style to selected matching label objects; unrelated text, leaders and dimensions are not silently restyled. Older version-2 projects migrate to family-specific defaults.
- Reusable named text styles with project-saved text height, color and font presentation, available to model and Paper Space text. Existing projects are migrated to compatible defaults.
- Persistent LINE constraints: select a LINE and choose **Constrain horizontal** or **Constrain vertical** in its properties, or explicitly remove its constraint. Applying a constraint aligns endpoint B with endpoint A; later edits, grips, moves, scales, rotations, deletes and undo/redo must preserve the invariant or are rejected. Constraints apply only to model LINE entities (not block definitions or instances) and do not alter terrain calculations. Current scope is LINE horizontal/vertical only—there are no coincident, parallel/perpendicular, dimensional, or general solver features. Constraints persist in version-2 `.draft` projects; older version-2 projects migrate with no constraints.
- Disk recovery in the OS application-data directory. The previous session is restored at startup, including unsaved work.
- On close, choose Save and quit, Keep recovery and quit, or Cancel when there are unsaved changes.
- TIN construction, contour regeneration, flat-datum volumes and profile sampling run on a dedicated worker thread.
- Packaged, local assets; no internet access or account login required during use.

On Windows, recovery normally resides beneath `%APPDATA%\Draft Civil Desktop\recovery.json`. Recovery is a convenience, not a substitute for saving a deliberate `.draft` file and keeping backups.

## Move drawings from the website

On the website use **Save project** to download a `.draft` file. Open that file with **File > Open project** (Ctrl+O) in the desktop app. Desktop and browser storage are separate; no automatic cross-device sync is included.

## Shortcuts

| Action | Windows |
| --- | --- |
| New drawing | Ctrl+N |
| Open project | Ctrl+O |
| Save | Ctrl+S |
| Save As | Ctrl+Shift+S |
| Sheet setup / PDF | Ctrl+P |
| Fit drawing | Ctrl+0 |
| Undo / redo drawing | Ctrl+Z / Ctrl+Shift+Z |

## Build or run from source

Requires Node.js 22.13 or later and internet access for the initial dependency/runtime installation. Node.js 24 LTS is a suitable choice.

On Windows, double-click `START_WINDOWS.cmd`, or use:

```text
npm ci
npm start
```

The pinned Electron runtime is downloaded by the postinstall script. Tests and packaging:

```text
npm test
npm run check
npm run package:win
```

`npm run package:win` produces `release/Draft Civil Desktop-win32-x64/`. Package that entire folder for distribution. Build scripts for Linux x64 and macOS arm64 are supplied as source options; those platforms are not delivered as tested products. No installer, file association, auto-update service, signing or notarization is configured.

## Architecture and performance

- `ui/`: HTML, CSS and JavaScript interface; `project-model.js` owns project defaults, validation and migration; `label-styles.js` defines civil label families, named-style validation and number formatting; `document-history.js` owns document transactions and undo/redo; `document-dependencies.js` tracks terrain and profile invalidation; `constrained-surface.js` builds boundary-, hole- and breakline-constrained TINs; `appearance.js` defines layer line styles, weights and hatch rendering.
- `desktop/main.cjs`: native window, menus, dialogs, restricted IPC, app recovery, PDF export and worker dispatch.
- `desktop/preload.cjs`: narrow context-isolated bridge; the renderer has no Node.js or general filesystem access.
- `desktop/geometry-worker.mjs`: the same JavaScript algorithms, executed off the UI thread.
- `desktop/files.mjs`: bounded input, atomic writes and serialized recovery.
- `tests/`: project-model, document-history and dependency invalidation, geometry, exchange, paper-sheet, worker and desktop file/IPC validation checks.

This is an Electron desktop application, not a C++ CAD-engine rewrite. Packaging alone is not a measured improvement in calculation speed or memory use. Offloading calculations is intended to keep the interface responsive. TINs are limited to 1,500 triangulated vertices; interpolated boundary and hole vertices count toward that limit. Numerical performance has not been compared against AutoCAD or Civil 3D.

## Validation and limits

The automated suite (`npm test`) covers geometry, constrained surfaces, project validation, exchange, worker-thread jobs, recovery, atomic file writes, filename/path limits, sender URLs and PDF input checks. `npm run check` syntax-checks the desktop main/preload and renderer entry points. These checks do not replace Windows-native UI verification or independent civil-engineering validation.

This remains a concept-design and geometry-exploration tool. It has no engineering certification, design-code validation, native DWG support, corridor modeling or pipe-network analysis. Read `CIVIL_ROADMAP.md` for the retained development backlog. A desktop conversion does not provide full Civil 3D feature parity.

### Constrained TIN surfaces

Select linework and choose **Build constrained TIN**. The largest selected closed polyline is the outer boundary, additional selected closed rings are holes, and selected open lines/polylines are breaklines. Boundary and hole elevations are interpolated from the survey TIN; every breakline vertex must match a survey point in XY. The outer boundary and holes must lie within the survey-point hull. Crossing constraints, overlapping holes, unsupported rings, conflicting elevations and surfaces exceeding 1,500 triangulated vertices are rejected rather than silently approximated.

Contours, profiles, flat-datum volumes, project save/load and DXF terrain-face export use the resulting constrained surface. Constraint recovery currently has focused regression tests, but has not yet been independently validated across a broad engineering reference dataset; do not treat it as certified design software.

### Layer appearance and hatching

Layers support continuous, dashed, dotted, dash-dot, center, hidden, phantom, divide, long/short dash, property, floodplain, storm/sanitary/water, gas/electric/telecom, fence and tree-line patterns, plus standard lineweights from 0.13 to 1.00 mm. The fence linetype uses repeated X marks over a dashed line in model space, sheet viewports and DXF output. **Civil legend layer library** shows a visual line sample for each preset and adds the attached legend's existing/proposed boundaries, contours, site features, material areas and utility layers individually or in bulk. Presets include color, linetype, weight and default material hatch; layer colors, linetypes, weights and hatch defaults can be edited in the Layers panel. Select an object and use the **Layer** selector in its properties to reassign it; the same control applies to a multi-selection. Closed rectangles, parcels and closed polylines can use solid, ANSI31/ANSI32, crosshatch, earth/soil, brick, pavers, concrete and wetland fills. DXF export includes layer linetypes/weights and HATCH entities; supported HATCH import is documented below.

### Symbols, leaders, contour labels and viewports

The **Symbols** tool places editable landscape, survey, utility, drainage, electrical and site-feature symbols, including test pits, spot elevations, monuments, trees, wells, lights, poles, valves, signs, fence posts, cleanouts, manholes, inlets and meters, plus parking/site symbols. The Civil symbol library displays a geometry thumbnail, name and category for each symbol. **Reusable blocks** let you convert selected lines, rectangles, circles, arcs, text, leaders, dimensions or polylines (open or closed) into a named, locally-coordinate definition; choose its base point, then insert linked instances with a uniform scale and rotation by clicking the canvas. Editing definition primitives updates every instance. Definitions are non-nested and presentation-only: survey points, parcels, alignments, TIN boundaries/holes/breaklines and other civil-analysis objects are intentionally excluded. Instances participate in drawing selection, transforms, bounds, sheets and viewports; ASCII DXF export expands them into primitive entities. DXF block-table import is still unsupported and reported as skipped. The **Leader** tool creates editable multi-vertex arrows with note text. After building contours, **Label major contours** creates one text label per selected major elevation; labels are regenerated by the user and are removed when surface or contour inputs change. Paper Space's **Model viewport** tool inserts an independently framed, clipped view of visible model geometry. Set its scale, pan the model independently, and resize the frame without changing scale; common 1″-to-feet presets are available in Sheet setup and viewport properties. Adding a viewport automatically hides the fitted full-model view, which can be restored with **Show full model**. Sheets export as vector PDFs in the desktop app; in a browser, the export opens the print dialog where **Save as PDF** creates the file. Multi-sheet browser exports use one print dialog for uniform paper sizes or a separate dialog per sheet for mixed sizes.

### Deed courses and reference rotation

The **Bearing & Distance** parcel workflow accepts quadrant bearings in separate N/S, degrees, minutes, seconds and E/W fields. Enter a bare numeric distance in the current drawing units, or use feet-and-inches notation such as `193' 11"`; explicit feet/inches values convert to the drawing's selected units. No automatic traverse closure adjustment is performed. To rotate selected geometry interactively, choose **Rotate by reference** and click a pivot, a point on the source line, and a point in the target direction; the selected objects rotate together around the pivot.

### Object snaps

Selection keeps the active workspace available and adds panels for applicable tools: rectangles, closed polylines and parcels expose parcel workflows; closed boundaries and open linework expose constrained-TIN tools; open lines/polylines expose alignment creation, while selected alignments expose profile tools; text and civil labels expose their style controls. The bearing-and-distance traverse remains available on the Parcels tab with or without a selection.

The bottom information bar provides independent **Grid**, **Grid snap** and **Object snap** controls. Grid visibility does not affect snapping; grid snap can be disabled while object snaps remain active, and object snap can be disabled while grid fallback remains active. **Snap options** in the footer toggles individual modes: Endpoint, Center, Quadrant and Midpoint remain enabled by default; Intersection, Nearest and Perpendicular are available but off by default to preserve prior snapping behavior. Intersection snaps are restricted to actual crossings between finite line segments; extended or infinite-line crossings are not candidates. Nearest and perpendicular snaps use finite linework (and nearest also follows circles and arcs). Hidden layers are excluded; visible locked layers remain snap targets. The footer reports the grid and object snap states and enabled object modes.

Object snaps also work in Paper Space for linework, text anchors, and the frames of rectangles, tables, images and model viewports. Paper snapping uses the same object-snap mode toggles and excludes the items currently being moved or resized. Sheet navigation and panning model contents inside a viewport remain continuous.

### Linework fillet, chamfer, trim and extend

The left toolbar's **Offset**, **Trim**, **Extend**, **Fillet**, **Chamfer** and **Reverse** icons operate on editable linework. For a fillet or chamfer, select exactly two intersecting LINEs, start the command, click the desired corner quadrant, and enter a positive radius or equal distance along each LINE. The operation trims both LINEs and adds a tangent ARC or chamfer LINE in one undoable change; insufficient segment length, parallel/ambiguous geometry and unsupported inputs are rejected.

For trim or extend, select one or more cutting boundary LINEs first, then start the command and click the target LINE. Trim removes the clicked interval between consecutive intersections; when an interior interval is removed, the target becomes two LINE entities. Extend requires a click near the endpoint to move and extends that endpoint to the nearest forward intersection with a finite boundary LINE. Press Enter or Esc to end the command. Selected boundaries remain unchanged. All successful edits use drawing history and preserve layers; existing surface/contour dependency checks continue to apply.

These are deliberately bounded 2D operations in the XY plane at Z=0, not universal CAD behavior: they do not trim/extend arcs, polylines, blocks or infinite construction lines; boundary objects must be finite LINE segments. Fillet/chamfer requires two finite LINE segments that intersect and fit the requested radius/distance on the chosen corner side. Overlapping, parallel, zero-length, nonplanar or otherwise ambiguous geometry is rejected rather than approximated.

The **Offset / inset** command supports lines, dimensions, circles, arcs, rectangles, open or closed polylines, parcels, alignments and leaders. Line-like geometry uses mitered joins; for open paths a positive distance offsets left of vertex order, while closed paths use positive=inward and negative=outward. Circle and arc offsets adjust radius. Zero-length, self-intersecting, overly sharp or collapsed results are rejected.

ASCII DXF import tessellates bulged and classic 2D polylines with a bounded vertex count, and imports single-loop SOLID, ANSI31 and ANSI37/CROSS hatches as closed geometry without duplicating matching boundaries. Multi-loop hatch boundaries, blocks, references, Civil 3D custom objects, binary DXF and native DWG remain unsupported. Tessellation is a drafting approximation, not an engineering curve conversion.

## Build provenance and third-party runtime

Web baseline: version 0.3, source revision `06a8f8d1cfd08e75f169c7a07334a9dbf91a5100`.
Desktop conversion: version 0.5.0, Electron 45.2.1, Electron Packager 20.3.0.
The Windows bundle includes Electron's license and Chromium third-party notices. No account credentials, Site identity, repository access tokens or personal drawings are included in either download.


## New in 0.5 — mouse drafting and import calibration

- Drag to draw lines, rectangles, circles and dimensions; click-click drawing still works. Double-click finishes a polyline.
- Click or Shift-click for selection. Left-to-right box selection requires full containment; right-to-left uses crossing selection. Circle/arc crossing tests use the parent-circle circumference.
- Drag a selected object/group to move; Ctrl-drag copies. Hold Shift while dragging to constrain movement to one axis. Square grips edit vertices, endpoints, centers and radii.
- Space+drag or middle-mouse drag pans; mouse wheel zooms at the cursor. Right-click opens a drawing context menu.
- Floating selection controls provide group move/copy/rotate/scale/delete and reference scaling. Double-click a selected object for numeric geometry editing.
- Top-toolbar Import opens unified DXF, survey CSV, PDF/image and Draft project entry points. Ctrl+I opens this panel; Ctrl+A selects visible drawing objects.
- DXF/CSV imports have source units, additional XY scale, rotation and insertion controls. Source-unit conversion includes elevations; additional plan scaling preserves elevations. Imported object groups can be reselected and scaled together. DXF import includes bounded bulge tessellation, classic 2D polylines and supported single-loop hatches.
- PDF import selects a page, then renders it to a raster underlay using bundled PDF.js 6.4.299. PNG/JPEG/WebP are also supported. One underlay is retained at a time. PDF pages are not converted into editable vectors; native DWG remains unsupported.
- To set reference scale, select an imported group or reference, choose **Scale by reference**, click two known endpoints, and enter the actual distance in drawing units. The first endpoint stays fixed.
- References can be locked, dragged, resized with their upper-right grip, or faded with the opacity slider. Images/PDF pages are downsampled to a maximum 2,600 pixels on the long side and embedded as JPEG. Keep the original PDF separately for full-resolution/vector information.
- Maximum input sizes: PDF 30 MB, image 20 MB before downsampling, DXF 15 MB, CSV 3 MB. Rendered references must fit the embedded-image limit. Some encrypted or unsupported image-compression PDFs may need conversion to an image first.

Browser UI checks covered drag drawing, containment/crossing selection, group movement, calibration, a metric DXF imported as a 10 ft line, and page selection/rendering from a two-page PDF. This shared-renderer check does not replace Windows-native shell/IPC testing.

PDF.js is distributed under Apache 2.0; its license is included in ui/pdfjs/LICENSE and the packaged bundle.
