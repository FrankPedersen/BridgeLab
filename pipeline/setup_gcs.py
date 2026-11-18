"""
setup_gcs.py - Python alternative for setting up GCS bucket and uploading datasets.
Can be used with Application Default Credentials (ADC) or a service account key.
"""

import sys
import json
from pathlib import Path

def main():
    bucket_name = sys.argv[1] if len(sys.argv) > 1 else "bridge-dds-explorer-data"
    region = "us-central1"

    print(f"=== Setting up Google Cloud Storage via Python: gs://{bucket_name} ===")
    try:
        from google.cloud import storage
    except ImportError:
        print("\n[!] The 'google-cloud-storage' package is not installed.")
        print("To install it in your venv, run:")
        print("  .\\pipeline\\.venv\\Scripts\\pip install google-cloud-storage")
        sys.exit(1)

    try:
        client = storage.Client()
    except Exception as e:
        print(f"\n[!] Failed to initialize Google Cloud Storage Client: {e}")
        print("Ensure you have authenticated via Application Default Credentials (ADC):")
        print("  gcloud auth application-default login")
        print("Or set GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account-key.json>")
        sys.exit(1)

    # 1. Create or get bucket
    try:
        bucket = client.get_bucket(bucket_name)
        print(f"[1/4] Bucket gs://{bucket_name} already exists.")
    except Exception:
        print(f"[1/4] Creating bucket gs://{bucket_name} in {region} (Always Free)...")
        bucket = client.create_bucket(bucket_name, location=region)
        print(f"[OK] Bucket created successfully.")

    # 2. CORS configuration
    cors_file = Path(__file__).parent / "cors.json"
    if cors_file.exists():
        print("[2/4] Applying CORS rules from cors.json...")
        with open(cors_file, "r", encoding="utf-8") as f:
            cors_rules = json.load(f)
        bucket.cors = cors_rules
        bucket.patch()
        print("[OK] CORS configuration updated.")

    # 3. Make public
    print("[3/4] Granting public read access (allUsers: objectViewer)...")
    try:
        policy = bucket.get_iam_policy(requested_policy_version=3)
        policy.bindings.append({
            "role": "roles/storage.objectViewer",
            "members": {"allUsers"}
        })
        bucket.set_iam_policy(policy)
        print("[OK] Public read access granted.")
    except Exception as e:
        print(f"[Warning] Could not set IAM policy: {e}")

    # 4. Upload parquet files
    output_dir = Path(__file__).parent / "output"
    if output_dir.exists():
        print(f"[4/4] Uploading Parquet datasets with 7 days cache-control...")
        for p in output_dir.glob("*.parquet"):
            blob = bucket.blob(f"v1/{p.name}")
            blob.cache_control = "public, max-age=604800"
            blob.upload_from_filename(str(p))
            print(f"  -> Uploaded gs://{bucket_name}/v1/{p.name}")
    else:
        print("[4/4] Output directory not found. Run pipeline first.")

    print("\n=== GCS Setup Complete! ===")
    print(f"Public URL prefix: https://storage.googleapis.com/{bucket_name}/v1/")

if __name__ == "__main__":
    main()
