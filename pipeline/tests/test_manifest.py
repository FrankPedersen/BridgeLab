import sys
from pathlib import Path

pipeline_dir = Path(__file__).resolve().parents[1]
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

import pyarrow as pa
import pyarrow.parquet as pq

from build_manifest import build_manifest


def test_manifest_schema_and_actual_file_hashes(tmp_path):
    repo_root = pipeline_dir.parent
    pq.write_table(
        pa.table({"deal_count": pa.array([400000], type=pa.uint32())}),
        tmp_path / "bridge_olap.parquet",
    )
    (tmp_path / "sample_deals.json").write_text('[{"deal_id": 1}]', encoding="utf-8")

    manifest = build_manifest(400000, 0, tmp_path, repo_root)

    assert manifest["dealCount"] == 400000
    assert manifest["seedStart"] == 0
    assert manifest["seedEnd"] == 399999
    assert manifest["rngAlgorithm"] == "Mulberry32"
    assert manifest["ddsEngine"] == "endplay"
    assert manifest["ddsVersion"] is not None
    assert manifest["olapSchemaVersion"] == "1"

    entries = {entry["name"]: entry for entry in manifest["files"]}
    assert "bridge_olap.parquet" in entries
    assert entries["bridge_olap.parquet"]["rows"] == 1
    assert len(entries["bridge_olap.parquet"]["sha256"]) == 64
    assert entries["sample_deals.json"]["rows"] == 1
