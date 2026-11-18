# Google Cloud Storage (GCS) Always Free & Egress Quota Guide

Denne guide beskriver, hvordan du opsætter og sikrer, at din Google Cloud Storage bucket for **Bridge DDS Explorer** forbliver **100% gratis (0 kr. i omkostninger)** for evigt inden for Google Clouds **Always Free** grænser.

---

## 1. Google Cloud Always Free Betingelser (Cloud Storage)

Google Cloud tilbyder en permanent gratis kvote (Always Free) for Cloud Storage under følgende betingelser:
- **Lokation:** Kun buckets oprettet i `us-central1`, `us-east1` eller `us-west1` (vi bruger `us-central1`).
- **Lagring:** Op til **5 GB-måneder** standard lagring (vores aggregerede filer fylder under 10 MB i alt).
- **Klasse A operationer (skriv/list):** 5.000 operationer/md.
- **Klasse B operationer (læs):** 50.000 operationer/md.
- **Netværks-egress (Data ud til internettet):** Første **100 GB/måned** til alle destinationer (ekskl. Kina og Australien) er 100% gratis.

Vores Parquet-filer er pre-aggregeret til under 2,5 MB og har browser caching aktiveret i 7 dage (`max-age=604800`). Det betyder, at 100 GB/md. dækker over **40.000 fulde førstegangs-besøg** hver eneste måned uden omkostninger.

---

## 2. Automatisk Opsætning med Script

Kør opsætningsscriptet i `pipeline/`:

### På Linux/macOS:
```bash
cd pipeline
chmod +x setup_gcs.sh
./setup_gcs.sh bridge-dds-explorer-data
```

### På Windows (PowerShell):
```powershell
cd pipeline
.\setup_gcs.ps1 -BucketName "bridge-dds-explorer-data"
```

Scriptet udfører automatisk:
1. Opretter bucket med `STANDARD` storage class og `--uniform-bucket-level-access` i `us-central1`.
2. Giver `allUsers` rollen `roles/storage.objectViewer` for offentlig adgang.
3. Påfører CORS-regler fra `cors.json` (`https://*.github.io`, `http://localhost:5173`, `http://localhost:3000`).
4. Uploader Parquet-filer med 7 dages HTTP cache-kontrol.

---

## 3. Opsætning af Network Egress Quota-loft (Garanti for 0 kr.)

For at beskytte mod uforudset trafik og garantere, at du aldrig opkræves penge, anbefales det at sætte et hårdt kvoteloft på **95 GB/måned**:

### Trin-for-trin i Google Cloud Console:
1. Log ind på [Google Cloud Console](https://console.cloud.google.com/).
2. Vælg dit projekt i toppen.
3. Gå til **IAM & Administration** ➔ **Quotas & System Limits** (eller søg på "Quotas" i søgefeltet).
4. I filterfeltet filtreres efter:
   - **Service:** `Compute Engine API` eller `Cloud Storage`
   - **Metric:** `Network egress bandwidth` eller `Internet egress traffic`
5. Vælg kvoten for standard internetudgående trafik.
6. Klik på **Edit Quotas** og sæt loftet til en sikker værdi (f.eks. **95 GB / måned** eller tilsvarende GB/dag rate).
7. Bekræft og gem.

### Opsætning af Budget- og Forbrugsalarm (Budgets & Alerts):
1. Gå til **Billing** ➔ **Budgets & alerts**.
2. Klik på **Create Budget**.
3. Navngiv budgettet `Bridge-Portal-FreeTier`.
4. Vælg **Specified amount** og indtast f.eks. `10 DKK` (eller `1 USD`).
5. Sæt tærskler ved:
   - 50% (5 kr.)
   - 90% (9 kr.)
   - 100% (10 kr.)
6. Slå e-mail-notifikationer til.
7. Valgfrit: Knyt en Cloud Function eller Pub/Sub topic til, der automatisk midlertidigt fjerner `allUsers` tilladelsen fra bucketen, hvis budgettet overskrides.
