"""
2_build_olap.py - Pre-aggregated OLAP Table Generation
Reads master_dds.parquet, groups by all analytical dimensions,
and exports compact bridge_olap.parquet with deal_count (uint32).
"""

import sys
from pathlib import Path
import pyarrow as pa
import pyarrow.parquet as pq
import pyarrow.compute as pc


def main():
    pipeline_dir = Path(__file__).parent
    input_file = pipeline_dir / "output" / "master_dds.parquet"
    output_file = pipeline_dir / "output" / "bridge_olap.parquet"

    if not input_file.exists():
        print(f"Error: {input_file} does not exist. Run 1_generate_dds.py first.")
        sys.exit(1)

    print(f"=== Building OLAP Cube: {output_file} ===")
    print(f"Reading master dataset: {input_file} ...")
    table = pq.read_table(input_file)
    print(f"Loaded {table.num_rows:,} raw deals.")

    group_keys = [
        'opener_hcp', 'spades', 'hearts', 'diamonds', 'clubs',
        'conv_flags', 'responder_hcp', 'spade_fit', 'heart_fit',
        'dds_s', 'dds_h', 'dds_nt', 'opp_game'
    ]

    print("Grouping and aggregating deal counts...")
    grouped = table.group_by(group_keys).aggregate([('deal_id', 'count')])

    # Rename deal_id_count to deal_count
    schema_fields = []
    arrays = []

    for name in group_keys:
        schema_fields.append((name, pa.uint8()))
        arrays.append(pc.cast(grouped.column(name), pa.uint8()))

    # Deal count column
    schema_fields.append(('deal_count', pa.uint32()))
    count_col = grouped.column('deal_id_count')
    arrays.append(pc.cast(count_col, pa.uint32()))

    target_schema = pa.schema(schema_fields)
    olap_table = pa.Table.from_arrays(arrays, schema=target_schema)

    # Sort table for optimal parquet compression and scan locality
    # (opener_hcp, spades, hearts)
    sort_indices = pc.sort_indices(olap_table, sort_keys=[('opener_hcp', 'ascending'), ('conv_flags', 'ascending')])
    olap_table_sorted = pc.take(olap_table, sort_indices)

    pq.write_table(olap_table_sorted, output_file, compression='snappy')

    orig_rows = table.num_rows
    olap_rows = olap_table.num_rows
    compression_ratio = (1.0 - (olap_rows / orig_rows)) * 100 if orig_rows > 0 else 0
    file_size_kb = output_file.stat().st_size / 1024

    print(f"OLAP aggregation complete:")
    print(f"  Input deals:       {orig_rows:,}")
    print(f"  OLAP rows:         {olap_rows:,} (-{compression_ratio:.1f}% reduction)")
    print(f"  Output Parquet:    {output_file} ({file_size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
