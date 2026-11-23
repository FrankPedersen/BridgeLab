"""
3_build_samples.py - Sample Deals Extraction, Technique Enrichment & Static Summaries
Extracts sample_deals.parquet (~20,000 deals) and generates sample_deals.json enriched
with Tier 2 deep technique analysis ("Gemini Notes" with Danish tactical descriptions).
Pre-computes static *_summary.json files for instant (0 ms) initial frontend render.
"""

import sys
import json
import shutil
from pathlib import Path
import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
import pyarrow.compute as pc

pipeline_dir = Path(__file__).parent.resolve()
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

from deal_prng import generate_deal, evaluate_hand
from dds_engine import solve_deal
from technique_detector import FastTechniqueEvaluator


def build_gemini_note(deal_id: int) -> dict:
    """
    Tier 2 Deep 16-Technique Analysis on a sample deal.
    Computes exact critical trick and concise Danish tactical explanation.
    """
    n, e, s, w = generate_deal(deal_id)
    n_ev = evaluate_hand(n)
    s_ev = evaluate_hand(s)
    e_ev = evaluate_hand(e)
    w_ev = evaluate_hand(w)
    dds = solve_deal((n, e, s, w), n_ev, s_ev, e_ev, w_ev)
    flags, notes = FastTechniqueEvaluator.evaluate_deal((n, e, s, w), n_ev, s_ev, e_ev, w_ev, dds, detailed=True)

    if not notes:
        return {
            "techniques": [],
            "critical_trick": 0,
            "summary_da": "Standard double-dummy modspil og spilføring uden særlige kup."
        }

    tech_names = [n["type"] for n in notes]
    crit_trick = min((n["critical_trick"] for n in notes), default=11)
    summary_da = " ".join([n["summary_da"] for n in notes[:2]])

    return {
        "techniques": tech_names,
        "critical_trick": crit_trick,
        "summary_da": summary_da
    }


def calculate_summary(table: pa.Table, sample_deals: list) -> dict:
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
        "sample_deals": sample_deals[:10]  # First 10 with gemini notes
    }


def safe_copy(src: Path, dst: Path):
    try:
        shutil.copy2(src, dst)
    except OSError:
        with open(src, "rb") as f_in, open(dst, "wb") as f_out:
            f_out.write(f_in.read())


def main():
    chunks_dir = pipeline_dir / "output" / "raw_chunks"
    output_samples_file = pipeline_dir / "output" / "sample_deals.parquet"
    output_samples_json = pipeline_dir / "output" / "sample_deals.json"

    web_data_dir = pipeline_dir.parent / "web" / "public" / "data"
    web_data_dir.mkdir(parents=True, exist_ok=True)

    chunk_files = list(chunks_dir.glob("*.parquet"))
    if not chunk_files:
        print(f"Error: No raw chunk files found in {chunks_dir}. Run 1_generate_dds.py first.")
        return

    print("=== Extracting Sample Deals & Building Summaries with Gemini Notes ===")
    chunks_pattern = str(chunks_dir / "*.parquet").replace("\\", "/")

    # Use DuckDB to efficiently query stratified sample deals:
    # Ensure representative coverage of conventions + techniques
    sample_query = f"""
    SELECT
        deal_id, opener_hcp, spades, hearts, diamonds, clubs,
        conv_flags, dds_s, dds_h, dds_d, dds_c, dds_nt,
        opp_game, technique_flags
    FROM (
        SELECT *,
            ROW_NUMBER() OVER(PARTITION BY conv_flags, (technique_flags > 0) ORDER BY deal_id) as rn
        FROM '{chunks_pattern}'
    )
    WHERE rn <= 2500
    ORDER BY deal_id ASC
    LIMIT 20000
    """

    con = duckdb.connect()
    sample_arrow = con.sql(sample_query).to_arrow_table()
    total_samples = sample_arrow.num_rows
    print(f"Sample deals extracted: {total_samples:,} rows")

    # Write sample_deals.parquet
    pq.write_table(sample_arrow, output_samples_file, compression='snappy')
    safe_copy(output_samples_file, web_data_dir / "sample_deals.parquet")
    print(f"[OK] Exported {output_samples_file.name} to output/ and web/public/data/")

    # Build enriched JSON sample deals with Tier 2 Gemini Notes
    print("Enriching sample deals with Tier 2 deep technique analysis (Gemini Notes)...")
    sample_deals_list = []
    deals_with_notes = 0

    # Ensure at least 20 sample deals per convention with techniques
    conv_technique_counts = {0: 0, 1: 0, 2: 0, 4: 0, 8: 0}

    for i in range(min(500, total_samples)):
        d_id = int(sample_arrow.column('deal_id')[i].as_py())
        c_flags = int(sample_arrow.column('conv_flags')[i].as_py())
        t_flags = int(sample_arrow.column('technique_flags')[i].as_py())

        deal_record = {
            "deal_id": d_id,
            "opener_hcp": int(sample_arrow.column('opener_hcp')[i].as_py()),
            "spades": int(sample_arrow.column('spades')[i].as_py()),
            "hearts": int(sample_arrow.column('hearts')[i].as_py()),
            "diamonds": int(sample_arrow.column('diamonds')[i].as_py()),
            "clubs": int(sample_arrow.column('clubs')[i].as_py()),
            "conv_flags": c_flags,
            "dds_s": int(sample_arrow.column('dds_s')[i].as_py()),
            "dds_h": int(sample_arrow.column('dds_h')[i].as_py()),
            "dds_d": int(sample_arrow.column('dds_d')[i].as_py()),
            "dds_c": int(sample_arrow.column('dds_c')[i].as_py()),
            "dds_nt": int(sample_arrow.column('dds_nt')[i].as_py()),
            "technique_flags": t_flags,
        }

        if t_flags > 0:
            note = build_gemini_note(d_id)
            deal_record["gemini_note"] = note
            deals_with_notes += 1
            for mask in [1, 2, 4, 8]:
                if c_flags & mask:
                    conv_technique_counts[mask] = conv_technique_counts.get(mask, 0) + 1
            if c_flags == 0:
                conv_technique_counts[0] = conv_technique_counts.get(0, 0) + 1

        sample_deals_list.append(deal_record)

    # Export sample_deals.json
    with open(output_samples_json, "w", encoding="utf-8") as f:
        json.dump(sample_deals_list, f, indent=2, ensure_ascii=False)
    with open(web_data_dir / "sample_deals.json", "w", encoding="utf-8") as f:
        json.dump(sample_deals_list, f, indent=2, ensure_ascii=False)

    print(f"[OK] sample_deals.json exported ({len(sample_deals_list)} deals, {deals_with_notes} with Gemini Notes)")
    print(f"Technique sample deals per convention: {conv_technique_counts}")

    # Build static summaries for instant initial render
    print("Generating static JSON summaries for instant 0 ms page render...")

    def get_convention_samples(mask: int):
        matched = [d for d in sample_deals_list if (d['conv_flags'] & mask) != 0]
        # Sort so deals with gemini notes appear first
        matched.sort(key=lambda x: (x.get('gemini_note') is not None, x['technique_flags']), reverse=True)
        return matched[:10]

    # Global summary
    global_samples = sorted(sample_deals_list, key=lambda x: (x.get('gemini_note') is not None), reverse=True)[:10]
    global_sum = calculate_summary(sample_arrow, global_samples)
    with open(web_data_dir / "global_summary.json", "w", encoding="utf-8") as f:
        json.dump(global_sum, f, indent=2, ensure_ascii=False)

    # Flannery summary (conv_flags & 1 != 0)
    flannery_samples = get_convention_samples(1)
    flannery_sum = calculate_summary(
        sample_arrow.filter(pc.not_equal(pc.bit_wise_and(sample_arrow.column('conv_flags'), pa.scalar(1, pa.uint8())), 0)),
        flannery_samples
    )
    with open(web_data_dir / "flannery_summary.json", "w", encoding="utf-8") as f:
        json.dump(flannery_sum, f, indent=2, ensure_ascii=False)

    # Weak Two summary (conv_flags & 2 != 0)
    weak_two_samples = get_convention_samples(2)
    weak_two_sum = calculate_summary(
        sample_arrow.filter(pc.not_equal(pc.bit_wise_and(sample_arrow.column('conv_flags'), pa.scalar(2, pa.uint8())), 0)),
        weak_two_samples
    )
    with open(web_data_dir / "weak_two_summary.json", "w", encoding="utf-8") as f:
        json.dump(weak_two_sum, f, indent=2, ensure_ascii=False)

    # Precision 1C summary (conv_flags & 4 != 0)
    precision_samples = get_convention_samples(4)
    precision_sum = calculate_summary(
        sample_arrow.filter(pc.not_equal(pc.bit_wise_and(sample_arrow.column('conv_flags'), pa.scalar(4, pa.uint8())), 0)),
        precision_samples
    )
    with open(web_data_dir / "precision_summary.json", "w", encoding="utf-8") as f:
        json.dump(precision_sum, f, indent=2, ensure_ascii=False)

    # Multi 2D summary (conv_flags & 8 != 0)
    multi_samples = get_convention_samples(8)
    multi_sum = calculate_summary(
        sample_arrow.filter(pc.not_equal(pc.bit_wise_and(sample_arrow.column('conv_flags'), pa.scalar(8, pa.uint8())), 0)),
        multi_samples
    )
    with open(web_data_dir / "multi_summary.json", "w", encoding="utf-8") as f:
        json.dump(multi_sum, f, indent=2, ensure_ascii=False)

    print(f"[OK] Static summaries generated in {web_data_dir} successfully!")


if __name__ == "__main__":
    main()
