# ARCHITECTURE.md - BridgeLab

## 1. Projektoversigt

BridgeLab er en serverless, klientbaseret analyseportal for kontraktbridge.
En offline pipeline genererer hænder deterministisk, beregner Double Dummy-resultater med `endplay`, bygger en kompakt OLAP-database og udleverer eksempelhænder.

Frontend-koden bruger React, TypeScript, Vite, `hyparquet` og TypedArrays.
OLAP-forespørgsler køres i browseren uden backend eller serverudregning.

- Live URL: `https://frankpedersen.github.io/BridgeLab/`
- GCS-bucket: `gs://bridge-dds-explorer-data/v1/`
- Officiel DDS-kilde: `endplay_dds`

Standard batchstørrelse er 400.000 spil.
Yderligere skalering kræver måling af generatorhastighed, OLAP-rækker og browserlatens.

---

## 2. Arkitektur og dataflow

```text
Deterministisk RNG
        |
        v
52-korts stok -> fire hænder
        |
        v
endplay calc_all_tables
        |
        v
Rå Parquet-chunks
        |
        v
DuckDB-aggregation
        |
        +----------------------+
        v                      v
bridge_olap.parquet     sample_deals.parquet
        |                      |
        v                      v
GCS v1 / lokal fallback
        |
        v
Hyparquet -> TypedArrays -> React UI
```

---

## 3. Repositorystruktur

```text
BridgeLab/
├── ARCHITECTURE.md
├── pipeline/
│   ├── 1_generate_dds.py
│   ├── 2_build_olap.py
│   ├── 3_build_samples.py
│   ├── deal_prng.py
│   ├── dds_engine.py
│   ├── rng.py
│   ├── run_pipeline.py
│   ├── requirements.txt
│   ├── config.yaml
│   └── tests/
└── web/
    ├── public/data/
    └── src/
        ├── components/
        ├── engine/
        ├── pages/
        └── types/
```

---

## 4. Tilfældighed og 1:1-rekonstruktion

Python og TypeScript skal bruge samme Mulberry32-implementering.
Begge implementeringer skal bruge modulo-afvisning for at undgå skævhed.

Python-filen er `pipeline/rng.py`.
TypeScript-filen er `web/src/engine/rng.ts`.
Kortgeneratoren skal bruge Fisher-Yates over kort 0-51.
Et givet seed skal producere identiske PBN-hænder i Python og TypeScript.

Kortfordelingen er i dag:

- Nord: kort 0-12
- Øst: kort 13-25
- Syd: kort 26-38
- Vest: kort 39-51

Denne fordeling er en del af den deterministiske deal-kontrakt og må ikke ændres uden opdatering af tests og UI.

---

## 5. Ægte DDS

`pipeline/dds_engine.py` må ikke indeholde lineære eller heuristiske stikestimater.
Alle Resultater skal komme fra `endplay.dds.calc_all_tables`.

Hvis `endplay` ikke kan importeres eller beregningen fejler, skal pipelinen stoppe med `ImportError` eller `RuntimeError`.
Der må ikke bruges silent fallback til analytiske formler.

Hver genereret række skal angive metadata:

- `dds_source = "endplay_dds"`

Hvert rå spil indeholder double dummy-resultater for alle fem kontraktformer og fire spillere.

---

## 6. OLAP-skema

Følgende 14 kolonner udgør det nuværende `bridge_olap.parquet`-skema:

| Index | Kolonne | Type | Beskrivelse |
|---:|---|---|---|
| 0 | `opener_hcp` | uint8 | Åbners honnørpoint |
| 1 | `spades` | uint8 | Åbners sparlængde |
| 2 | `hearts` | uint8 | Åbners hjerterlængde |
| 3 | `diamonds` | uint8 | Åbners ruderlængde |
| 4 | `clubs` | uint8 | Åbners klørlængde |
| 5 | `conv_flags` | uint8 | Konventionsbitmask |
| 6 | `responder_hcp` | uint8 | Svarerens honnørpoint |
| 7 | `spade_fit` | uint8 | Samlet N/S-spar |
| 8 | `heart_fit` | uint8 | Samlet N/S-hjerter |
| 9 | `dds_s` | uint8 | Max double dummy-stik i spar for N/S |
| 10 | `dds_h` | uint8 | Max double dummy-stik i hjerter for N/S |
| 11 | `dds_nt` | uint8 | Max double dummy-stik NT for N/S |
| 12 | `opp_game` | uint8 | Om Ø/V kan gøre udgang |
| 13 | `deal_count` | uint32 | Antal rå spil i aggregationsgruppen |

Kolonnen `diamonds` og `clubs` samt spar/hjerter-DDS udledes ikke som samlede 20-stikskolonner i OLAP-databasen.
Rå chunkdata kan indeholde alle 20 resultatværdier for hver 4-spiller/farve-kombination.

Skemaændringer skal være versionsføjede.
Eksisterende kolonneindekser må ikke flyttes eller omdøbes uden samtidig opdatering af pipeline, frontend og datamanifest.

---

## 7. Konventioner

Konventionsgrænser skal være synkroniseret mellem:

- `pipeline/config.yaml`
- `pipeline/deal_prng.py`
- frontendfiltre i `web/src/types/bridge.ts`
- Mad Libs og konventionssider

Nuværende bitmask-kontrakt:

| Bit | Mask | Konvention |
|---:|---:|---|
| 0 | 1 | Flannery 2♦ |
| 1 | 2 | Weak Two |
| 2 | 4 | Precision 1♣ |
| 3 | 8 | Multi 2♦ |

Disse grænser må ikke ændres ad hoc.
Autentiske definitioner skal komme fra Konventionstrænerens konventionskort.
Indtil dette er synkroniseret, skal ingen nye konventioner markeres som dækkede.

---

## 8. Frontend

`bridgeQueryEngine.ts` læser en Parquet-database ind i kontinuerte TypedArrays.
Forespørgslerne skal være allokeringsfattige og undgå objekter i den centrale række-loop.

`sampleDealsEngine.ts` udvælger eksempelhænder uden heuristiske teknikbitmasker eller taktiske mønsterfortolkninger.
`FourHandCardViewer.tsx` rekonstruerer hænder deterministisk fra `deal_id`.
Tekniske labels og spilspecifikke noter må ikke vises uden verificerbar slagspilsanalyse.

GCS er hovedkilde.
Lokale Parquet- og JSON-filer må kun bruges som udviklings- eller fallbackdata.
Datakilden skal altid vises i UI/footer/status så brugeren kan skelne GCS fra lokal data.

---

## 9. GCS og versionering

Produktiondata ligger i:

- `gs://bridge-dds-explorer-data/v1/`

Følgende filer må ikke trækkes ind i Git:

- `*.parquet`
- `web/dist/`
- rå chunks
- genererede lokale databaser

Fremtidig GCS-data skal ledsages af manifestoplysninger:

- datasætversion
- antal genererede spil
- `dds_source`
- filstørrelse
- SHA-256 kontrolsum
- dato og pipeline-version

Frontendens GCS-version skal kunne verificeres mod manifestet før data indlæses.

---

## 10. Pipelinetests

Python 3.12 eller 3.13 anbefales.
Afhængigheder installeres i `pipeline/.venv`.

Obligatoriske tests:

1. RNG-vektortest for faste seeds.
2. Ægte DDS-facit for kendte testhænder, herunder renoncer og slem.
3. OLAP-integritet, så `SUM(deal_count)` er lig antal genererede spil.

Standardkommando:

```bash
python pipeline/run_pipeline.py 400000
```

Herafter skal:

- alle 400.000 spil have en DDS-beregning
- OLAP-summen være præcis 400.000
- output indeholde `dds_source = "endplay_dds"`
- ingen `.parquet`- eller `dist`-data være tracked

---

## 11. Frontendverifikation

Før commit skal følgende gennemføres:

```bash
npm run build
```

Derudover skal:

- `/multi` fungere med `convMask=8`
- GCS/datafallback fungere kontrolleret
- alle konventionssider passere den samme filterimplementering
- husets terminologi bruges ensartet
- `ARCHITECTURE.md` opdateres ved ændringer i skema, RNG eller DDS-kilde

---

## 12. Git-hygiejne

- Commit ikke `web/dist/`
- Commit ikke `.parquet`
- Commit ikke rå pipeline-chunks
- Commit ikke genererede lokale JSON-datasæt
- Commit ikke virtuelle miljøer eller cachefiler
- Gå ikke tilbage til heuristisk eller lineær DDS-estimation

---

## 13. Obligatoriske produktprincipper

Denne arkitektur gælder for produkten på KontraktBridge.dk.

1. **Ingen opfundne domæneregler eller resultater:** Bryd ikke ukendte bridge-regler eller statistikker til. Analytiske output skal kun stamme fra reproducerbar kode og kendte datakilder.
2. **Adskilte komponenter:** Deal-generering, budlogik, DDS-evaluering, statistik og præsentation skal implementeres som separate komponenter.
3. **Reproducerbarhed:** Samme seed, konfiguration og pipeline-version skal give identiske deals og resultater.
4. **Domænelogik frem for AI:** Bud, scoring, kontraktmuligheder og dataaggregater skal implementeres deterministisk og testbart. AI må forklare eller fortolke beregnede resultater, men må ikke generere resultater.
5. **Samme deals ved sammenligning:** Budsystemer skal sammenlignes på samme seed/deal-sæt, når det er muligt.
6. **DDS-potentiale versus nået kontrakt:** UI skal tydeligt skelne double dummy-kontraktpotentiale fra kontrakter, der faktisk nås af en budmodel.
7. **Versionering:** Budsystemer, simuleringskonfigurationer, RNG, pipeline og analytiske datasæt skal alle have versionsidentitet.
8. **Asynkron batchprocessing:** Store simuleringer skal køre som batcharbejde udenfor browseren. Synchronous webrequests må ikke bruges som generelt simulerings-/beregningslag.
9. **Vertikal progressionsmodel:** Implementér og test den mindste komplette lodrette snit før flere konventioner tilføjes.
10. **Ingen mock-produktionsdata:** Illustrative eller synlige eksempelværdier må ikke mærkes eller præsenteres som produktionsstatistik.
11. **Tests før brugerfladen:** Automatiske tests skal bestå for bridge-domænelogik, før resultaterne bruges i brugerfladen.

Ved tvivl skal disse principper følge af ukendte domænevalg frem for at gætte eller fylde tomme regler ind.

---

## 14. Fremtidig budmodel

Budlogik er endnu ikke en del af den nuværende OLAP-portal.
Når en budmodel tilføjes, skal den levere mindst:

- versioneret budmodel-ID
- versionsført konventionskort
- reference til samme deal-ID og seed
- nåede kontrakter separat fra DDS-potentiale
- reproducerbare agentbeslutninger
- tests for åbning, svar, kontroføringer og kontraktslutning

Budmodellen må ikke ændre eller regenerere hænder.
Budmodellen må ikke sammenblandes med DDS-resultater i samme semantiske måling.
