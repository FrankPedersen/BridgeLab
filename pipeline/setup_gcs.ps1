param (
    [string]$BucketName = "bridge-dds-explorer-data"
)

$ErrorActionPreference = "Stop"
$Region = "us-central1"

# 0. Sørg for at gcloud er tilgængelig i PATH
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    $GcloudDefaultPath = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin"
    if (Test-Path (Join-Path $GcloudDefaultPath "gcloud.cmd")) {
        $env:PATH = "$GcloudDefaultPath;$env:PATH"
    }
}

# Attribution
$env:CLOUDSDK_METRICS_ENVIRONMENT = if ($env:CLOUDSDK_METRICS_ENVIRONMENT) { "$env:CLOUDSDK_METRICS_ENVIRONMENT datacloud.antigravity" } else { "datacloud.antigravity" }

Write-Host "=== Setting up Google Cloud Storage Bucket: gs://$BucketName ===" -ForegroundColor Cyan

# 1. Opret bucket i Always Free region (us-central1)
Write-Host "[1/4] Creating bucket in $Region (Always Free tier)..." -ForegroundColor Yellow
gcloud storage buckets create "gs://$BucketName" `
    --location="$Region" `
    --default-storage-class=STANDARD `
    --uniform-bucket-level-access

# 2. Gør filer offentligt læsbare
Write-Host "[2/4] Making files publicly readable (allUsers: objectViewer)..." -ForegroundColor Yellow
gcloud storage buckets add-iam-policy-binding "gs://$BucketName" `
    --member="allUsers" `
    --role="roles/storage.objectViewer"

# 3. Påfør CORS-regler
Write-Host "[3/4] Applying CORS configuration from cors.json..." -ForegroundColor Yellow
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
gcloud storage buckets update "gs://$BucketName" --cors-file="$ScriptDir\cors.json"

# 4. Upload Parquet-filer med 7 dages browser-caching
$OutputDir = Join-Path $ScriptDir "output"
if (Test-Path $OutputDir) {
    Write-Host "[4/4] Uploading Parquet datasets to gs://$BucketName/v1/ with 7 days cache-control..." -ForegroundColor Yellow
    gcloud storage cp "$OutputDir\*.parquet" "gs://$BucketName/v1/" `
        --cache-control="public, max-age=604800"
} else {
    Write-Host "[4/4] Output directory $OutputDir does not exist yet. Run the pipeline scripts first." -ForegroundColor Yellow
}

Write-Host "=== GCS Setup Complete! ===" -ForegroundColor Green
Write-Host "Public URL prefix: https://storage.googleapis.com/$BucketName/v1/"
Write-Host "Remember to set your Network Egress Quota to 95 GB/mo in GCP Console to ensure 100% free operation."
