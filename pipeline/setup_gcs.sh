#!/usr/bin/env bash
set -euo pipefail

BUCKET_NAME="${1:-bridge-dds-explorer-data}"
REGION="us-central1"

echo "=== Setting up Google Cloud Storage Bucket: gs://${BUCKET_NAME} ==="

# 1. Opret bucket i Always Free region (us-central1)
echo "[1/4] Creating bucket in ${REGION} (Always Free tier)..."
gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --location="${REGION}" \
    --default-storage-class=STANDARD \
    --uniform-bucket-level-access

# 2. Gør filer offentligt læsbare
echo "[2/4] Making files publicly readable (allUsers: objectViewer)..."
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
    --member="allUsers" \
    --role="roles/storage.objectViewer"

# 3. Påfør CORS-regler
echo "[3/4] Applying CORS configuration from cors.json..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
gcloud storage buckets update "gs://${BUCKET_NAME}" --cors-file="${SCRIPT_DIR}/cors.json"

# 4. Upload Parquet-filer med 7 dages browser-caching
if [ -d "${SCRIPT_DIR}/output" ]; then
    echo "[4/4] Uploading Parquet datasets to gs://${BUCKET_NAME}/v1/ with 7 days cache-control..."
    gcloud storage cp "${SCRIPT_DIR}/output/"*.parquet "gs://${BUCKET_NAME}/v1/" \
        --cache-control="public, max-age=604800"
else
    echo "[4/4] Output directory ${SCRIPT_DIR}/output does not exist yet. Run the pipeline scripts first."
fi

echo "=== GCS Setup Complete! ==="
echo "Public URL prefix: https://storage.googleapis.com/${BUCKET_NAME}/v1/"
echo "Remember to set your Network Egress Quota to 95 GB/mo in GCP Console to ensure 100% free operation."
