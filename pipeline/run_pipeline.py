"""
run_pipeline.py - Orchestrates full data generation:
1. 1_generate_dds.py
2. 2_build_olap.py
3. 3_build_samples.py
Copies generated files to web/public/data/ for direct local development.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

def run_cmd(cmd, desc):
    print(f"\n==========================================")
    print(f">> Running: {desc}")
    print(f"==========================================")
    res = subprocess.run([sys.executable] + cmd, check=True)
    return res.returncode

def main():
    pipeline_dir = Path(__file__).parent
    deals = sys.argv[1] if len(sys.argv) > 1 else "50000"

    print(f"Starting Offline Pipeline with {deals} deals...")

    # Step 1
    run_cmd([str(pipeline_dir / "1_generate_dds.py"), "--deals", deals], "Step 1: Generate Master DDS")

    # Step 2
    run_cmd([str(pipeline_dir / "2_build_olap.py")], "Step 2: Build Pre-aggregated OLAP")

    # Step 3
    run_cmd([str(pipeline_dir / "3_build_samples.py")], "Step 3: Build Samples & Static JSONs")

    # Copy bridge_olap.parquet to web/public/data/
    src_olap = pipeline_dir / "output" / "bridge_olap.parquet"
    dst_dir = pipeline_dir.parent / "web" / "public" / "data"
    dst_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src_olap, dst_dir / "bridge_olap.parquet")
    print(f"\n[OK] Copied {src_olap.name} to {dst_dir}/ for local web development.")
    print("Pipeline completed successfully!")

if __name__ == "__main__":
    main()
