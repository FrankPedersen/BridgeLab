# Experiment 001: Flannery versus a natural 1H approach

## Research question

Among generated deals in which South has the currently coded Flannery candidate hand shape and strength, how do a fully specified Flannery partnership approach and a fully specified natural 1H partnership approach compare in the auctions they reach and the duplicate scores those contracts would earn?

This is a proposed research question, not a result or a claim that either approach is superior. Neither bidding approach is currently implemented. A natural 1H system and the complete Flannery continuations must be defined by a bridge-domain expert before this question can be measured.

## Population

The current candidate-hand signature is the South hand in a generated deal with 11–15 HCP, exactly four spades and exactly five hearts. The pipeline generates general deals; this signature is a filter, not an opening bid or a modeled auction. Deal generation labels North as the responder and South as the opener for its stored hand descriptors. It does not assign dealer or vulnerability to generated records.

| Criterion | Status | What the repository currently establishes |
|---|---|---|
| Opener HCP | **VERIFIED IN CODE** | South hand HCP is calculated and the Flannery flag requires 11–15 inclusive. `web/src/pages/FlanneryPage.tsx` applies the same range. |
| Heart length | **VERIFIED IN CODE** | South must have exactly five hearts. |
| Spade length | **VERIFIED IN CODE** | South must have exactly four spades. The “not 5-5” note in `pipeline/config.yaml` is redundant for this exact shape; `pipeline/deal_prng.py` does not separately test a 5-5 exclusion. |
| Dealer | **UNDEFINED** | The auction model can represent a dealer, but generated dataset records do not assign one and no dealer distribution or eligibility rule is configured. South being labelled the opener in the generated hand descriptors does not make South the dealer. |
| Vulnerability | **UNDEFINED** | Vulnerability is a domain value used by the auction and scoring modules, but the deal dataset has no vulnerability assignment or experiment rule. |
| Responder requirements | **UNDEFINED** | North is the responder position in generated descriptors. North HCP and the combined North-South major fits are recorded, and the web filter can optionally constrain responder HCP or minimum major fit. No responder thresholds are set by the Flannery page or pipeline population definition. |
| Opponent constraints | **UNDEFINED** | East and West cards and DDS results exist per generated deal, but no opponent bidding behavior or opponent hand constraints are defined. |
| Natural 1H eligibility | **UNDEFINED** | No natural 1H opening hand definition or corresponding candidate filter exists in the repository. |

The flag is bit 0 (`conv_flags` mask `1`) and is calculated in `pipeline/deal_prng.py`. The default Flannery page filter is in `web/src/pages/FlanneryPage.tsx`; data generation, including the South/North descriptors, is in `pipeline/1_generate_dds.py`. These identify candidate hands only. They do not prove that the hand opens 2D or that any auction follows.

## Flannery strategy

The repository names a page and candidate-hand flag “Flannery 2♦” and describes a candidate range of 11–15 HCP, four spades and five hearts. It has no Flannery bidding strategy, response rules, or executable auction policy. The explanatory prose in `web/src/pages/FlanneryPage.tsx` is presentation text, not an implemented or authoritative bidding specification.

The following rules are needed to model a complete partnership auction. Except for the candidate hand signature above, they are not established by executable repository code:

1. **Opening action and eligibility**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Confirm whether every eligible candidate hand opens 2D, including passed-hand, seat, dealer, vulnerability, and prior-auction cases. The page label “Flannery 2♦” is not an implemented call rule.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define any opening exceptions, hand evaluation requirements beyond the candidate signature, and what the partnership does with hands outside that signature.
2. **Responder actions over the opening**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Specify every permitted response and its hand/shape requirements, including response strength, suit length, fit, and whether it is forcing or invitational.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define the meanings and continuations for all responses the expert chooses to include, including notrump and major-suit actions.
3. **Opener continuations**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Specify opener rebids after each responder action, including ranges, shape clarification, and pass/forcing status.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define opener and responder continuations after invitations, game-forcing actions, and slam exploration.
4. **Competitive and exceptional auctions**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define the partnership's actions after opponent intervention, doubles, and redoubles.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define passed-hand continuations, reopening actions, and any seat- or vulnerability-dependent variations.
5. **Auction termination**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define when the partnership accepts a partscore, game, or slam outcome and how it continues until the auction ends. The generic auction data model can validate calls and derive a final contract, but it does not supply these decisions.

## Natural strategy

No natural 1H strategy or ruleset is present. The only source mentioning a natural 1H opening is explanatory copy on the Flannery page; it describes a comparison but does not define opening criteria or a complete system. Do not treat that prose as a natural-system specification.

The following decisions are required before a complete natural 1H auction can be modeled:

1. **Opening action and eligibility**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define minimum and maximum opening strength, if any, and how strength is measured.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Decide whether 1H requires five or more hearts, and define any exceptions and other shape requirements.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define opening behavior by seat, dealer, vulnerability, passed-hand status, and prior auction.
2. **Responder actions**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Specify responder strength ranges and meanings for each included action.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define major-fit responses, including heart raises and spade responses, their suit-length/fit requirements, and their forcing status.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define notrump responses and their ranges, shape requirements, and forcing status.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define minor-suit responses, jumps, and any other response actions included in the system.
3. **Continuations**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define opener rebids after each responder action, including rebid ranges and shape promises.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define invitations, game-forcing actions, game choices, and slam exploration.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define continuation rules after opponent intervention, doubles, and redoubles.
4. **System boundaries**
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — State which meanings are natural and whether any conventions are included or excluded. “Natural” alone does not determine a complete response or rebid structure.
   - **UNDEFINED - DOMAIN DECISION REQUIRED** — Define passed-hand and seat/vulnerability variations and the policy for hands that do not open 1H.

## Opponent model

**C. Opponents are currently undefined.**

The repository has no opponent bidding strategy and does not specify that opponents always pass. The auction model can represent calls from all four seats, but it is only a call-sequence/domain model. Whether opponents pass or bid according to a defined strategy is an experiment decision, not a current default.

## Experiment boundaries

These are three different research questions:

1. **Frequency — how often does the defined hand type occur?** The pipeline can generate seeded deals and calculate the current South-hand candidate signature. The OLAP data can aggregate deal counts for that signature. This can give an exact count and proportion *within a particular generated dataset*. It is not a measured result for Experiment 001 yet: no verified dataset is currently present in `web/public/data` or `pipeline/output`. It also does not by itself establish the population frequency for all possible deals.
2. **Contract potential — what contracts are makeable according to DDS?** The pipeline uses `endplay.dds.calc_all_tables` and retains double-dummy tricks for each denomination and declarer. On a valid dataset, that can analyze double-dummy contract potential for the specified deals. It does not say which contract either partnership would bid or reach.
3. **System effectiveness — what contract does each bidding strategy actually reach?** This cannot currently be measured. There are no implemented bidding strategies, strategy runner, or opponent model. `pipeline/auction.py` represents and validates an auction and derives a final contract when supplied calls; it does not choose calls. `pipeline/duplicate_scoring.py` scores a supplied contract and trick result, but there is no integrated experiment evaluation.

Accordingly, frequency within a verified generated dataset and double-dummy contract potential are supported by existing components. Strategy effectiveness is not. No Experiment 001 statistical outputs have been generated.

## Information boundaries

The existing strategy protocol receives a `StrategyState` containing:

- the acting player's own 13-card hand;
- that player's seat;
- vulnerability;
- dealer; and
- the auction state and calls made so far.

It does not include partner or opponent cards, DDS results, or future calls. This follows from the fields in `pipeline/bidding_strategy.py` and the `BiddingStrategy.choose_call(state)` protocol. It is an interface-level boundary; the current code does not execute strategy implementations or sandbox arbitrary external code.

Any future Experiment 001 strategy runner must preserve this boundary. In particular, DDS must be evaluated only after a final contract exists and must not be passed to a bidding strategy.

## Comparison methodology

Do not implement the comparison until both partnership systems and the unresolved experiment settings are specified. The intended paired design is:

1. Select one fixed, documented list of eligible `deal_id` values from a generated dataset. Reconstruct each deal deterministically from the same ID/seed for both strategy runs.
2. For each deal, use the same North/South partnership orientation, dealer, and vulnerability for Flannery and natural 1H. Define these assignments explicitly; they are not currently stored with generated deals.
3. Run each partnership strategy on the same deal. Use the same opponent assumptions and the same opponent actions in both runs. The opponent policy must be defined before this is possible.
4. Evaluate the final contract from each completed auction against the same deal using the same DDS implementation and version. DDS must not affect any call.
5. Score each result with the same duplicate-scoring implementation and vulnerability. Use a consistent score perspective for both strategies and document it before comparing.
6. Preserve the experiment version, strategy IDs/versions, dataset manifest, deal IDs, dealer/vulnerability assignments, opponent model, DDS version, and scoring method with the results.

No comparison is implemented by this document. The existing `Experiment` model can hold shared deal IDs, strategy metadata, dealer, vulnerability, and a scoring-method label, but it does not run either strategy.

## Required outputs

The future per-deal result must preserve the paired outcomes. This is a shape specification, not example result data:

```yaml
deal_id: <generated deal identifier>

strategy_a:
  auction: <ordered calls>
  final_contract: <derived contract, or null if passed out>
  dds_tricks: <DDS tricks for the final contract, or null if no contract>
  made_or_down: <derived outcome; exact representation to be specified>
  duplicate_score: <score, or null until scoreable>

strategy_b:
  auction: <ordered calls>
  final_contract: <derived contract, or null if passed out>
  dds_tricks: <DDS tricks for the final contract, or null if no contract>
  made_or_down: <derived outcome; exact representation to be specified>
  duplicate_score: <score, or null until scoreable>

comparison:
  score_difference: <paired score difference; perspective/sign convention to be specified>
```

The existing `pipeline/evaluation.py` has preliminary `StrategyEvaluation` and `DealEvaluation` data structures. They do not currently include `made_or_down` or a field named `score_difference`, and the repository does not run these evaluations.

## Statistical outputs

For the same eligible paired-deal set, future aggregation should report:

- number of eligible deals (and clearly state whether passed-out or incomplete auctions remain in the denominator);
- contract distribution by strategy;
- game reached and game made by strategy;
- slam reached and slam made by strategy;
- average duplicate score by strategy;
- paired score difference; and
- percentage of deals where A wins, B wins, or the result is tied.

No aggregate values are supplied here. Definitions and denominator rules must be fixed before reporting. In particular, confirm the contract thresholds used to classify game and slam, treatment of passed-out auctions, and the score perspective/sign convention. IMP conversion is a later enhancement; no implemented or tested IMP conversion was found.

## Open domain decisions

Before Experiment 001 can be implemented, a bridge expert must answer:

1. Is the candidate Flannery opening exactly 2D, and is the opening hand range exactly 11–15 HCP with exactly four spades and five hearts? Are there any exceptions?
2. What Flannery responses are permitted over 2D, and for each response what strength, suit length, fit, and forcing/invitational meaning does it show?
3. What are the complete Flannery opener and responder continuations after each response, including game and slam auctions?
4. How does the Flannery partnership act after interference, doubles/redoubles, as a passed hand, and in different seats or vulnerabilities?
5. What exactly qualifies for a natural 1H opening: minimum/maximum strength, heart length, shape constraints, and exceptions?
6. What are the natural-system responder actions and ranges, including major-fit, spade, notrump, minor-suit, jump, invitational, and game-forcing actions?
7. What are the natural opener's rebids and responder continuations, including game decisions and slam exploration?
8. Which actions are forcing, invitational, sign-offs, or artificial in each system? Which conventions, if any, are included in the comparison?
9. Are the strategy definitions identical for both partners, and what rules govern a player's action when their hand is outside the experiment's named opening type?
10. Which dealer assignments and vulnerabilities are tested: one fixed assignment, a balanced set, or another explicitly defined schedule?
11. Is the candidate population exactly all generated deals whose South hand matches the current Flannery signature, with no responder/opponent constraints? If not, specify every additional filter and its threshold.
12. Should both approaches be evaluated on that same Flannery-signature population, and how should natural 1H hands outside its own opening definition be handled?
13. Do East/West always pass, or which fully specified opponent strategy and version should they use? If opponents are fixed to pass, should they still act on every auction turn?
14. How should competitive auctions, passed-out deals, and any unfinished or invalid strategy auction be treated in the result and statistical denominators?
15. Confirm standard game and slam classification thresholds and whether “reached” means the final contract level/denomination regardless of whether DDS says it makes.
16. What score perspective defines `score_difference` and the A-win/B-win/tie categories? How should pass-outs be scored?
17. Which strategy IDs, names, versions, dataset manifest, and experiment version identify the frozen comparison?

## Repository impact

Only this specification is created in the current task. For a future implementation, likely impact is:

| Area | Existing code to reuse or extend | Future work |
|---|---|---|
| Candidate population and deal identity | `pipeline/deal_prng.py`, `pipeline/1_generate_dds.py`, `pipeline/2_build_olap.py`, `web/src/types/bridge.ts` | Freeze a manifest-backed deal-ID population and implement any expert-approved additional filters. Dealer/vulnerability assignments need an explicit experiment definition. |
| Auction and strategy interface | `pipeline/auction.py`, `pipeline/bidding_strategy.py` | Add Flannery and natural 1H strategies only after their rules are approved; add a runner that repeatedly requests legal calls for all seats without exposing hidden information. |
| Experiment and results | `pipeline/experiment.py`, `pipeline/evaluation.py` | Extend/validate the experiment configuration and paired result schema, including `made_or_down` and a documented score-difference convention. |
| DDS and scoring | `pipeline/dds_engine.py`, `pipeline/duplicate_scoring.py` | Reuse after auction completion; no DDS, RNG, or scoring changes are part of this specification. |
| Aggregation and tests | `pipeline/tests/` | Add focused tests for the agreed system rules, information boundaries, identical-deal pairing, outcome fields, and aggregate denominators. Add an aggregation module only when metric definitions are agreed. |
| Presentation, if required | `web/src/` | Add a results view only after result data and statistical definitions exist; the existing convention pages are not bidding simulators. |

## Validation

This task creates a documentation-only specification. The complete Python test suite, TypeScript type checking, and frontend production build must be run after the document is added. No large DDS simulation is required or permitted for this validation.
