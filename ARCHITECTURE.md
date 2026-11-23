# ARCHITECTURE.md — BridgeLab (Serverless Double Dummy OLAP Portal)

## 1. Project Overview
**BridgeLab** is a serverless, client-side bridge analytics portal capable of querying **5,000,000 simulated bridge deals** (~3.34M aggregated OLAP rows) in under 5 ms directly in the browser using typed arrays and Parquet (`hyparquet`).
- **Live URL:** `https://github.io`
- **GCS Data Bucket:** `gs://bridge-dds-explorer-data/v1/`

---

## 2. Repository Structure
```text
BridgeLab/
├── ARCHITECTURE.md            # Core system rules & schema reference (always read first)
├── pipeline/                  # Python offline simulation & OLAP aggregation
│   ├── constants.py           # Bitmask definitions (conv_flags, technique_flags)
│   ├── 1_generate_dds.py      # Multiprocessing DDS simulator (endplay) -> raw_chunks
│   ├── technique_detector.py  # Two-Tier heuristic detector for Squeezes, Endplays & Coups
│   ├── 2_build_olap.py        # DuckDB streaming aggregation -> bridge_olap.parquet
│   ├── 3_build_samples.py     # Stratified sample extraction + Gemini Notes -> sample_deals.json
│   └── run_pipeline.py        # CLI orchestrator (e.g. `python pipeline/run_pipeline.py 5000000`)
└── web/                       # React + TypeScript + Vite + Tailwind frontend
    ├── public/data/           # Local dev copies of Parquet/JSON (ignored in git if large; hosted on GCS)
    └── src/
        ├── types/bridge.ts    # TypeScript interfaces & bitmask constants (must match pipeline/constants.py)
        ├── engine/
        │   ├── bridgeQueryEngine.ts   # In-memory columnar TypedArray query engine
        │   └── sampleDealsEngine.ts   # Example hand filter & Gemini Note selector
        ├── components/
        │   ├── ConventionView.tsx     # Shared view wrapper for convention pages
        │   ├── MadLibsFilter.tsx      # Natural-language inline filter bar
        │   ├── AdvancedFilterDrawer.tsx # Detailed multi-criteria filter drawer
        │   └── FourHandCardViewer.tsx # 4-hand diagram + DDS matrix + Gemini Notes display
        └── pages/             # Route views (FlanneryPage, WeakTwoPage, PrecisionPage, ExplorerPage, etc.)
```

---

## 3. Data Schema & Column Indices (`bridge_olap.parquet`)
**CRITICAL RULE:** Never reorder existing columns `0..13`. `bridgeQueryEngine.ts` relies on exact positional indices when reading `hyparquet` rows into TypedArrays.

| Index | Column Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `0` | `opener_hcp` | `uint8` | Opener High Card Points (0–40) |
| `1` | `spades` | `uint8` | Opener Spade length |
| `2` | `hearts` | `uint8` | Opener Heart length |
| `3` | `diamonds` | `uint8` | Opener Diamond length |
| `4` | `clubs` | `uint8` | Opener Club length |
| `5` | `conv_flags` | `uint16` | Opening convention bitmask |
| `6` | `responder_hcp` | `uint8` | Responder High Card Points |
| `7` | `spade_fit` | `uint8` | Combined NS Spade count |
| `8` | `heart_fit` | `uint8` | Combined NS Heart count |
| `9` | `dds_s` | `uint8` | Max Double Dummy tricks in Spades (NS) |
| `10` | `dds_h` | `uint8` | Max Double Dummy tricks in Hearts (NS) |
| `11` | `dds_nt` | `uint8` | Max Double Dummy tricks in No Trump (NS) |
| `12` | `opp_game` | `uint8` | Flag indicating EW can make game |
| `13` | `deal_count` | `uint32` | Aggregated number of deals in this OLAP bucket (`SUM = 5,000,000`) |
| `14` | `technique_flags` | `uint16` | Advanced play technique bitmask (Squeezes, Endplays, Coups) |

---

## 4. Bitmask Constants (Must Stay Synced Between Python & TypeScript)

### A. Opening Conventions (`conv_flags`)
- `1` (`1 << 0`): Flannery (`11–15 HP, 4♠ + 5♥`)
- `2` (`1 << 1`): Weak Two (`5–10 HP, 6-card major`)
- `4` (`1 << 2`): Precision 1♣ (`16+ HP`)
- `8` (`1 << 3`): Multi 2♦ (`Weak 2M or strong balanced/4-4-4-1`)

### B. Play Techniques (`technique_flags`)
- `1` (`1 << 0`): `TECH_SQUEEZE` (Simple, Double, Strip Squeeze)
- `2` (`1 << 1`): `TECH_ENDPLAY` (Elimination & Throw-in / Forced Return)
- `4` (`1 << 2`): `TECH_TRUMP_COUP` (Grand Coup, Devil's Coup, Coup En Passant, Smother Play)
- `8` (`1 << 3`): `TECH_UNBLOCK_COUP` (Vienna Coup, Anti-Bath Coup)
- `16` (`1 << 4`): `TECH_COMMUNICATION_COUP` (Scissors Coup, Merrimac Coup, Deschapelles Coup, Holdup)
- `32` (`1 << 5`): `TECH_CHOICE_COUP` (Morton's Fork Coup, Crocodile Coup, Avoidance Play, Alcatraz Coup)
- `64` (`1 << 6`): `TECH_INTRA_FINESSE` (Intra-Finesse / Double Pinning)

---

## 5. Frontend Coding & State Rules
1. **Prevent React Render Loops:** Never pass inline object literals (e.g. `defaultFilter={{ ... }}`) as props to `ConventionView.tsx` if they trigger `useEffect` resets. Memoize default filters or initialize state once.
2. **Query Performance:** Keep the inner loop in `bridgeQueryEngine.ts` allocation-free (use bitwise `&` operations on TypedArrays; avoid creating objects inside the 3.34M row loop).
3. **Git Hygiene:** Never commit `web/dist/` to Git. GitHub Actions automatically builds and deploys `web/` to GitHub Pages on every push to `main`.
4. **Verification:** Every frontend task must pass `npm run build` (`tsc && vite build`) cleanly before committing.
