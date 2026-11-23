"""
2_build_olap.py - Pre-aggregated OLAP Table Generation
Reads raw parquet chunks using DuckDB, groups by all 14 analytical dimensions
(including technique_flags), and exports compact bridge_olap.parquet with deal_count (uint32).
Appends technique_flags at index 14 for 100% backwards compatibility with column indices 0..13.
"""

import sys
import time
import shutil
from pathlib import Path
import duckdb
import pyarrow.parquet as pq


def safe_copy(src: Path, dst: Path):
    try:
        shutil.copy2(src, dst)
    except OSError:
        with open(src, "rb") as f_in, open(dst, "wb") as f_out:
            f_out.write(f_in.read())


def main():
    pipeline_dir = Path(__file__).parent.resolve()
    chunks_dir = pipeline_dir / "output" / "raw_chunks"
    output_olap_file = pipeline_dir / "output" / "bridge_olap.parquet"
    web_data_dir = pipeline_dir.parent / "web" / "public" / "data"
    web_data_dir.mkdir(parents=True, exist_ok=True)

    chunk_files = list(chunks_dir.glob("*.parquet"))
    if not chunk_files:
        print(f"Error: No raw chunk files found in {chunks_dir}. Run 1_generate_dds.py first.")
        sys.exit(1)

    print(f"=== Building Pre-Aggregated OLAP Cube: {output_olap_file.name} ===")
    print(f"Scanning {len(chunk_files)} raw chunks in {chunks_dir} ...")

    t0 = time.time()
    chunks_pattern = str(chunks_dir / "*.parquet").replace("\\", "/")
    output_path_str = str(output_olap_file).replace("\\", "/")

    # DuckDB streaming aggregation directly into ZSTD-compressed Parquet
    query = f"""
    COPY (
        SELECT
            opener_hcp::UTINYINT AS opener_hcp,
            spades::UTINYINT AS spades,
            hearts::UTINYINT AS hearts,
            diamonds::UTINYINT AS diamonds,
            clubs::UTINYINT AS clubs,
            conv_flags::UTINYINT AS conv_flags,
            responder_hcp::UTINYINT AS responder_hcp,
            spade_fit::UTINYINT AS spade_fit,
            heart_fit::UTINYINT AS heart_fit,
            dds_s::UTINYINT AS dds_s,
            dds_h::UTINYINT AS dds_h,
            dds_nt::UTINYINT AS dds_nt,
            opp_game::UTINYINT AS opp_game,
            COUNT(*)::UINTEGER AS deal_count,
            technique_flags::USMALLINT AS technique_flags
        FROM '{chunks_pattern}'
        GROUP BY
            opener_hcp, spades, hearts, diamonds, clubs,
            conv_flags, responder_hcp, spade_fit, heart_fit,
            dds_s, dds_h, dds_nt, opp_game, technique_flags
        ORDER BY opener_hcp ASC, conv_flags ASC
    ) TO '{output_path_str}' (FORMAT PARQUET, COMPRESSION SNAPPY)
    """

    duckdb.sql(query)
    elapsed = time.time() - t0

    # Also copy to web/public/data/ for direct local development and GitHub Pages build
    safe_copy(output_olap_file, web_data_dir / "bridge_olap.parquet")

    # Inspect and validate generated OLAP dataset
    table = pq.read_table(output_olap_file)
    olap_rows = table.num_rows
    total_deals = sum(table.column('deal_count').to_pylist())
    file_size_kb = output_olap_file.stat().st_size / 1024
    file_size_mb = file_size_kb / 1024

    compression_pct = (1.0 - (olap_rows / total_deals)) * 100 if total_deals > 0 else 0

    print(f"[OK] OLAP Aggregation Completed in {elapsed:.2f}s:")
    print(f"  Total input deals: {total_deals:,}")
    print(f"  OLAP cube rows:    {olap_rows:,} (-{compression_pct:.1f}% reduction)")
    print(f"  File size:         {file_size_mb:.2f} MB ({file_size_kb:.1f} KB)")
    print(f"  Output path:       {output_olap_file}")
    print(f"  Web public path:   {web_data_dir / 'bridge_olap.parquet'}")
    print(f"  Columns:           {table.num_columns} (Indices 0-13 preserved, technique_flags at index 14)")


if __name__ == "__main__":
    main()
