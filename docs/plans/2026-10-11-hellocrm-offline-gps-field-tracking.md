# Plan: Offline GPS & field tracking for hellocrm

Written 11 October 2026 against `MeruLocal/hellocrm` @ `973af350` (shallow clone, `master`). Follows `docs/DEV_PLAN_TEMPLATE.md` in that repo. Findings are from reading code only. Nothing was run, built or deployed.

## 0. Header

```
Owner:            Rushabh Shah (founder sign-off needed for Phase 2/3 scope)
Reviewer:         Harnish Shah; rls-tenant-reviewer agent for every migration
Target date:      Phase 1 by 2026-11-06; Phase 2 decision gate 2026-11-13
Region(s):        India first; DPDP applies. SEA/AU/UAE/US need a consent review before enabling
Vertical(s):      Field-force verticals (pharma field force, real estate site visits, insurance, FMCG). Gated by existing Field Operations flag
Feature flag:     NEW `field_gps_trail` (Phase 2+). Phase 1 rides existing `field_visits` module gate
Keystone PR:      none yet
CLAUDE.md refs:   s6 (security/migrations), s10 (PR discipline), s15 (verticals), s16 (features.yaml)
Plan tier:        L (Phase 1 is M; Phases 2-3 are migration- and native-heavy)
```

## 1. Overlap check: NOT RUN

The template requires `gh pr list` searches. `gh` was blocked in this session (GraphQL returns 403). Before any code, run them via REST or the GitHub MCP. Keywords: `offline`, `geolocation`, `gps`, `field visit`, `background location`, `attendance`. Verdict: **unknown**.

## 2. What exists today (verified by reading)

| Area | Finding | Source |
|---|---|---|
| App shell | Capacitor 8 on Android and iOS; PWA via `vite-plugin-pwa` | `capacitor.config.ts`, `vite.config.ts:191` |
| GPS capture | One-shot only: `Geolocation.getCurrentPosition` (native) or `navigator.geolocation` (web) | `src/hooks/useGeolocation.ts` |
| Permissions | Android: fine and coarse only. iOS: `NSLocationWhenInUse` only. **No background location, no foreground service** | `AndroidManifest.xml:103`, `Info.plist:82` |
| Field visits | `field_visits` has check-in and check-out lat/lng only. **No trail, accuracy, device or mock-flag column** | `20260406093109_*.sql` |
| Offline queue | IndexedDB queue for *new* visit inserts (`insertOrQueueVisit`), dead-letter store, 6-attempt limit | `src/hooks/useOfflineQueue.ts` |
| Offline check-out | Check-out goes through `updateVisit.mutateAsync`, with no offline path in the code I read. **Needs confirming** | `FieldVisitActionPanel.tsx` |
| Offline app load | Service worker precaches only `index-*.js`, CSS and fonts. JS chunks are `NetworkOnly`. `navigateFallback: null`. A cold start offline fails on web/PWA | `vite.config.ts:250-310` |
| Android live-URL mode | If built with `CAP_LIVE_URL`, the shell loads the remote site and shows `offline.html` when offline. **Field reps cannot open the app offline in that build** | `capacitor.config.ts` |
| Attendance | `attendance_records.source` is `manual / regularized / import`. No GPS or geofence source | `20260705000210_*.sql:32` |
| Edge functions | Budget is spent: 457 directories vs hard cap 456. **Any new edge function fails `check:functions`** | `scripts/check-function-count.mjs` |

## 3. Premise correction

"Track a device offline" is two different problems. Do not build them as one.

1. **Capture while offline.** GPS works with no internet. The gap is that *our app* cannot start offline and cannot queue check-outs or location points. This is cheap, low-risk and what reps hit today. **Phase 1.**
2. **Continuous background trail** (route, distance, "where is my rep now"). This needs a native background-location plugin, a foreground service, store-policy declarations and employee-monitoring consent. It is a separate product decision. **Phases 2-3.**

The pasted Google Find Hub material is about locating a lost personal phone. It is irrelevant here. Do not use it as a source for the feature.

## 4. Phased plan

### Phase 1: Offline-safe check-in/out (no new permissions)

Goal: a rep in a basement or dead zone can open the app, check in, check out, and nothing is lost.

| PR | Change |
|---|---|
| 1a | Extend `useOfflineQueue` with a `field_visit_updates` store (check-out, notes, photos metadata). Idempotency key per action. Reuse the dead-letter pattern. |
| 1b | Stamp `captured_at` (device clock) and `accuracy` on every queued action. Server stamps `synced_at`. Add the columns via one migration. |
| 1c | Offline app load: a bundled-mode Android and iOS build must be the field-rep default. Add an app-shell precache for the visit screens, and stop the live-URL build from being offered to field-force tenants. |
| 1d | UI: "Saved offline, N pending" indicator on the visit card. Never show a visit as synced until it is. |
| 1e | Tests: queue replay order, duplicate replay (23505), clock-skew handling, dead-letter retention. |

Reuse (no new tables, no new edge functions): `field_visits`, `useOfflineQueue`, `fieldVisitCheckGuards.ts`, `OfflineBanner`.

Open design point: the early-check-in guard compares against `Date.now()`. Offline, the device clock is the only clock, so a wrong clock can pass or fail the guard. Store both the claimed time and a server-assessed skew on sync. Flag skew over 5 minutes for the manager instead of rejecting.

### Phase 2: Foreground trail during an active visit or shift

Foreground-only (`watchPosition` while the app is open), so no store-policy escalation.

- New table `field_location_points` (`tenant_id`, `employee_id`, `visit_id` nullable, `lat`, `lng`, `accuracy_m`, `captured_at`, `source`, `is_mock` nullable). Batch inserts via PostgREST. **RLS written and reviewed per CLAUDE.md s6.** Reps see their own rows; managers see their reports'. Retention job (default 90 days) via existing cron patterns.
- Client buffer in IndexedDB, flushed in batches of about 50. Adaptive interval: 30 s moving, 5 min stationary.
- Add `gps` to the `attendance_records.source` CHECK only if geofenced attendance is wanted (founder call).
- Manager view: extend `FieldVisitMap` with a per-rep trail. Keep the India-boundary tile rule already enforced there.

### Phase 3: True background tracking (go/no-go gate, 2026-11-13)

Only if customers demonstrably need route data when the app is closed.

- Plugin choice: a maintained Capacitor background-geolocation plugin (candidate: `@capacitor-community/background-geolocation`). **Not yet evaluated for Capacitor 8 compatibility, licence or maintenance. Verify first.**
- Android: `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE_LOCATION`, a persistent notification, and a **Play Console background-location declaration with a demo video**. Expect review delay.
- iOS: "Always" permission and an App Store justification. iOS shows the user a periodic prompt. The live-URL shell is already barred on iOS.
- Battery: budget it, and publish the cost to reps in the consent screen.
- Server-side: dedupe and sort points on `captured_at`. Reject physically impossible jumps (speed over 200 km/h) by flagging, not deleting.

## 5. Risks and second-order consequences

1. **Employee-monitoring consent (DPDP).** Continuous location is personal data of the rep. Needs purpose limitation, a written consent record, work-hours-only collection, a visible "tracking on" indicator, and a retention limit. Add it to `DPDP_COMPLIANCE_REGISTER.md`. This is a blocker for Phase 2, not a polish item. Also a labour-relations issue: tenants' reps may object, so ship it tenant-opt-in with a rep-visible audit.
2. **Spoofing.** Client-supplied coordinates are trivially fakeable. The manifest already notes "location-spoofing" as a concern. Record `is_mock` where the platform exposes it (**unverified** for the current Capacitor plugin), and add server-side plausibility checks. Do not market it as tamper-proof.
3. **Clock trust.** Offline timestamps are device-supplied. Address in Phase 1 as above.
4. **Edge function cap.** Everything here must use PostgREST and RPC. If an edge function is unavoidable, consolidate an existing one first.
5. **Storage growth.** At 30 s intervals, 8 hours per rep per day is 960 points per rep per day. For 500 reps, that is about 14 M rows per month. Partition by month, index `(tenant_id, employee_id, captured_at)`, enforce retention.
6. **iOS WebView limits.** IndexedDB data can be evicted under storage pressure. For Phase 3, buffer in native storage, not the WebView.
7. **Positioning.** Do not describe HelloGrowthCRM as "just a WhatsApp CRM" in any copy for this feature. It is one capability in a broader suite.

## 6. Verification (per CLAUDE.md s10)

`npm run verify`, plus `check:rls`, `check:migrations`, `check:functions`, `check:features`. Register `field_gps_trail` in `features.yaml` with a `smoke_manual` script. Manual device test matrix: Android bundled build, Android live-URL build, iOS, PWA. Run each in airplane mode, in a lift, and after a forced app kill.

## 7. Decisions needed from you

1. Is Phase 3 (background tracking) in scope this quarter, or do we stop after Phase 2?
2. Which verticals first? Pharma field force and real estate site visits already have modules.
3. Is geofenced attendance wanted? It changes the attendance CHECK constraint and its payroll implications.
4. Tenant-opt-in only, or on by default for the Field Operations module?

## 8. Next steps

1. Run the overlap check (section 1) and confirm the offline check-out gap by reading `useUpdateVisit`.
2. Confirm whether field-force tenants are on the bundled or the live-URL Android build.
3. Draft the Phase 1 keystone PR (1a + 1b) against `master`, using `--base master`.
4. Start the DPDP consent write-up in parallel, since it gates Phase 2.
