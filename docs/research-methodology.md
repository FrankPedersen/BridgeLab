# BridgeLab research methodology

## Purpose

BridgeLab is intended to support statistically valid bridge-system research.
It separates deal generation, hand classification, DDS evaluation, bidding, duplicate scoring and presentation.

## Current scope

At present, BridgeLab implements deterministic deal generation and real Double Dummy evaluation.
It does not implement bidding or compare reached contracts.

## Reproducibility

Deals are generated from integer seeds by a Mulberry32 PRNG and Fisher-Yates shuffle.
Python and TypeScript must reconstruct the same deal for the same seed.

Shared RNG vectors are stored in `docs/rng-vectors.json`.

## Double Dummy provenance

The pipeline uses `endplay 0.5.12` and `endplay.dds.calc_all_tables`.
Fixed PBN fixtures are stored in `docs/dds-fixtures.json`.

The fixtures are fixed endplay outputs. Independent bridge-known facits should be added as they are verified.

## Dataset validity

Every production run should produce `pipeline/output/manifest.json`.
The manifest identifies deal count, seed range, RNG, pipeline commit, DDS implementation/version, OLAP schema and SHA-256 hashes.

No UI count or percentage is production data unless it comes from an accompanying loaded dataset or verified manifest.

## Statistical separation

The following are separate concepts:

- Double Dummy contract potential.
- Contracts reached by a bidding system.
- Duplicate contract scores.
- Frequencies and percentages computed from generated deals.

No React component or DDS engine may decide which contract a bidding system reaches.
