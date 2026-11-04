# Deploy note: plan limits read the Product Truth pin (PLAN-HELLOG-0011, PR-B)

- Changed: `pricing_get_plans` (+ `limits_detail`, `limits_source`, `withheld`), `pricing_get_faq`, `pricing_compare_plans`, `faqs_get_site`, `switch_get_guide`, `features_list`, `features_get`. Free leads is 150 everywhere (was 200 in `faqs_get_site` and `switch_get_guide`); Task Boards on Free is 100 tasks (was 500).
- Named compatibility exception: for backed keys only, `limits.leads|tasks|accounts` is `null` when the fact is withheld, stale or unknown. Public deploy is still blocked by the PLAN-HELLOG-0003 gate G1-G5.
- Deploy: build and release as usual. No env var, no migration.
- Verify: `pricing_get_plans {"plan":"free"}` shows `limits.leads` 150 and `limits_source.truth_version` `2026-11-04.e0abe141d720`; `faqs_get_site {"search":"really free"}` says 150.
- Past `valid_until` (2026-11-18) every backed limit is served as the withheld sentence, never a stale number. Refresh per the PR-A note.
- Rollback: redeploy the previous release (it serves the old, wrong 200).
