# Deploy note: Product Truth pin (PLAN-HELLOG-0011, PR-A)

- Changed: new pin, generator, reader, ratchet, `/health` `product_truth` block. No tool response changes. Public deploy is still blocked by the PLAN-HELLOG-0003 gate G1-G5.
- Deploy: build and release as usual. No env var, no migration.
- Verify: `GET /health` shows `product_truth.truth_version` `2026-11-04.e0abe141d720`, `integrity_ok: true`.
- Refresh (at least weekly, within two business days of a limit change, before `valid_until` 2026-11-18): regenerate the export in hellocrm, replace the version directory under `test-data/product-truth/`, update `FLOOR` only by a reviewed change, run `npm run build:product-truth && npm run check:truth`, open a PR listing changed fact ids with the registry owner's attestation of current enforcement.
- Missed refresh: `/health` degrades (HTTP stays 200); facts that later read the pin are withheld. Re-pin, or accept withheld answers.
- Withdrawal: registry revert, new pin, redeploy. Not faster. Who may authorise an emergency deploy under G1-G5, and the hosting platform, are still to be named before BUILD acceptance (plan binding item 5).
- Rollback: redeploy the previous release; its older pin is bounded by its own `valid_until`. FLOOR guards a forward re-pin only.
- Note: the pin was generated from the unmerged hellocrm PR #10347 (no `dist/` is committed there); re-pin after it merges.
