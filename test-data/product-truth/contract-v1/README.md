# Contract v1 fixtures

Everything here is SYNTHETIC. No id, value or claim is product truth.

| Set | Files | Validator | Expected |
|---|---|---|---|
| `private/` | the registry in its source layout (YAML) | `loadRegistry` + `truth.private.schema.json` + `runRules` | loads, validates, no rule fires |
| `valid-public/` | `truth.<surface>.json`, `index.json`, `evaluation.json` generated from `private/` at 2026-11-04T10:00:00Z | `truth.public.schema.json`, `index.schema.json`, `evaluation.schema.json` | all valid; regenerating from `private/` gives identical bytes |
| `invalid/` | `*.truth.website.json` | `truth.public.schema.json` | each REJECTED |
| `invalid/` | `report-has-verified-on.evaluation.json` | `evaluation.schema.json` | REJECTED |

Invalid cases: unknown major `schema_version`; a withheld reason outside the closed list; a float value; a
private-only field (`owner`) in a public record; a lifecycle outside the closed list; a report key named `verified_on`.

`SHA256SUMS` pins every file. Regenerate `valid-public/` only with a deliberate contract change, then refresh the sums:
`cd product-truth/fixtures/contract-v1 && find . -type f ! -name SHA256SUMS | sort | xargs sha256sum > SHA256SUMS`.
Readers (website, MCP, app) may copy this directory to test their own parsers.
