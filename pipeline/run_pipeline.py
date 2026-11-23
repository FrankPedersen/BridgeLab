"""
run_pipeline.py - Orchestrates the Full BridgeLab 5M Data Pipeline
Executes:
1. 1_generate_dds.py (multiprocessed deal generation + DDS + FastTechniqueEvaluator)
2. 2_build_olap.py (DuckDB OLAP pre-aggregation with technique_flags)
3. 3_build_samples.py (Sample deals extraction, Tier 2 Gemini Notes & 0 ms JSONs)
Validates that SUM(deal_count) in bridge_olap.parquet strictly equals the requested deal count.
"""

import sys
import time
import shutil
import subprocess
from pathlib import Path
import pyarrow.parquet as pq

pipeline_dir = Path(__file__).parent.resolve()


def run_step(cmd_args: list, desc: str):
    print(f"\n=======================================================")
    print(f">> {desc}")
    print(f"=======================================================")
    t0 = time.time()
    res = subprocess.run([sys.executable] + cmd_args, check=True)
    elapsed = time.time() - t0
    print(f">> Completed in {elapsed:.2f}s")
    return res.returncode


def main():
    deals = sys.argv[1] if len(sys.argv) > 1 else "50000"
    total_requested = int(deals)

    t_start = time.time()
    print(f"=======================================================")
    print(f" BridgeLab Data Pipeline: {total_requested:,} Deals Simulation")
    print(f" Target: 5M Deals + Advanced Technique Bitmask Engine")
    print(f"=======================================================")

    # Step 1: Multiprocess Deal Generation & DDS Solving
    step1_args = [str(pipeline_dir / "1_generate_dds.py"), "--deals", str(total_requested)]
    if total_requested <= 100000:
        step1_args += ["--chunk-size", "25000"]
    else:
        step1_args += ["--chunk-size", "100000"]
    run_step(step1_args, f"Step 1/3: Multiprocessed 5M DDS Simulation ({total_requested:,} deals)")

    # Step 2: Build Pre-aggregated OLAP Cube
    run_step([str(pipeline_dir / "2_build_olap.py")], "Step 2/3: Pre-aggregated OLAP Cube Generation")

    # Step 3: Extract Samples & Build Gemini Notes
    run_step([str(pipeline_dir / "3_build_samples.py")], "Step 3/3: Sample Extraction & Tier 2 Gemini Notes")

    # Validation: Verify bridge_olap.parquet
    olap_file = pipeline_dir / "output" / "bridge_olap.parquet"
    if not olap_file.exists():
        print(f"\n[ERROR] Output file {olap_file} does not exist!")
        sys.exit(1)

    olap_table = pq.read_table(olap_file)
    total_deals_actual = sum(olap_table.column('deal_count').to_pylist())
    file_size_mb = olap_file.stat().st_size / (1024 * 1024)

    print("\n=======================================================")
    print(" Pipeline Validation & Integrity Verification")
    print("=======================================================")
    print(f"Requested deals:     {total_requested:,}")
    print(f"Aggregated deals:    {total_deals_actual:,}")
    print(f"OLAP cube rows:      {olap_table.num_rows:,}")
    print(f"OLAP file size:      {file_size_mb:.2f} MB")
    print(f"Schema columns:      {olap_table.num_columns} (15 columns: 0-12 dimensions, 13 deal_count, 14 technique_flags)")

    if total_deals_actual != total_requested:
        print(f"\n[FAIL] Validation mismatch! Expected {total_requested:,} but got {total_deals_actual:,}")
        sys.exit(1)
    else:
        print(f"\n[PASS] 100% Data Integrity Verified! SUM(deal_count) == {total_requested:,}")

    total_time = time.time() - t_start
    overall_rate = total_requested / total_time if total_time > 0 else 0
    print(f"Total Pipeline Runtime: {total_time:.2f}s ({overall_rate:,.0f} deals/sec overall)")
    print("=======================================================\n")


if __name__ == "__main__":
    main()
