# Experiment 001: Flannery versus Natural 1H on identical deals

**Status:** Experimental specification
**Experiment ID/version:** `EXP-001` / `1.0.0`

This experiment does not claim that Flannery is superior to Natural 1H. Its
purpose is to establish a reproducible framework for comparing explicitly
versioned strategies on identical deals. No bidding results or statistical
values are asserted in this document.

## 1. Purpose and current repository capability

BridgeLab currently contains:

- deterministic deal generation and Python/TypeScript RNG test vectors;
- HCP calculation, hand-shape fields, and a Flannery candidate-hand flag;
- real Double Dummy integration through `endplay.dds.calc_all_tables`;
- duplicate scoring in an isolated domain module;
- dataset manifest generation;
- generic auction and final-contract domain models;
- a bidding-strategy protocol, experiment model, and preliminary evaluation
  structures; and
- a React interface for exploring loaded statistical datasets.

The repository does **not** implement Flannery or Natural 1H bidding
strategies, an always-pass strategy, a strategy runner, or the paired
Experiment 001 evaluation and aggregation. The experiment model and result
types are building blocks, not an executing experiment. At inspection,
`web/public/data` contains no verified dataset and `pipeline/output` contains
no completed dataset, so there are no Experiment 001 results to report.

The experiment must keep these questions separate:

1. **Frequency:** how often does the defined Flannery hand type occur?
2. **Contract potential:** what contracts are makeable according to DDS?
3. **System effectiveness:** which contracts do the two specified bidding
   strategies reach, and what duplicate scores result?

Frequency and double-dummy potential can be computed from a valid generated
dataset. Strategy effectiveness cannot be measured until the required
responder and continuation rules have been approved and implemented.

## 2. Research question

Among generated deals where South holds 11–15 HCP, exactly five hearts, and
exactly four spades, how do the defined Flannery and Natural 1H strategies
differ in the contracts they reach and duplicate scores earned, with South
as dealer, no vulnerability, and East and West always passing?

This is a controlled comparison of the frozen Experiment 001 definitions,
not every possible real-world version of either system. The North/South
strategy identities and versions are:

| Strategy | `strategy_id` | `strategy_name` | Version |
|---|---|---|---|
| A | `flannery-exp001` | Flannery Experiment 001 | `1.0.0` |
| B | `natural-1h-exp001` | Natural 1H Experiment 001 | `1.0.0` |

Any bidding-rule change requires a new strategy version. Published results
must identify both strategy versions.

## 3. Experiment population

The eligible population uses the existing Flannery candidate signature.
Eligibility is determined before either bidding strategy runs.

| Population criterion | Experiment 001 v1 definition | Repository status |
|---|---|---|
| Opener | South | Experiment condition; pipeline hand descriptors use South as the opener field |
| South HCP | 11–15 inclusive | Verified in `pipeline/deal_prng.py` and `web/src/pages/FlanneryPage.tsx` |
| South hearts | Exactly 5 | Verified in candidate flag/filter code |
| South spades | Exactly 4 | Verified in candidate flag/filter code |
| South diamonds/clubs | No additional restriction | No such filter in the Flannery population |
| North | No pre-filter | North HCP and fits are stored, but are not eligibility criteria |
| East/West | No pre-filter | No opponent-hand eligibility filter |
| Dealer | South | Fixed by this experiment; not assigned in generated dataset rows |
| Vulnerability | None | Fixed by this experiment; not assigned in generated dataset rows |
| Opponent bidding | Always pass | Fixed by this experiment; no strategy implementation currently exists |

The conceptual eligibility predicate is:

```text
eligible =
    south_hcp >= 11
    AND south_hcp <= 15
    AND south_hearts == 5
    AND south_spades == 4
```

No responder HCP, fit, or opponent-hand filter may be applied. Responder and
opponent holdings remain random variables within this eligible population.
Strategy outcomes and DDS outcomes must not affect eligibility.

The pipeline records the candidate as bit 0 / mask `1` in `conv_flags`.
Eligibility should use the exact predicate above; do not add a filter based on
other convention bits or analysis results. The eligible deal IDs must be
frozen for each run and shared by both strategies.

## 4. Population selection

Selection is performed from the verified source dataset before either
strategy is run. Persist or reference the exact eligible `deal_id` list for
the run. Both strategies must receive the same IDs and reconstructed four
hands. Do not select, remove, or reorder deals based on auctions, contracts,
DDS, or scores.

For population reporting:

- `generated_deals` is the row/deal total from the verified source dataset
  manifest used by the run;
- `eligible_deals` is the count satisfying the predicate above; and
- `population_percentage` is
  `eligible_deals / generated_deals * 100`.

If the source manifest or required counts are unavailable or invalid, report
that there is no verified dataset and do not substitute a default count.

## 5. Fixed experiment conditions

Experiment 001 v1 uses:

| Setting | Fixed value |
|---|---|
| Dealer | South |
| Vulnerability | None |
| Opponent strategy | `always-pass`, version `1.0.0` |
| Competitive bidding | Off |
| Opponent doubles/redoubles | Off |
| Passed-hand bidding | Off |
| Opening-seat variation | Off |
| Vulnerability variation | Off |
| Slam conventions | Off unless explicitly added in a later approved strategy specification |
| Duplicate-score perspective | North/South |

These are experiment configuration values, not dataset attributes. Preserve
them with the run configuration and version. Do not infer dealer or
vulnerability from a generated deal ID.

## 6. Opponent strategy

The opponent strategy is:

| Field | Value |
|---|---|
| `strategy_id` | `always-pass` |
| `strategy_name` | Always Pass |
| `version` | `1.0.0` |

East and West each take their normal auction turns and return Pass whenever
legally entitled to act. Do not omit opponent seats from the auction
sequence. This policy specifies only East/West actions; it does not fill
undefined North/South strategy states.

The auction model can represent all four seats, but no Always Pass strategy
implementation currently exists.

## 7. Strategy A: Flannery

**Identity:** `flannery-exp001`, “Flannery Experiment 001”, version `1.0.0`.

For the eligible Experiment 001 South hand, South opens 2D. This opening is
fixed for this experiment version. No other opening-hand criteria may be
added, including suit quality, controls, losing trick count, vulnerability
adjustments, positional adjustments, or honour location.

No responder, rebid, continuation, sign-off, invitation, game-forcing, or
slam rules have been approved. Do not implement or infer them. The auditable
rule specification is
[`001-flannery-rules.md`](001-flannery-rules.md).

## 8. Strategy B: Natural 1H

**Identity:** `natural-1h-exp001`, “Natural 1H Experiment 001”, version
`1.0.0`.

Use exactly the same South hands and deal IDs as Strategy A. For this fixed
population, South opens 1H. No alternative opening may be selected. This is
an experimental forced opening and does not assert that these hands meet
every possible real-world definition of Natural 1H.

No responder, rebid, continuation, sign-off, invitation, game-forcing, or
slam rules have been approved. Do not implement or infer them. The auditable
rule specification is
[`001-natural-rules.md`](001-natural-rules.md).

## 9. Responder and rebid rules

Responder and continuation rules are **not approved** for either strategy.
No call meanings, hand ranges, forcing status, priorities, or fallback calls
may be invented.

The rule specifications use deterministic rule matrices. A future strategy
must select exactly one permitted rule for a given hand, auction, dealer,
vulnerability, and seat. If rules overlap, their priority must be explicit.
If no approved rule covers the state, report an **uncovered strategy state**.
Never silently pass or otherwise manufacture a call.

Until the missing rules are supplied and approved, the specified opening
calls are the only North/South strategy actions defined. Consequently, a
complete auction and system-effectiveness result cannot yet be produced.

## 10. Rule traceability

Every future bidding decision must be traceable to:

- `strategy_id`;
- `strategy_version`;
- acting seat;
- `rule_id`; and
- call.

The two rule documents assign identifiers to the specified opening rules for
documentation. There is no executable bidding trace yet. Future results
must not imply that these documentation IDs were used by an implementation
until that implementation exists.

## 11. Information boundary

A bidding strategy may access only:

- the acting player's own 13 cards;
- the acting player's seat;
- dealer;
- vulnerability;
- previous auction calls; and
- public strategy configuration.

A strategy must not access partner cards, opponent cards, the complete deal,
DDS results, future calls, final-contract potential, duplicate scores, or
statistical results from previous simulations.

The existing `pipeline/bidding_strategy.py` `StrategyState` includes the
acting player's hand, seat, vulnerability, dealer, and auction. It does not
include other hands or DDS results. This is currently an interface boundary,
not an executed/sandboxed strategy runner; future implementation and tests
must preserve and enforce it.

## 12. No double-dummy information leakage

The required experiment flow is:

```text
Deal
  -> North/South bidding strategies and East/West Always Pass
  -> completed auction
  -> final contract or passed out
  -> DDS lookup/evaluation for that contract
  -> made/down calculation
  -> duplicate score
  -> statistical comparison
```

DDS must never inform a bidding decision. The current offline pipeline
calculates all denomination/declarer DDS values while generating its dataset
and does not run auctions. A future experiment runner must not expose or
consult those values until the final contract is known; it must not use
unrelated denominations to change calls. Tests should make accidental DDS
access from strategy code difficult or impossible.

## 13. Paired experiment design

Evaluate every eligible deal twice:

```text
same deal -> Flannery -> Auction A -> Contract A
same deal -> Natural 1H -> Auction B -> Contract B
```

Both runs must use identical deal ID, four hands, South dealer, no
vulnerability, Always Pass opponent policy, DDS implementation, and duplicate
scoring implementation. The North/South bidding strategy is the only
intended experimental variable. Use one frozen eligible deal list and keep
the paired results associated by `deal_id`.

## 14. Experiment identity and configuration

Use the existing `pipeline/experiment.py` `Experiment` model where
appropriate. Its current fields cover experiment ID/version, a population
definition, strategy A/B metadata, deal IDs, dealer, vulnerability, and a
scoring-method label. It does not currently represent the opponent strategy,
dataset-manifest reference, or the full reproducibility record; those will
need explicit representation in future execution/output work.

The conceptual Experiment 001 v1 configuration is:

```json
{
  "experiment_id": "EXP-001",
  "experiment_version": "1.0.0",
  "population": {
    "opener": "South",
    "hcp_min": 11,
    "hcp_max": 15,
    "hearts": 5,
    "spades": 4
  },
  "dealer": "South",
  "vulnerability": "None",
  "opponent_strategy": {
    "strategy_id": "always-pass",
    "version": "1.0.0"
  },
  "strategy_a": {
    "strategy_id": "flannery-exp001",
    "strategy_name": "Flannery Experiment 001",
    "version": "1.0.0"
  },
  "strategy_b": {
    "strategy_id": "natural-1h-exp001",
    "strategy_name": "Natural 1H Experiment 001",
    "version": "1.0.0"
  }
}
```

This documents the required configuration shape; it does not claim that a
versioned executable configuration is currently stored or that the
experiment can run.

## 15. Versioning

Any change to any bidding rule requires a new version of that strategy.
Do not silently change a historical strategy definition. All published
statistics must identify both strategy IDs and versions, as well as the
opponent strategy ID/version.

## 16. Auction model

Reuse `pipeline/auction.py` for ordered calls, legal bid ordering, Pass,
Double, Redouble, next player, auction completion, passed-out detection, and
final-contract/declarer derivation. Do not embed Experiment 001 rules in the
generic auction model.

The auction module represents auction mechanics; it does not choose calls
for either strategy or implement Always Pass.

## 17. Final contract

For a completed auction, preserve level, denomination, declarer, and double
state. The result is either a completed contract or passed out.

For a passed-out deal:

```text
final_contract = null
duplicate_score = 0
```

## 18. DDS evaluation

Reuse the real endplay/DDS integration in `pipeline/dds_engine.py`, which
calls `endplay.dds.calc_all_tables`. After the final contract is known,
evaluate or look up tricks for that contract's declarer and denomination
only. Do not use other DDS denominations to influence the auction.

## 19. Made/down

For contract level `L`:

```text
required_tricks = L + 6
trick_difference = dds_tricks - required_tricks
```

Store `required_tricks`, `dds_tricks`, and `trick_difference`. Zero means
exactly made; a positive value is overtricks; a negative value is down.

## 20. Duplicate scoring

Reuse the tested `pipeline/duplicate_scoring.py`; do not modify it for this
documentation task. Experiment vulnerability is None. Normalize all scores
to the North/South perspective: positive is good for North/South and
negative is bad for North/South. A passed-out deal scores zero.

## 21. Score comparison

For each paired deal:

```text
score_difference = flannery_score - natural_score
```

Positive means Flannery has the higher North/South score, zero is a tie, and
negative means Natural 1H has the higher North/South score. Retain raw
duplicate-score differences. IMP conversion is a later enhancement.

## 22. Per-deal result

Future per-deal output must support:

```yaml
deal_id: <source dataset deal ID>
experiment_id: EXP-001
experiment_version: 1.0.0
dealer: South
vulnerability: None

strategy_a:
  strategy_id: flannery-exp001
  strategy_version: 1.0.0
  auction: <ordered four-seat calls>
  bidding_rule_trace: <seat, rule_id, and call entries>
  final_contract: <contract or null if passed out>
  required_tricks: <integer or null>
  dds_tricks: <integer or null>
  trick_difference: <integer or null>
  duplicate_score: <North/South score; 0 if passed out>

strategy_b:
  strategy_id: natural-1h-exp001
  strategy_version: 1.0.0
  auction: <ordered four-seat calls>
  bidding_rule_trace: <seat, rule_id, and call entries>
  final_contract: <contract or null if passed out>
  required_tricks: <integer or null>
  dds_tricks: <integer or null>
  trick_difference: <integer or null>
  duplicate_score: <North/South score; 0 if passed out>

comparison:
  score_difference: <flannery_score - natural_score>
  winner: <FLANNERY, NATURAL, or TIE>
```

The current `pipeline/evaluation.py` contains preliminary strategy/deal
evaluation structures but does not include every field above or execute the
comparison. Do not populate uncomputed fields with invented values.

## 23. Reached versus made

“Reached” is determined only from the auction's final contract.
“Made” is determined from that contract and its DDS trick result.

- A 4H contract down one is game reached, game not made.
- A 3H contract is not game reached, even if its DDS result indicates enough
  tricks for game in hearts.

Do not infer the contract reached from DDS.

## 24. Game classification

Game reached includes:

- 3NT or higher notrump;
- 4H or higher hearts;
- 4S or higher spades;
- 5C or higher clubs; and
- 5D or higher diamonds.

Game made requires that the reached game contract's DDS trick count is at
least `contract_level + 6`. A lower-level contract is not game reached just
because DDS shows game-level tricks.

## 25. Slam classification

- Small slam reached: final contract level is 6.
- Grand slam reached: final contract level is 7.
- Slam made: DDS tricks are at least final contract level plus 6.

Report reached and made separately.

## 26. Aggregate statistics and denominators

Future output must report at least:

**Population**

- generated deals;
- eligible deals; and
- population percentage.

**Auction/contract, separately for each strategy**

- passed out;
- partscore reached;
- game reached;
- small slam reached; and
- grand slam reached.

**Performance, separately for each strategy**

- contracts made;
- contracts down;
- average duplicate score; and
- median duplicate score.

**Paired comparison**

- Flannery higher score;
- Natural 1H higher score;
- tie;
- mean score difference; and
- median score difference.

Unless a future approved definition says otherwise, use these denominators:

- population percentage: all generated deals in the verified source dataset;
- all auction/contract counts: all eligible deals; report passed out and
  partscore separately, define partscore as a contract below the applicable
  game threshold, and report game reached using the thresholds in section 24.
  Game-reached counts are inclusive and can overlap with small- and
  grand-slam counts;
- contracts made/down: non-passed-out eligible deals with a completed
  contract (report passed-outs separately);
- average/median duplicate score: all eligible deals, including passed-out
  scores of zero;
- paired winner percentages/counts and mean/median score difference: all
  eligible paired deals, including pass-outs scored zero.

Do not produce effectiveness aggregates while any North/South state needed
for a completed auction is uncovered. Do not omit such deals or treat an
undefined action as Pass. Report that the strategy specification is
incomplete instead.

## 27. Later statistical enhancements

Not required for the first implementation:

- IMP conversion;
- confidence intervals;
- standard errors;
- bootstrap analysis;
- matchpoint simulation;
- competitive-bidding analysis;
- vulnerability sensitivity; and
- seat sensitivity.

Do not let this experiment design prevent those later additions.

## 28. Reproducibility

Preserve or reference:

- experiment ID/version;
- strategy IDs/versions;
- opponent strategy/version;
- eligible deal IDs;
- source dataset manifest;
- RNG algorithm/version;
- dealer and vulnerability;
- DDS implementation/version;
- scoring method/version;
- pipeline version; and
- Git commit, where available.

Never publish an aggregate result that cannot be traced to its experimental
configuration.

## 29. Dataset manifest

Reuse the existing manifest architecture and retain a reference to the exact
source dataset manifest with experiment output. The pipeline can generate
manifests, but no completed production dataset is currently available in the
inspected output locations. Never replace missing manifest values or deal
counts with assumptions or hardcoded UI values.

## 30. Frontend principles

Do not redesign the React frontend for this specification. If Experiment 001
is later presented in the UI, use this order:

1. research question;
2. number of eligible deals;
3. headline comparison;
4. contract outcomes;
5. score comparison;
6. distribution;
7. methodology;
8. strategy definitions; and
9. reproducibility metadata.

Clearly separate computed results from explanatory methodology. Never
present placeholder values as actual simulation results.

## 31. Required rule specifications

The rule specifications are:

- [`001-flannery-rules.md`](001-flannery-rules.md)
- [`001-natural-rules.md`](001-natural-rules.md)

Each records strategy identity, scope, opening rule, response rules, opener
rebids, responder continuations, sign-offs, invitations, game-forcing
actions, slam policy, unsupported states, and a rule matrix with priority
and next state. Missing rules are explicitly marked
**UNDEFINED - DOMAIN DECISION REQUIRED**. These documents expose missing
bridge knowledge; they do not supply executable bidding logic.

## 32. Current task scope

This step updates this experimental specification and creates the two
auditable rule specifications. It reuses the repository architecture and
does not:

- implement Flannery or Natural 1H responder logic;
- implement bidding strategies or a strategy runner;
- modify DDS, RNG, or duplicate scoring;
- run a large simulation or generate statistical results; or
- redesign the frontend.

## 33. Validation

After these documentation changes, run:

- the complete Python test suite;
- TypeScript type checking; and
- `npm.cmd run build` for the frontend production build.

Do not run large DDS generation. Report exact command outcomes. Since this
task changes documentation only, validation is still run as explicitly
required.

## 34. Git commit and push

Commit only if all three validation steps pass and the diff contains only
the intended documentation changes. Review Git status and do not include
generated Parquet/simulation output, credentials, secrets, caches,
`node_modules`, or build output.

Use commit message:

```text
Define Experiment 001 research protocol
```

Push to the currently checked-out branch. Do not force-push, change
branches, or overwrite remote history. If authentication fails, keep the
successful local commit, do not retry repeatedly, and report that
authentication is required. If any validation fails, do not commit or push.

## 35. Stop condition

After the experiment specification is updated, both bidding-rule documents
exist, validation succeeds, and commit/push has been attempted as required,
stop. Do not proceed to implementing bidding rules.

Report files created/changed, unresolved rules for both strategies, exact
Python/TypeScript/build outcomes, commit hash if committed, and push result.
The next phase begins only after the bridge-domain rules have been reviewed
and approved.
