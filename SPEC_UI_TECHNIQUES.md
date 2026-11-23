# TECHNICAL SPECIFICATION: Interactive Play Technique Filters (`technique_flags`)

## 1. Objective
Expose the newly generated `technique_flags` bitmask column (index `14` in `bridge_olap.parquet` and `technique_flags` property in `sample_deals.json`) as interactive UI filters in **BridgeLab**. Users must be able to filter both the 5M OLAP statistics and the 4-hand sample deals by advanced bridge play techniques (Squeezes, Endplays, and Coups).

---

## 2. Bitmask Reference (`web/src/types/bridge.ts`)
Ensure the following bitmask constants and filter types are exported and used consistently:
- `TECH_SQUEEZE = 1` (`1 << 0`) — Skvis (Squeeze)
- `TECH_ENDPLAY = 2` (`1 << 1`) — Slutspil (Endplay / Throw-in)
- `TECH_TRUMP_COUP = 4` (`1 << 2`) — Trumfkup (Grand Coup, En Passant, Smother)
- `TECH_UNBLOCK_COUP = 8` (`1 << 3`) — Afblokering (Vienna Coup, Anti-Bath)
- `TECH_COMMUNICATION_COUP = 16` (`1 << 4`) — Kommunikationskup (Scissors, Merrimac, Deschapelles)
- `TECH_CHOICE_COUP = 32` (`1 << 5`) — Valg-kup (Morton's Fork, Krokodillekup, Avoidance)
- `TECH_INTRA_FINESSE = 64` (`1 << 6`) — Intra-knibning

Extend `BridgeFilter` interface in `web/src/types/bridge.ts`:
- Add `techniqueMask?: number;` (bitmask of selected techniques; `0` or `undefined` means "Alle spil").
- Add `techniqueMatchMode?: 'ANY' | 'ALL';` (default `'ANY'`, i.e., `(row.technique_flags & filter.techniqueMask) !== 0`).

---

## 3. Data & Query Engine Updates

### A. `web/src/engine/bridgeQueryEngine.ts`
- Ensure `technique_flags` (column index `14`) is read from `bridge_olap.parquet` and stored in the in-memory typed array (`Uint16Array`).
- In the core filter loop:
  ```ts
  if (filter.techniqueMask && filter.techniqueMask > 0) {
    const rowTech = db.technique_flags[i];
    if (filter.techniqueMatchMode === 'ALL') {
      if ((rowTech & filter.techniqueMask) !== filter.techniqueMask) continue;
    } else {
      if ((rowTech & filter.techniqueMask) === 0) continue;
    }
  }
  ```
- Maintain sub-5ms query latency across the 3.34M OLAP rows.

### B. `web/src/engine/sampleDealsEngine.ts`
- Apply the exact same `techniqueMask` bitmask filtering when selecting example deals for `FourHandCardViewer.tsx`.
- Prioritize showing sample deals that contain a non-empty `gemini_note` when `techniqueMask > 0` is active.

---

## 4. UI Component Updates

### A. `web/src/components/MadLibsFilter.tsx`
- Add a clean, inline pill/dropdown selector to the natural-language filter bar:
  - Default label: **"alle spilteknikker"** (or **"kræver ingen speciel teknik"**).
  - Quick options:
    - `Alle spil` (`0`)
    - `Enhver avanceret teknik` (`127` with `'ANY'`)
    - `Skvis` (`1`)
    - `Slutspil` (`2`)
    - `Avancerede Coups` (`4 | 8 | 16 | 32` with `'ANY'`)
- Ensure changing this dropdown updates `filter.techniqueMask` without triggering any unwanted state resets in `ConventionView.tsx`.

### B. `web/src/components/AdvancedFilterDrawer.tsx`
- Add a dedicated collapsible/grouped section: **"Avancerede Spilteknikker (DDS)"**.
- Render multi-select toggle chips/checkboxes for all 7 technique categories (`Skvis`, `Slutspil`, `Trumfkup`, `Vienna / Anti-Bath`, `Scissors / Merrimac`, `Morton's Fork / Krokodille`, `Intra-knibning`).
- Toggling a chip toggles its bit in `filter.techniqueMask` (`mask ^= bit`).
- Include a small segmented toggle for **"Mindst én valgt (OR)"** vs. **"Alle valgte (AND)"** (`techniqueMatchMode`), plus a "Nulstil teknikker" link when `techniqueMask > 0`.

---

## 5. Verification & Deployment
1. Run `npm run build` (`tsc && vite build`) in `web/` to ensure zero TypeScript or bundling errors.
2. Verify in browser/console that selecting e.g. `Skvis` (`techniqueMask = 1`) updates KPI totals, charts, and loads sample deals with `gemini_note` explanations in `FourHandCardViewer`.
3. Commit and push to `main` to trigger GitHub Actions deployment.
