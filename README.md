# Bridge DDS Explorer (Selvstændig Double Dummy Portal)

En selvstændig, serverless analyse- og simulationsportal for kontraktbridge. Indlæste præsimulerede **endplay/DDS**-spil analyseres direkte i browseren uden backend-servere, tunge WASM-motorer eller brugerlogin.

---

## 🌟 Arkitektur & Nøglefunktioner

1. **Pre-aggregeret OLAP Parquet-klynge:**
   Genererede bridge-spil grupperes offline på statistiske parametre (honnørpoint for åbner og svarer, farvelængder, majorfits, konventions-bitmask og DDS-stik) til kompakte Parquet-filer.

2. **TypedArray In-Memory Motor (< 2 ms query):**
   [Hyparquet](https://github.com/hyparam/hyparquet) udpakker kolonner direkte til flade TypedArrays i browserens RAM. Kun målt query-latens må vises som præstationspåstand.

3. **0 ms Initial Render:**
   Statiske `*_summary.json`-filer kan fungere som et præberegnet initialt view, men må kun komme fra en verificeret pipeline-kørsel.

4. **100% Deterministisk Kort-rekonstruktion:**
   Kortene i de 20.000 gemte eksempler rekonstrueres i realtid i browseren ud fra `deal_id` (Mulberry32 PRNG seed + Fisher-Yates shuffle) og matcher Python-simulatoren bit for bit.

5. **Serverless & Gratis Drift (0 kr./md.):**
   - **Frontend:** Hosted på GitHub Pages via automatiseret GitHub Actions workflow.
   - **Data:** Opbevares i Google Cloud Storage `us-central1` inden for Always Free-kvoten (under 100 GB egress/md).

---

## 📁 Repository Struktur

```text
BridgeLab/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automatisk deployment til GitHub Pages
│
├── pipeline/                     # Offline Python data-generering
│   ├── config.yaml               # Konfiguration (antal spil, konventionsregler)
│   ├── deal_prng.py              # Deterministisk Mulberry32 PRNG & kortfordeling
│   ├── dds_engine.py             # Double Dummy Solver grænseflade (endplay/DDS)
│   ├── 1_generate_dds.py         # Batch generering + DDS -> master_dds.parquet
│   ├── 2_build_olap.py           # Beregner conv_flags bitmask og bygger bridge_olap.parquet
│   ├── 3_build_samples.py        # Udtrækker sample_deals.parquet + statiske summaries
│   ├── run_pipeline.py           # Kører trin 1, 2 og 3 samlet
│   ├── setup_gcs.sh / .ps1       # GCS bucket-opsætning med CORS & caching
│   ├── cors.json                 # CORS konfiguration for Google Cloud Storage
│   └── GCS_EGRESS_QUOTA.md       # Dokumentation for Always Free egress-loft
│
└── web/                          # Selvstændig React + TypeScript + Vite Frontend
    ├── public/data/              # bridge_olap.parquet, sample_deals.parquet & JSON summaries
    ├── src/
    │   ├── engine/
    │   │   ├── bridgeQueryEngine.ts   # Hyparquet loader + TypedArray query loop
    │   │   ├── sampleDealsEngine.ts   # Søgemotor til eksempelhænder
    │   │   └── dealGenerator.ts       # 1:1 deterministisk kort-rekonstruktion
    │   ├── components/
    │   │   ├── Navbar.tsx             # Navigation, statusindikator & latency
    │   │   ├── MadLibsFilter.tsx      # Interaktiv sætnings-filtrering
    │   │   ├── KpiCards.tsx           # 6 KPI metrikker med farvekoder & progress
    │   │   ├── TrickDistributionChart.tsx # Søjlediagram (7-13 stik) med udgangsgrænser
    │   │   ├── FourHandCardViewer.tsx # 4-hånds N/S/Ø/V kortviser med DDS-stiktabel
    │   │   └── AdvancedFilterDrawer.tsx # Sliders & finmaskede kontroller
    │   ├── pages/
    │   │   ├── HomePage.tsx           # Forside & hurtigvalg
    │   │   ├── FlanneryPage.tsx       # Flannery 2♦ (11–15 HP, 4♠-5♥)
    │   │   ├── WeakTwoPage.tsx        # Weak Two (6–10 HP, 6-farve)
    │   │   ├── PrecisionPage.tsx      # Precision 1♣ (16+ HP)
    │   │   └── ExplorerPage.tsx       # Fri ad-hoc udforskning
    │   ├── App.tsx                    # Routing, global caching & state
    │   └── main.tsx                   # React DOM render
    └── package.json
```

---

## 🚀 Hurtig Start (Lokal Udvikling)

### 1. Kør Web Applikationen
Web-appen er klar til kørsel. Produktionsdata skal indlæses fra GCS eller placeres lokalt efter en verificeret pipelinekørsel:

```bash
cd web
npm install
npm run dev
```
Åbn `http://localhost:5173` i din browser.

### 2. Kør Data-pipelinen (Valgfrit for nye simuleringer)
```bash
cd pipeline

# Opret virtuelt miljø og installer afhængigheder
python -m venv .venv
# På Windows:
.\.venv\Scripts\activate
# På Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# Generer standard 400.000-spils datasæt
python run_pipeline.py 400000
```

---

## 📊 Datamodel (Konventions Bitmask)

I `bridge_olap.parquet` gemmes konventioner som en 1-byte heltal bitmask (`conv_flags`), som gør filtrering lynhurtig med bitwise AND `(conv_flags[i] & mask) !== 0`:

| Bit | Værdi | Konvention | Regelsæt |
| :--- | :--- | :--- | :--- |
| **Bit 0** | `1` | **Flannery 2♦** | Åbner: 11–15 HP, 4♠, 5♥, ikke 5-5 |
| **Bit 1** | `2` | **Weak Two** | Åbner: 6–10 HP, 6-farve i ♥, ♠ eller ♦ (ingen 4+ sidefarve) |
| **Bit 2** | `4` | **Precision 1♣** | Åbner: 16+ HP (enhver fordeling) |
| **Bit 3** | `8` | **Multi 2♦** | Åbner: 6–10 HP, 6-farve i major (♥ eller ♠) |

---

## ☁️ Google Cloud Storage Deployment

For at uploade Parquet-filerne til Google Cloud Storage Always Free tier i `us-central1`:

```bash
cd pipeline
chmod +x setup_gcs.sh
./setup_gcs.sh bridge-dds-explorer-data
```
Se [GCS_EGRESS_QUOTA.md](file:///c:/Users/frank/BridgeLab/pipeline/GCS_EGRESS_QUOTA.md) for opsætning af det anbefalede 95 GB/md. netværksloft i Google Cloud Console.

---

## 🛠️ Byg til Produktion & GitHub Pages

For at bygge web-applikationen til statisk produktion:

```bash
cd web
npm run build
```
De genererede filer placeres i `web/dist` og deployes automatisk af GitHub Actions via workflowet i `.github/workflows/deploy.yml`.
