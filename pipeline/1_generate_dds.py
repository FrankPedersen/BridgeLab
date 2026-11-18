"""
1_generate_dds.py - Batch deal simulation and Double Dummy Solving
Generates deterministic deals from Mulberry32 PRNG and calculates DDS tricks.
Outputs to output/master_dds.parquet using pyarrow.
"""

import os
import sys
import argparse
import yaml
from pathlib import Path
from tqdm import tqdm
import pyarrow as pa
import pyarrow.parquet as pq

from deal_prng import generate_deal, evaluate_hand, compute_conv_flags
from dds_engine import solve_deal


def get_schema() -> pa.Schema:
    return pa.schema([
        ('deal_id', pa.int64()),
        ('opener_hcp', pa.uint8()),
        ('spades', pa.uint8()),
        ('hearts', pa.uint8()),
        ('diamonds', pa.uint8()),
        ('clubs', pa.uint8()),
        ('conv_flags', pa.uint8()),
        ('responder_hcp', pa.uint8()),
        ('spade_fit', pa.uint8()),
        ('heart_fit', pa.uint8()),
        ('dds_s', pa.uint8()),
        ('dds_h', pa.uint8()),
        ('dds_d', pa.uint8()),
        ('dds_c', pa.uint8()),
        ('dds_nt', pa.uint8()),
        ('opp_game', pa.uint8()),
    ])


def main():
    parser = argparse.ArgumentParser(description="Simulate bridge deals and compute DDS results.")
    parser.add_argument("--deals", type=int, default=None, help="Number of deals to simulate (overrides config)")
    parser.add_argument("--chunk-size", type=int, default=50000, help="Chunk size for batch writing")
    args = parser.parse_args()

    config_path = Path(__file__).parent / "config.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    total_deals = args.deals if args.deals is not None else config["simulation"].get("test_deals", 50000)
    chunk_size = args.chunk_size

    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "master_dds.parquet"

    print(f"=== Bridge DDS Generator ===")
    print(f"Total deals to simulate: {total_deals:,}")
    print(f"Chunk size: {chunk_size:,}")
    print(f"Output: {output_file}")

    schema = get_schema()
    writer = pq.ParquetWriter(output_file, schema, compression='snappy')

    num_chunks = (total_deals + chunk_size - 1) // chunk_size

    total_generated = 0
    with tqdm(total=total_deals, desc="Simulating & Solving") as pbar:
        for chunk_idx in range(num_chunks):
            current_chunk_size = min(chunk_size, total_deals - total_generated)
            if current_chunk_size <= 0:
                break

            cols = {name: [] for name in schema.names}

            for i in range(current_chunk_size):
                deal_id = total_generated + i
                n_cards, e_cards, s_cards, w_cards = generate_deal(deal_id)

                n_eval = evaluate_hand(n_cards)
                s_eval = evaluate_hand(s_cards)
                e_eval = evaluate_hand(e_cards)
                w_eval = evaluate_hand(w_cards)

                conv_flags = compute_conv_flags(s_eval)
                dds = solve_deal((n_cards, e_cards, s_cards, w_cards), n_eval, s_eval, e_eval, w_eval)

                cols['deal_id'].append(deal_id)
                cols['opener_hcp'].append(s_eval['hcp'])
                cols['spades'].append(s_eval['spades'])
                cols['hearts'].append(s_eval['hearts'])
                cols['diamonds'].append(s_eval['diamonds'])
                cols['clubs'].append(s_eval['clubs'])
                cols['conv_flags'].append(conv_flags)
                cols['responder_hcp'].append(n_eval['hcp'])
                cols['spade_fit'].append(s_eval['spades'] + n_eval['spades'])
                cols['heart_fit'].append(s_eval['hearts'] + n_eval['hearts'])
                cols['dds_s'].append(dds['dds_s'])
                cols['dds_h'].append(dds['dds_h'])
                cols['dds_d'].append(dds['dds_d'])
                cols['dds_c'].append(dds['dds_c'])
                cols['dds_nt'].append(dds['dds_nt'])
                cols['opp_game'].append(dds['opp_game'])

            batch_table = pa.Table.from_arrays(
                [pa.array(cols[name], type=schema.field(name).type) for name in schema.names],
                schema=schema
            )
            writer.write_table(batch_table)
            total_generated += current_chunk_size
            pbar.update(current_chunk_size)

    writer.close()
    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"Successfully generated {total_generated:,} deals into {output_file} ({file_size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
