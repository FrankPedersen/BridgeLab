"""
3_build_samples.py - Sample Deals Extraction & Static JSON Summaries
Extracts sample_deals.parquet (~20,000 deals) and pre-computes static
*_summary.json files for instant (0 ms) initial frontend render.
"""

import json
from pathlib import Path
import pyarrow as pa
import pyarrow.parquet as pq
import pyarrow.compute as pc


def calculate_summary(table: pa.Table) -> dict:
    total = table.num_rows
    if total == 0:
        return {
            "totalDeals": 0,
            "pct4H": 0,
            "pct4S": 0,
            "pct3NT": 0,
            "pctSlam": 0,
            "pctOppGame": 0,
            "distH": [0] * 14,
            "distS": [0] * 14,
            "distNT": [0] * 14,
            "sample_deals": []
        }

    dds_h = table.column('dds_h').to_pylist()
    dds_s = table.column('dds_s').to_pylist()
    dds_nt = table.column('dds_nt').to_pylist()
    opp_game = table.column('opp_game').to_pylist()

    make_4h = sum(1 for h in dds_h if h >= 10)
    make_4s = sum(1 for s in dds_s if s >= 10)
    make_3nt = sum(1 for nt in dds_nt if nt >= 9)
    make_slam = sum(1 for h, s, nt in zip(dds_h, dds_s, dds_nt) if h >= 12 or s >= 12 or nt >= 12)
    opp_games = sum(1 for og in opp_game if og == 1)

    dist_h = [0] * 14
    dist_s = [0] * 14
    dist_nt = [0] * 14

    for h, s, nt in zip(dds_h, dds_s, dds_nt):
        if 0 <= h <= 13:
            dist_h[h] += 1
        if 0 <= s <= 13:
            dist_s[s] += 1
        if 0 <= nt <= 13:
            dist_nt[nt] += 1

    # Extract up to 5 sample deals
    samples = []
    sample_limit = min(5, total)
    for i in range(sample_limit):
        samples.append({
            "deal_id": int(table.column('deal_id')[i].as_py()),
            "opener_hcp": int(table.column('opener_hcp')[i].as_py()),
            "spades": int(table.column('spades')[i].as_py()),
            "hearts": int(table.column('hearts')[i].as_py()),
            "diamonds": int(table.column('diamonds')[i].as_py()),
            "clubs": int(table.column('clubs')[i].as_py()),
            "conv_flags": int(table.column('conv_flags')[i].as_py()),
            "dds_s": int(table.column('dds_s')[i].as_py()),
            "dds_h": int(table.column('dds_h')[i].as_py()),
            "dds_d": int(table.column('dds_d')[i].as_py()),
            "dds_c": int(table.column('dds_c')[i].as_py()),
            "dds_nt": int(table.column('dds_nt')[i].as_py()),
        })

    return {
        "totalDeals": total,
        "pct4H": round(make_4h * 100.0 / total, 2),
        "pct4S": round(make_4s * 100.0 / total, 2),
        "pct3NT": round(make_3nt * 100.0 / total, 2),
        "pctSlam": round(make_slam * 100.0 / total, 2),
        "pctOppGame": round(opp_games * 100.0 / total, 2),
        "distH": [round(c * 100.0 / total, 2) for c in dist_h],
        "distS": [round(c * 100.0 / total, 2) for c in dist_s],
        "distNT": [round(c * 100.0 / total, 2) for c in dist_nt],
        "sample_deals": samples
    }


def main():
    pipeline_dir = Path(__file__).parent
    input_file = pipeline_dir / "output" / "master_dds.parquet"
    output_samples_file = pipeline_dir / "output" / "sample_deals.parquet"

    web_data_dir = pipeline_dir.parent / "web" / "public" / "data"
    web_data_dir.mkdir(parents=True, exist_ok=True)

    if not input_file.exists():
        print(f"Error: {input_file} not found. Run 1_generate_dds.py first.")
        return

    print("=== Extracting Sample Deals and Building Summaries ===")
    master = pq.read_table(input_file)
    total_master = master.num_rows

    # Extract representative sample deals (up to 20,000)
    # Stratified: take all convention matches + random slice of rest
    conv_col = master.column('conv_flags')
    has_conv = pc.greater(conv_col, 0)
    conv_subset = master.filter(has_conv)

    sample_target = min(20000, total_master)
    if conv_subset.num_rows >= sample_target:
        sample_table = conv_subset.slice(0, sample_target)
    else:
        remaining = sample_target - conv_subset.num_rows
        no_conv = master.filter(pc.equal(conv_col, 0)).slice(0, remaining)
        sample_table = pa.concat_tables([conv_subset, no_conv])

    # Sample table columns
    sample_cols = [
        'deal_id', 'opener_hcp', 'spades', 'hearts', 'diamonds', 'clubs',
        'conv_flags', 'dds_s', 'dds_h', 'dds_d', 'dds_c', 'dds_nt'
    ]
    sample_final = sample_table.select(sample_cols)
    pq.write_table(sample_final, output_samples_file, compression='snappy')
    # Also copy to web/public/data for local development
    pq.write_table(sample_final, web_data_dir / "sample_deals.parquet", compression='snappy')
    print(f"Exported {sample_final.num_rows:,} sample deals to {output_samples_file}")

    # Build static summaries for instant initial render
    print("Generating static JSON summaries for instant 0 ms page render...")

    # 1. Global summary
    global_sum = calculate_summary(master)
    with open(web_data_dir / "global_summary.json", "w", encoding="utf-8") as f:
        json.dump(global_sum, f, indent=2)

    # 2. Flannery summary (conv_flags & 1 != 0)
    flannery_filter = pc.not_equal(pc.bit_wise_and(master.column('conv_flags'), pa.scalar(1, pa.uint8())), 0)
    flannery_table = master.filter(flannery_filter)
    flannery_sum = calculate_summary(flannery_table)
    with open(web_data_dir / "flannery_summary.json", "w", encoding="utf-8") as f:
        json.dump(flannery_sum, f, indent=2)

    # 3. Weak Two summary (conv_flags & 2 != 0)
    weak_two_filter = pc.not_equal(pc.bit_wise_and(master.column('conv_flags'), pa.scalar(2, pa.uint8())), 0)
    weak_two_table = master.filter(weak_two_filter)
    weak_two_sum = calculate_summary(weak_two_table)
    with open(web_data_dir / "weak_two_summary.json", "w", encoding="utf-8") as f:
        json.dump(weak_two_sum, f, indent=2)

    # 4. Precision 1C summary (conv_flags & 4 != 0)
    precision_filter = pc.not_equal(pc.bit_wise_and(master.column('conv_flags'), pa.scalar(4, pa.uint8())), 0)
    precision_table = master.filter(precision_filter)
    precision_sum = calculate_summary(precision_table)
    with open(web_data_dir / "precision_summary.json", "w", encoding="utf-8") as f:
        json.dump(precision_sum, f, indent=2)

    # 5. Multi 2D summary (conv_flags & 8 != 0)
    multi_filter = pc.not_equal(pc.bit_wise_and(master.column('conv_flags'), pa.scalar(8, pa.uint8())), 0)
    multi_table = master.filter(multi_filter)
    multi_sum = calculate_summary(multi_table)
    with open(web_data_dir / "multi_summary.json", "w", encoding="utf-8") as f:
        json.dump(multi_sum, f, indent=2)

    print("Static summaries generated in web/public/data/ successfully!")


if __name__ == "__main__":
    main()
