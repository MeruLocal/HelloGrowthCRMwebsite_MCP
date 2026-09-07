### 1 — “hellocrmwebsite CI is broken; blocks pricing PR #1403”
**(a) Established:** All five reported checks failed on #1403 on 9/3. The content-gate tail establishes a Node module-resolution failure—not which module was missing or why. Local TypeScript and seo-guard checks passed in a different execution environment.

**(b) Unsupported:** Repository-wide CI breakage; a shared cause for all five failures; independence from the PR; and an enforced merge block. String-only changes do not exclude content-sensitive failures. Master’s pending runs establish nothing about baseline health. “No checks” on a docs PR is not a passing control.

**(c) Strongest alternative:** A branch-specific missing file, checkout/install problem, or workflow dependency failure; the other jobs may have unrelated causes. Docs-only paths may intentionally skip CI.

**(d) Verdict:** **CONFIRMED** failed checks on this PR. **PLAUSIBLE-VERIFY-PR1403-CI-CAUSE-AND-MERGE-GATE** for the broader claim: inspect complete logs for all five jobs, completed master runs using comparable workflows, and the target branch’s required-check rules/mergeability state.

### 2 — “The MCP mirror serves a fictional INR price ₹1,099”
**(a) Established:** The 9/3 payload advertised `₹1,099/user/month`; the 9/5 response still contained `1,099` somewhere. The cited billing comment and test specify ₹899 plus 18% GST, totaling **₹1,060.82**. The founder decision specifies presentation as ₹899 + 18% GST. ₹1,099 is not that tax calculation.

**(b) Unsupported:** The exact current field and plan containing `1,099`; whether ₹1,099 has ever been a real charge; and production billing behavior inferred solely from a comment and unit test. “Website purge merged as PR #1403 (unmerged, CI-blocked)” is internally contradictory—deployment cannot be inferred.

**(c) Strongest alternative:** The mirror retains an obsolete price or a differently scoped offer; the current occurrence could be explanatory/comparison text. That would not excuse an obsolete current-plan quote, but it would defeat “fictional.”

**(d) Verdict:** **CONFIRMED** discrepancy between the earlier MCP monthly-price text and the cited pricing decision/calculation. **PLAUSIBLE-VERIFY-CURRENT-INR-PLAN-AND-BILLING** for a current false quote: capture the complete live response with plan identity and field context; compare the matching production billing configuration or read-only invoice evidence; verify #1403’s merge and deployment state. Do not call the price “fictional” as an established fact.

### 3 — “No sync command exists; content mirror frozen since 2026-06-17”
**(a) Established:** The inspected header prescribes manual extraction and timestamp updates. No sync command appears in the supplied script inventory or npm scripts. Live integrations metadata reports `synced_at: 2026-06-17` and `total_documented: 630`. Other cited sources report 525 and “259+.”

**(b) Unsupported:** Absence of a sync mechanism everywhere; absence of content changes since June; or equivalence of those three counts. A timestamp is not change history. A grep count is not necessarily a semantic integration count, and “259+” is a lower-bound claim, not an exact total.

**(c) Strongest alternative:** Manual updates occurred without updating metadata; automation lives in workflows or another repository; counts distinguish documented connectors, unique supported integrations, and marketed live integrations.

**(d) Verdict:** **CONFIRMED** manual policy, absent sync entry in the inspected locations, and old advertised sync metadata. **PLAUSIBLE-VERIFY-SYNC-HISTORY-AND-COUNT-SCOPE** for a frozen mirror: inspect repository/workflow references, git history and deployed artifact history for the affected content; enumerate and normalize the counted entities. The numerical evidence alone does not prove count drift.

### 4 — “USD monthly price drift: mirror says $13, canonical is $12”
**(a) Established:** The website source explicitly records a $12 monthly decision and exports `USD_MONTHLY=12`; the 9/2 live MCP payload said `$13/user/month`. This is direct documentary pricing drift.

**(b) Unsupported:** That $12 was actually deployed on the website, charged in production, or remains the live MCP discrepancy today. No USD billing implementation was checked.

**(c) Strongest alternative:** The mirror reflects an older production price while the website source records a newer decision not yet propagated to billing. This changes which surface is operationally current, not the existence of the documented discrepancy.

**(d) Verdict:** **CONFIRMED** MCP-versus-website-source price drift on the cited evidence. **PLAUSIBLE-VERIFY-USD-PRODUCTION-PRICE** only for the stronger billing claim: match plan and billing interval across current MCP output, deployed website, and production USD price configuration. Missing billing evidence does not erase the confirmed source mismatch.

### 5 — “npm package mcp-bot-crawler unpublished; blocks Smithery/Glama/mcp-get/PulseMCP auto-indexing”
**(a) Established:** The exact unscoped npm registry endpoint returned 404 on three dates. `server.json` advertises `mcp-bot-crawler@1.1.0`. The submission report claims publication unlocks four directories.

**(b) Unsupported:** “Never published,” and—more importantly—any mandatory npm dependency or automatic indexing behavior for those directories. The report is the assertion under audit, not independent corroboration. No directory rejection, ingestion log, or vendor requirement is supplied.

**(c) Strongest alternative:** The manifest references an unavailable distribution artifact, while directories can discover or accept the public remote server through other submission paths. A scoped/renamed package would also leave this exact manifest reference wrong without proving the claimed distribution blockade.

**(d) Verdict:** **CONFIRMED** public unavailability of the declared package name at the observed times. **PLAUSIBLE-VERIFY-DIRECTORY-INGESTION-REQUIREMENTS** for the alleged blockade: obtain each directory’s current authoritative requirements and this server’s submission/indexing status, including whether remote HTTP servers require npm. Stop repeating the four-directory dependency as fact.

### 6 — “Submission report is stale and must be refreshed before executing”
**(a) Established:** The report’s “81 total tools” differs from live `/version` reporting 88 total and 12 gated. It predates R1 and omits the two named directories. Its inventory is stale.

**(b) Unsupported:** That its submission instructions are unusable, that R1 invalidated specific claims in the report, or that a full refresh is a prerequisite to every execution step. Directory omissions establish incompleteness only if comprehensive coverage was required. On the supplied chronology, the GitHub MCP Registry omission was not caused by its launching after the report.

**(c) Strongest alternative:** A partly stale but still executable checklist: update tool counts and access descriptions, inspect copy-sensitive steps, and retain valid submission instructions.

**(d) Verdict:** **CONFIRMED** stale tool inventory. **PLAUSIBLE-VERIFY-SUBMISSION-STEP-DEPENDENCIES** for “must refresh before executing”: compare each proposed submission step and required field against current vendor requirements and R1/live server behavior; identify concrete blockers. A blanket execution prerequisite is not established.

### 7 — “Shared MCP_ADMIN_TOKEN is coarse and DB access over-privileged even after gating”
**(a) Established:** Twelve tools share one bearer-token boundary; anonymous discovery exposes 76 tools and no gated names. The supplied implementation evidence says all tools use a service-role key that bypasses RLS. There is no per-caller identity or selective credential revocation. These are real authorization-granularity and least-privilege concerns.

**(b) Unsupported:** Anonymous access to gated tools, an exploitable data leak, arbitrary database querying, or a write capability exposed through public tools. A privileged backend credential does not automatically pass its privileges to callers. Also, anonymous `tools/list` alone would not prove direct-call rejection; the supplied fail-closed implementation evidence matters.

**(c) Strongest alternative:** Deliberate single-operator administration and tightly constrained server-side read queries. That may reduce practical exposure; it does **not** remove the shared revocation domain or the database credential’s RLS bypass.

**(d) Verdict:** **CONFIRMED** coarse shared-token authorization and an RLS-bypassing credential on public-read execution paths. Effective tool gating does not fix database least privilege. Any claim of exploitable disclosure requires **PLAUSIBLE-VERIFY-PUBLIC-QUERY-REACHABILITY**: trace public inputs into queries, enumerate credential-accessible data, and test read-only boundary cases. The prior review and roadmap corroborate an acknowledged requirement, not an exploit.

### 8 — “The 4 protocol warns: /sse naming confusion, tools.listChanged undeclared, no tool title, no outputSchema”
**(a) Established:** The custom audit repeatedly emits the same four warnings and fourteen passes. Tool availability differs by authenticated session but remains static within each session.

**(b) Unsupported:** Treating all four warnings as protocol violations. A route named `/sse` does not establish its transport semantics. Different authorization-specific lists do not themselves require list-change notifications. Missing tool `title` or `outputSchema` is not inherently a protocol violation; these are optional metadata in relevant MCP schemas. Repetition of one checker is not independent validation.

**(c) Strongest alternative:** A conforming server with a legacy route name, session-scoped authorization, no within-session list changes, and optional metadata omitted. The warnings may be interoperability or usability recommendations.

**(d) Verdict:** **CONFIRMED** recurring checker warnings; **UNSUPPORTED** classification of all four as protocol defects. **PLAUSIBLE-VERIFY-WIRE-CONFORMANCE** for any actual defect: inspect the checker predicates, negotiated protocol version, initialization capabilities, HTTP transport behavior, tool schemas, and any emitted list-change notifications against that version’s requirements.

**Overall:** STOP treating F1’s repository-wide breakage/blockade, F2’s “fictional” characterization/current field assumption, F3’s frozen-history claim, F5’s indexing blockade, F6’s blanket execution prerequisite, and F8’s protocol-defect framing as facts; retain the narrower confirmed observations, F4’s source-price drift, and F7’s authorization/least-privilege finding.