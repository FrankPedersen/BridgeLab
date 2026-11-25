"""Extract sample deals and static summaries without heuristic technique labels."""

import json
import shutil
import sys
from pathlib import Path

import duckdb
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.parquet as pq

pipeline_dir = Path(__file__).parent.resolve()


def safe_copy(src: Path, dst: Path):
    try:
        shutil.copy2(src, dst)
    except OSError:
        with open(src, "rb") as f_in, open(dst, "wb") as f_out:
            f_out.write(f_in.read())


def calculate_summary(table: pa.Table, sample_deals: list) -> dict:
    dds_h = table.column("dds_h").to_pylist()
    dds_s = table.column("dds_s").to_pylist()
    dds_nt = table.column("dds_nt").to_pylist()
    opp_game = table.column("opp_game").to_pylist()
    total = len(dds_h)

    if total == 0:
        return {
            "totalDeals": 0, "pct4H": 0, "pct4S": 0, "pct3NT": 0,
            "pctSlam": 0, "pctOppGame": 0,
            "distH": [0] * 14, "distS": [0] * 14, "distNT": [0] * 14,
            "sample_deals": [], "dds_source": "endplay_dds",
        }

    def distribution(values):
        result = [0] * 14
        for value in values:
            if 0 <= value <= 13:
                result[value] += 1
        return [round(value * 100.0 / total, 2) for value in result]

    return {
        "totalDeals": total,
        "pct4H": round(sum(h >= 10 for h in dds_h) * 100.0 / total, 2),
        "pct4S": round(sum(s >= 10 for s in dds_s) * 100.0 / total, 2),
        "pct3NT": round(sum(nt >= 9 for nt in dds_nt) * 100.0 / total, 2),
        "pctSlam": round(sum(h >= 12 or s >= 12 or nt >= 12 for h, s, nt in zip(dds_h, dds_s, dds_nt)) * 100.0 / total, 2),
        "pctOppGame": round(sum(bool(og) for og in opp_game) * 100.0 / total, 2),
        "distH": distribution(dds_h),
        "distS": distribution(dds_s),
        "distNT": distribution(dds_nt),
        "sample_deals": sample_deals[:10],
        "dds_source": "endplay_dds",
    }


def main():
    chunks_dir = pipeline_dir / "output" / "raw_chunks"
    output_samples_file = pipeline_dir / "output" / "sample_deals.parquet"
    output_samples_json = pipeline_dir / "output" / "sample_deals.json"
    web_data_dir = pipeline_dir.parent / "web" / "public" / "data"
    web_data_dir.mkdir(parents=True, exist_ok=True)

    chunk_files = list(chunks_dir.glob("*.parquet"))
    if not chunk_files:
        print(f"Error: No raw chunk files found in {chunks_dir}.")
        sys.exit(1)

    chunks_pattern = str(chunks_dir / "*.parquet").replace("\\", "/")
    sample_query = f"""
    SELECT deal_id, opener_hcp, spades, hearts, diamonds, clubs,
           conv_flags, dds_s, dds_h, dds_d, dds_c, dds_nt, opp_game,
           dds_s_n, dds_s_e, dds_s_s, dds_s_w,
           dds_h_n, dds_h_e, dds_h_s, dds_h_w,
           dds_d_n, dds_d_e, dds_d_s, dds_d_w,
           dds_c_n, dds_c_e, dds_c_s, dds_c_w,
           dds_nt_n, dds_nt_e, dds_nt_s, dds_nt_w,
           dds_source
    FROM (
        SELECT *, ROW_NUMBER() OVER(PARTITION BY conv_flags ORDER BY deal_id) AS rn
        FROM '{chunks_pattern}'
    )
    WHERE rn <= 2500
    ORDER BY deal_id
    LIMIT 20000
    """
    con = duckdb.connect()
    sample_arrow = con.sql(sample_query).to_arrow_table()
    pq.write_table(sample_arrow, output_samples_file, compression="snappy")
    safe_copy(output_samples_file, web_data_dir / "sample_deals.parquet")

    names = sample_arrow.column_names
    sample_deals = []
    for i in range(min(500, sample_arrow.num_rows)):
        record = {}
        for name in names:
            value = sample_arrow.column(name)[i].as_py()
            if name == "dds_source":
                record[name] = "endplay_dds"
            elif name.startswith("dds_") or name in ("deal_id", "opener_hcp", "spades", "hearts", "diamonds", "clubs", "conv_flags", "opp_game"):
                record[name] = int(value)
            else:
                record[name] = value
        sample_deals.append(record)

    with open(output_samples_json, "w", encoding="utf-8") as f:
        json.dump(sample_deals, f, indent=2, ensure_ascii=False)
    with open(web_data_dir / "sample_deals.json", "w", encoding="utf-8") as f:
        json.dump(sample_deals, f, indent=2, ensure_ascii=False)

    for name, mask in (("global", 0), ("flannery", 1), ("weak_two", 2), ("precision", 4), ("multi", 8)):
        if mask == 0:
            subset = sample_arrow
            subset_samples = sample_deals[:10]
        else:
            subset = sample_arrow.filter(pc.not_equal(pc.bit_wise_and(sample_arrow.column("conv_flags"), pa.scalar(mask, pa.uint8())), 0))
            subset_samples = [d for d in sample_deals if d["conv_flags"] & mask][:10]
        summary = calculate_summary(subset, subset_samples)
        with open(web_data_dir / f"{name}_summary.json", "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"[OK] Exported {sample_arrow.num_rows:,} sample deals without heuristic technique or Gemini data")


if __name__ == "__main__":
    main()
