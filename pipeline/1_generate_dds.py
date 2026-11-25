"""
1_generate_dds.py - High-Performance Multiprocess Bridge Simulator & DDS Generator
Scales to 400,000 deals using multiprocessing and chunked Parquet writing.
Keeps memory usage under 2 GB by streaming chunks to disk.
Computes 20 endplay Double Dummy results per deal.
"""

import os
import sys
import argparse
import time
import shutil
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
import pyarrow as pa
import pyarrow.parquet as pq
from tqdm import tqdm
import yaml

# Add pipeline directory to sys.path for child processes
pipeline_dir = Path(__file__).parent.resolve()
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

from deal_prng import generate_deal, evaluate_hand, compute_conv_flags
from dds_engine import solve_deal


def get_schema() -> pa.Schema:
    fields = [
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
    ]
    for suit in ('s', 'h', 'd', 'c', 'nt'):
        for player in ('n', 'e', 's', 'w'):
            fields.append((f'dds_{suit}_{player}', pa.uint8()))
    fields.append(('dds_source', pa.string()))
    return pa.schema(fields)


def _worker_process_range(start_id: int, count: int) -> tuple:
    """
    Worker function executed in parallel across CPU cores.
    Processes a slice of deals deterministically using true endplay DDS.
    """
    schema_names = [
        'deal_id', 'opener_hcp', 'spades', 'hearts', 'diamonds', 'clubs',
        'conv_flags', 'responder_hcp', 'spade_fit', 'heart_fit',
        'dds_s', 'dds_h', 'dds_d', 'dds_c', 'dds_nt', 'opp_game'
    ]
    for suit in ('s', 'h', 'd', 'c', 'nt'):
        for player in ('n', 'e', 's', 'w'):
            schema_names.append(f'dds_{suit}_{player}')
    schema_names.append('dds_source')
    cols = {name: [] for name in schema_names}
    candidates_count = 0

    for i in range(count):
        deal_id = start_id + i
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
        for suit in ('s', 'h', 'd', 'c', 'nt'):
            for player in ('n', 'e', 's', 'w'):
                cols[f'dds_{suit}_{player}'].append(dds[f'dds_{suit}_{player}'])
        cols['dds_source'].append(dds['dds_source'])

    return cols, candidates_count


def main():
    parser = argparse.ArgumentParser(description="High-performance true Double Dummy generator.")
    parser.add_argument("--deals", type=int, default=None, help="Total deals to simulate")
    parser.add_argument("--chunk-size", type=int, default=100000, help="Deals per raw parquet chunk")
    parser.add_argument("--workers", type=int, default=None, help="Number of parallel worker processes")
    args = parser.parse_args()

    config_path = pipeline_dir / "config.yaml"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
    else:
        config = {"simulation": {"test_deals": 50000}}

    total_deals = args.deals if args.deals is not None else config["simulation"].get("total_deals", 400000)
    chunk_size = args.chunk_size

    # Optimal CPU workers
    num_cpus = os.cpu_count() or 4
    num_workers = args.workers if args.workers is not None else max(1, num_cpus - 1)

    output_dir = pipeline_dir / "output"
    chunks_dir = output_dir / "raw_chunks"
    chunks_dir.mkdir(parents=True, exist_ok=True)

    # Clean previous raw chunks for a clean run
    for old_file in chunks_dir.glob("*.parquet"):
        try:
            old_file.unlink()
        except Exception:
            pass

    schema = get_schema()
    num_chunks = (total_deals + chunk_size - 1) // chunk_size

    print("=== BridgeLab True endplay DDS Generator ===")
    print(f"Total deals:        {total_deals:,}")
    print(f"Chunk size:         {chunk_size:,} deals/chunk ({num_chunks} chunks)")
    print(f"Parallel workers:   {num_workers} processes (on {num_cpus} CPU cores)")
    print(f"Chunks directory:   {chunks_dir}")

    start_time = time.time()
    total_generated = 0
    total_candidates = 0

    # Worker task slice size (e.g. 10,000 deals per sub-task for even distribution)
    slice_size = min(10000, max(1000, chunk_size // (num_workers * 2)))

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        with tqdm(total=total_deals, desc="Generating & Solving", unit="deals") as pbar:
            for chunk_idx in range(num_chunks):
                current_chunk_size = min(chunk_size, total_deals - total_generated)
                if current_chunk_size <= 0:
                    break

                # Prepare slices for parallel workers
                futures = []
                chunk_start_id = total_generated
                offset = 0
                while offset < current_chunk_size:
                    current_slice = min(slice_size, current_chunk_size - offset)
                    futures.append(
                        executor.submit(_worker_process_range, chunk_start_id + offset, current_slice)
                    )
                    offset += current_slice

                # Aggregate results for this chunk in memory
                chunk_cols = {name: [] for name in schema.names}
                for f in as_completed(futures):
                    slice_cols, c_count = f.result()
                    total_candidates += c_count
                    for name in schema.names:
                        chunk_cols[name].extend(slice_cols[name])

                # Build PyArrow Table and write immediately to chunk file
                chunk_table = pa.Table.from_arrays(
                    [pa.array(chunk_cols[name], type=schema.field(name).type) for name in schema.names],
                    schema=schema
                )

                chunk_file = chunks_dir / f"chunk_{chunk_idx:04d}.parquet"
                pq.write_table(chunk_table, chunk_file, compression='snappy')

                total_generated += current_chunk_size
                pbar.update(current_chunk_size)

                # Update tqdm description with current speed
                elapsed = time.time() - start_time
                rate = total_generated / elapsed if elapsed > 0 else 0
                pbar.set_postfix({
                    "deals/s": f"{rate:,.0f}",
                    "chunk": f"{chunk_idx+1}/{num_chunks}"
                })

    elapsed_total = time.time() - start_time
    total_rate = total_generated / elapsed_total if elapsed_total > 0 else 0

    print(f"\n[OK] Step 1 Complete in {elapsed_total:.2f}s ({total_rate:,.0f} deals/sec)")
    print(f"Generated {total_generated:,} deals across {num_chunks} raw chunks.")


if __name__ == "__main__":
    main()
