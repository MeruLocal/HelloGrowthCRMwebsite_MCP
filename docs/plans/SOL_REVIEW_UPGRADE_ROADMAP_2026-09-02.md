## 1. Top issues, ranked

| Rank | Severity | Issue | Why it matters |
|---|---|---|---|
| 1 | **P0** | The deployment is not actually a clean “public, read-only, authless server.” | The roadmap says 12 write/PII tools are token-gated, while A2 describes gated↔ungated tool-list transitions. Those tools belong in the separate CRM server, not merely behind a bearer token in this deployment. This creates directory-review, security, documentation, and future-regression risk. Also clarify the contradictory phrase “auth gating 76/88 tools.” |
| 2 | **P0** | Security and observability are sequenced after expansion of distribution. | D1–D3 and F2–F3 must precede npm/indexing/directory promotion. Publishing broadly before narrow DB credentials, UGC isolation, abuse controls, and alerting increases blast radius. The recently closed auth hole makes this especially important. |
| 3 | **P0** | F1 violates the product boundary. | `send_feedback` is a public write operation. It makes “read-only” false and creates spam, stored-content, moderation, privacy, and prompt-injection paths. Do not put it on this server. |
| 4 | **P1** | E1 does not define what `search` and `fetch` actually replace. | If the pair is added alongside 88 tools, clients still ingest 90 schemas and the experiment cannot solve tool-selection/context cost. If the pair hides and executes the 88 operations, you lose typed schemas, client approval granularity, and clear audit semantics. |
| 5 | **P1** | B’s canonical-count model is under-specified. | “One number everywhere” is insufficient when integration, connector, app, action, and screen counts may legitimately differ. Without a canonical taxonomy and generated derivatives, drift will return. Weekly cron also conflicts with “marketing and server change in the same release” unless all surfaces publish atomically. |
| 6 | **P1** | D3 overstates what RLS guarantees. | “With RLS it leaks nothing” is not a valid done condition. Incorrect policies, security-definer functions, exposed tables, joins, or RPCs can still leak. Public read paths should use an allowlisted public schema/views plus policy tests, not only a narrower key. |
| 7 | **P1** | Rate limiting is too narrowly specified. | Per-IP limits alone are weak behind proxies, IPv6 rotation, NAT, and distributed traffic. There are no global concurrency, per-tool cost, body-size, timeout, or result-size limits. Supabase exhaustion may occur before an IP threshold helps. |
| 8 | **P1** | The roadmap emphasizes tools but omits MCP resources for a knowledge server. | Product documentation is naturally represented as resources/resource templates, potentially with subscriptions when content changes. Eighty-eight knowledge-oriented tools are likely part of the selection problem. E3 claims prompts/resources as whitespace, but no resources task exists. |
| 9 | **P1** | Distribution identity and supply-chain controls are missing. | `mcp-bot-crawler` is not obviously the official HelloGrowthCRM server package. npm publication creates package-takeover, typo-squatting, secret-in-tarball, lifecycle-script, provenance, and maintainer-account risks. |
| 10 | **P1** | Release and compatibility controls are missing. | No clean-room install test, protocol/client compatibility matrix, canary, rollback, schema compatibility test, endpoint load test, or deployment smoke test is specified. Conformance alone does not cover operational compatibility. |
| 11 | **P2** | A2 may be unnecessary after fixing the architecture. | A public authless deployment with a stable tool set should not change tools based on session authentication. Remove the private tools and only implement `tools.listChanged` if the public list genuinely changes during a live session. |
| 12 | **P2** | Several “done” conditions are not under your control. | “Listed,” third-party listing correction, and directory acceptance depend on external reviewers. Track `submitted`, `accepted`, and `verified live` separately. |

---

## 2. Specific fixes and re-sequencing

### Phase 0 — Re-establish the server boundary

Do this before all other roadmap work.

1. **Remove the 12 write/PII tools from the public deployment and package**, rather than hiding them behind a bearer token.
   - Move implementations and schemas to the separate CRM MCP repo.
   - Add a CI assertion that the public server has:
     - no mutating tools;
     - no tenant/PII tables or RPCs in its allowlist;
     - no bearer-token mode;
     - only `readOnlyHint: true` operations where applicable.
   - Add an invariant test against tool names, annotations, DB dependencies, and output samples.
2. Resolve and document the inventory:
   - Is the public list 76 tools, 88 tools, or 12 tools?
   - Which 12 were gated?
   - Why does A2 say the list changes by authentication state?
3. Remove F1. Use a `mailto:` link or landing-page feedback form outside MCP. If feedback later becomes an MCP capability, put it behind authenticated infrastructure with anti-spam controls and stop calling that endpoint read-only.

### Phase 1 — Security, truth, and operational prerequisites

Run B, D, and the operational parts of F before distribution.

#### Database isolation

Replace D3 with a stricter task:

- Create a dedicated public database role.
- Expose only allowlisted views or RPCs in a dedicated schema.
- Revoke direct access to tenant, PII, secrets, write tables, and generic RPC execution.
- Ensure no public path uses a Supabase service-role credential.
- Add negative tests proving representative tenant IDs, private columns, write operations, and unrestricted filters cannot be accessed.
- Review security-definer functions and search paths.
- Rotate the old credential after migration.

#### UGC and prompt injection

For a product-knowledge server, the preferable answer may be **not to return UGC at all**.

- Inventory each content source and classify it as editorial, third-party, scraped, or UGC.
- Exclude form submissions, comments, tickets, and other untrusted content unless there is a concrete product requirement.
- If included, return it in explicitly labelled structured fields; do not rely only on a prose “ignore instructions” wrapper.
- Strip active markup, bound content size, preserve provenance, and avoid combining trusted instructions with untrusted text.
- Add adversarial output tests containing instruction-like content and secret-exfiltration requests.

#### Abuse controls

Expand D2 to cover:

- trusted-proxy configuration and correct client-IP extraction;
- per-IP and global request/concurrency limits;
- stricter limits for expensive search/query tools;
- request-body, query-complexity, output-size, timeout, and pagination bounds;
- `429` with `Retry-After`;
- bounded Supabase query execution;
- IPv6/NAT behavior;
- fail-safe behavior if the rate-limit store is unavailable;
- load testing against expected directory-driven traffic.

Also add HTTP protections appropriate to the transport: origin validation where relevant, CORS policy, TLS/redirect tests, and DNS-rebinding/host validation.

#### Observability

Move F2 and F3 into this phase:

- errors, latency, rate-limit events, Supabase saturation, and content-sync failures;
- synthetic MCP initialize/list/call checks, not just `/health`;
- redaction and retention policies for IPs, prompts, arguments, and outputs;
- alert ownership and a tested escalation path.

A dashboard that nobody is alerted from is not a release gate.

### Phase 2 — Truth pipeline

B should define a data contract, not just count reconciliation.

1. Define canonical entities and terms:
   - integration;
   - connector/app;
   - action;
   - feature;
   - screen;
   - public versus internal availability.
2. Generate all numeric claims from the same versioned snapshot.
3. Store:
   - snapshot/version ID;
   - source revision;
   - generated timestamp;
   - successful publication timestamp;
   - row counts and validation results.
4. Publish server content and website-derived claims atomically or from the same snapshot. A partial website/server update should fail closed.
5. Keep the last known-good snapshot when regeneration fails.
6. Separate health concepts:
   - `/health/live`: process is alive;
   - `/health/ready`: dependencies are usable;
   - content freshness field/status.
   
Do not make stale editorial content trigger restart loops or cause a connector to consider the endpoint unavailable. The audit can still fail after seven days.

For B4, replace “grep clean” with tests distinguishing:

- valid empty result;
- upstream/query failure;
- timeout;
- malformed source data.

### Phase 3 — Protocol quality and compatibility

Then execute A, with these changes:

- **A1:** Fine.
- **A2:** Reassess after private tools are removed. Declare the capability only if actual runtime list-change notifications are needed and tested across supported clients.
- **A3:** Validate outputs at runtime against `outputSchema`; do not merely declare schemas. Preserve compatibility for clients expecting textual `content`, while adding structured results where supported.
- **A4:** Prefer `/mcp` as the canonical path and keep `/sse` as a tested compatibility alias. Document transport behavior without implying `/sse` is an SSE transport if it is not.
- **A5:** Add client-level smoke tests for Claude, Cursor, VS Code, Codex, and one generic MCP inspector. Conformance is necessary but insufficient.

Add checks for:

- capability negotiation and supported protocol versions;
- pagination/cursors for large lists;
- stable identifiers;
- machine-readable error codes versus empty results;
- timeouts/cancellation;
- schema backward compatibility;
- maximum response size;
- clean initialization and stateless/session behavior.

### Phase 4 — E1 experiment

Run E1 after the public inventory is clean and before distribution UX is finalized.

The experiment must compare distinct architectures:

1. **Baseline:** current public tools only.
2. **Curated baseline:** prune/consolidate redundant tools.
3. **Meta-tool design:** expose only the search/fetch pair, not pair-plus-88.
4. Optionally, **resource-based design:** resources/resource templates for documentation plus a small number of query tools.

Define semantics explicitly:

- `search`: discovers relevant product documents, capabilities, or operations.
- `fetch`: retrieves a selected document/capability by stable ID.
- If either tool executes hidden operations, rename it and treat that as a separate architecture; “fetch” should not secretly perform arbitrary operations.

Measure:

- end-to-end task success, not just correct tool selection;
- unsupported-task refusal;
- schema/argument correctness;
- token cost;
- call count;
- latency;
- search recall and ranking;
- zero-result behavior;
- ambiguous query behavior;
- model and client versions;
- repeated-run variance;
- held-out tasks not used to tune descriptions.

Use a task set representing actual public product-knowledge questions. Include exact lookup, comparison, integration discovery, feature availability, ambiguous terminology, stale/unsupported claims, and prompt-injected source content.

Set shipping thresholds in advance, for example:

- no statistically meaningful regression in task success;
- material token reduction;
- acceptable p95 latency;
- no loss of source provenance;
- no weakening of typed validation or user approval boundaries.

Do not dynamically reveal dozens of tools via `tools.listChanged` unless target clients are proven to handle that pattern reliably.

### Phase 5 — Distribution

Only begin after Phases 0–3 are green. E1 does not necessarily need to ship first, but its result may change package snippets and server identity.

#### npm

Before C1:

- Decide whether this package is:
  - a local stdio server;
  - a remote-server launcher;
  - a crawler/library;
  - or an installer.
  
Do not publish an ambiguously named crawler as though it were the official server.

Required controls:

- Prefer a scoped, product-identifying package name.
- npm trusted publishing/provenance.
- Mandatory maintainer 2FA and at least two recoverable owners.
- Minimal `files` allowlist.
- Inspect `npm pack` output for source maps, `.env`, fixtures, logs, credentials, and internal docs.
- Avoid install lifecycle scripts where possible.
- Pin supported Node versions.
- License, repository, support, and security-policy metadata.
- Clean-room `npm install`/`npx` tests on supported platforms.
- Dependency audit and lockfile policy.
- Test package version, server version, and registry metadata consistency.
- Document ownership/recovery if the package or DNS account is compromised.

“Npm before registry” is acceptable only after the registry metadata is validated in staging and package identity is finalized.

#### Official registry

- Confirm the exact namespace and `mcp-name` requirements against the current registry schema.
- Treat domain/DNS ownership as a long-lived security dependency.
- Ensure the registered endpoint is the public-only deployment.
- Define who controls DNS, npm, registry credentials, and recovery.
- Test version-update and rollback procedures before first publication.
- Ensure metadata does not imply CRM-data access, writes, or authentication.
- Track “published,” “validated,” and “discoverable” separately.

#### Claude Connectors Directory

Submit only after:

- the endpoint exposes no hidden authenticated/private mode;
- privacy policy accurately covers logs, IPs, tool arguments, outputs, retention, and subprocessors;
- support contact is monitored;
- rate limits and expected failure behavior are documented;
- icon and permanent slug are final;
- redirects, TLS, transport initialization, schemas, and response sizes pass the test matrix;
- prompt-injection handling and source provenance are tested.

Directory approval latency is not a one-week engineering deliverable. Make `submitted` the roadmap result and treat acceptance as external lead time.

#### Install snippets

Generate snippets from tested templates rather than maintaining them manually. CI should verify:

- exact endpoint;
- transport;
- package/version if applicable;
- quoting on macOS/Linux/Windows;
- no obsolete auth instructions;
- current client syntax;
- CSP changes.

The landing page must remain gated on actual deployment and clean-room verification.

#### Third-party listings

For C5, use:

- correction submitted;
- correction accepted;
- live listing verified;
- periodic recheck.

Do not make roadmap completion depend solely on a third party.

---

## 3. What to cut or defer

Given 1–2 part-time engineers:

### Cut

- **F1 `send_feedback` tool:** incompatible with read-only scope.
- **A2**, unless the clean public deployment genuinely has runtime tool-list changes.
- Any UGC-bearing tool without a demonstrated product requirement.
- “One-click install” variants that cannot be continuously tested; start with the top two clients plus generic config.

### Defer until after secure distribution

- **E2 `get_integration_rules`:** useful only after B establishes canonical, fresh rules and provenance.
- **E3 prompts:** cheap to implement but not a launch prerequisite. Client support and actual usage should determine whether this is differentiation or inventory noise.
- Broad top-20-plus-rest output-schema rollout: complete the highest-traffic tools, validate them properly, and schedule the remainder incrementally.
- Secondary directories beyond the official registry and Claude.
- “Best-in-class” differentiation work until telemetry shows actual usage patterns.

### Add now despite scope pressure

These are higher priority than E2/E3:

1. Removal of private/write tools from the public artifact.
2. Public DB schema/role isolation.
3. Resources/resource-template architecture spike.
4. Synthetic monitoring and alerting.
5. Package provenance and clean-room publication checks.
6. Release rollback and compatibility matrix.
7. Canonical content taxonomy and atomic snapshot publication.

### Realistic sequence for the small team

1. Boundary cleanup and invariant tests.
2. DB isolation, UGC removal, abuse controls, telemetry.
3. Truth pipeline and freshness semantics.
4. Protocol conformance and client smoke tests.
5. E1 offline experiment.
6. npm/registry publication.
7. Claude submission and limited landing-page installs.
8. E2/E3 only after usage data.

The stated estimates are optimistic: B and C are each likely multi-week elapsed work for part-time staff once taxonomy decisions, external reviews, clean-room testing, and operational hardening are included.

## 4. One-line verdict

**Do not distribute this more broadly until the 12 private/write tools are removed from the public artifact and security/observability move ahead of C; E1 is worthwhile only as a true replacement/pruning experiment, not two additional tools layered onto 88.**
