"""Build the machine-readable manifest for one pipeline run."""

import hashlib
import json
import subprocess
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

import pyarrow.parquet as pq


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_commit(repo_root: Path):
    try:
        output = subprocess.run(
            ["git", "-C", str(repo_root), "rev-parse", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
        )
        return output.stdout.strip()
    except Exception:
        return None


def build_manifest(deal_count: int, seed_start: int, output_dir: Path, repo_root: Path):
    commit = git_commit(repo_root)
    try:
        dds_version = version("endplay")
    except PackageNotFoundError:
        dds_version = None

    file_entries = []
    for name in ("bridge_olap.parquet", "sample_deals.parquet", "sample_deals.json"):
        path = output_dir / name
        if not path.exists():
            continue
        rows = 0
        if path.suffix == ".parquet":
            rows = pq.read_metadata(path).num_rows
        elif path.suffix == ".json":
            try:
                content = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(content, list):
                    rows = len(content)
            except json.JSONDecodeError:
                rows = 0
        file_entries.append({
            "name": name,
            "sha256": sha256(path),
            "rows": rows,
        })

    manifest = {
        "datasetVersion": "v1",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "dealCount": deal_count,
        "seedStart": seed_start,
        "seedEnd": seed_start + deal_count - 1 if deal_count > 0 else None,
        "rngAlgorithm": "Mulberry32",
        "pipelineVersion": commit,
        "ddsEngine": "endplay",
        "ddsVersion": dds_version,
        "olapSchemaVersion": "1",
        "gitCommit": commit,
        "files": file_entries,
    }
    return manifest


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--deal-count", type=int, required=True)
    parser.add_argument("--seed-start", type=int, default=0)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    manifest = build_manifest(args.deal_count, args.seed_start, args.output_dir, repo_root)
    manifest_path = args.output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] Wrote {manifest_path}")
