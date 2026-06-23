---
name: browser-e2e-product-review
description: Browser-driven TradingFlow webapp product E2E walkthrough runbook. Uses the Browser plugin to manually exercise real user journeys, find UI defects, and produce PM/trader UX findings without running repository Playwright scripts.
disable-model-invocation: true
---

# Browser E2E Product Review (Webapp Fullstack)

Use this runbook when the user asks an AI agent to use `@Browser` / `plugin://browser@openai-bundled` to walk the TradingFlow webapp like a real user, find UI errors, and judge product UX from a product manager and option trader perspective.

This runbook is intentionally **browser-first**. Do not run the repository Playwright E2E suite as the review mechanism. Use existing E2E specs and automation docs as read-only journey maps, then execute the journeys interactively with the Browser plugin.

## Recommended Invocation

Use `/goal` for a full review:

- Objective: run a Browser-driven product E2E walkthrough for the requested TradingFlow webapp surface, finding UI defects and PM/trader UX issues without executing repository E2E scripts.
- Success criteria: Browser plugin is used for walkthroughs, required product/domain context is read, scoped journeys are exercised for the relevant personas and viewports, registration is tested with a real disposable email plus OTP when auth/signup is in scope, premium guards are checked across the required account states when access is in scope, Option Trades saved filters are checked with create/rename/use/persistence/delete coverage when Option Trades filters are in scope, explicitly authorized payment-capability tests prove through Browser that a user can start from the app, make a test payment, add a payment method, change payment method or billing/payment status through the user-facing flow, cancel or schedule cancellation where the UI permits it, return to the app, and see the correct billing/access result. The report must frame these as user capabilities, not as "Stripe status mutation" tests. No payment capability or payment-status change is marked passed from SDK-only mutation. Any Stripe SDK fixture mutations are restored to the original seeded state, findings use the required output tables, and this runbook is maintained if reusable friction is discovered.
- Stop condition: scoped journeys are complete, a real browser/auth/data/local-env blocker is documented with evidence, or the user redirects scope.

Pasteable objective:

```text
Use ops/webappp-fullstack/browser-e2e-product-review.md as the runbook. Use @Browser / plugin://browser@openai-bundled to walk the requested TradingFlow webapp journeys in the browser. Do not run repository Playwright E2E scripts. Use existing E2E specs only as read-only journey maps. When auth or registration is in scope, test a real create-account flow with a unique disposable email alias, retrieve the OTP through an approved Gmail path, and verify the new signed-in account state. When auth, billing, paid controls, or premium data are in scope, test the premium guard with guest, active, canceled, trial_no_pm, and trial_with_pm accounts. When Option Trades filter behavior is in scope, include the saved-filter lifecycle: create from an edited draft, rename, duplicate or set-default when available, use/apply, reload and account-switch persistence, cross Live/Historical sharing, delete cleanup, and gated behavior for guest/canceled accounts. When payment, add-card, change-card, cancellation, or billing-access behavior is explicitly in scope, run a Browser payment-capability review: prove whether the user can perform the app -> Stripe-hosted UI -> app-return journey and see the correct billing/access result. Do not scope or summarize the review as testing Stripe mutation. Use Stripe SDK/API mutation only to create preconditions, verify canonical state, force terminal states that the UI cannot directly create, or restore fixtures. Produce UI defect findings, ProductReviewFinding rows, ElementActionMatrix, RegistrationFlowMatrix when applicable, AccessTierGuardMatrix, SavedFilterLifecycleMatrix when applicable, BillingLifecycleMatrix when applicable, TraderScorecard, BrowserJourneyCoverage, evidence index, blockers, and runbook maintenance note.
```

## Agent Handoff

Last updated: 2026-06-23

2026-06-23 maintenance-only note: the durable procedure now requires explicit Option Trades saved-filter lifecycle coverage and a `SavedFilterLifecycleMatrix` when Option Trades filters are in scope. No Browser run was executed for this runbook edit.

2026-06-23 registration retry continuation note: from guest `/app/option-trades/live`, Browser opened the app `Sign in` modal, switched to `Create an account`, filled the fresh disposable Gmail alias `evanzhousyforward+0623codex6919@gmail.com`, and clicked `Continue`. The modal stayed in create-account mode and surfaced `Request timed out. Please try again.`; no OTP / verification-code screen appeared, the user remained signed out, and console logs again showed Cloudflare Turnstile challenge-frame messages plus `[observability:development][P0] LoginModal Auth: Request timed out. Please try again. Object`. The DOM included hidden `cf-turnstile-response` with an empty value, but no visible CAPTCHA was presented for Browser or the user to solve. Gmail connector search for the exact alias with `in:anywhere newer_than:1d "evanzhousyforward+0623codex6919@gmail.com"` returned no messages; a broader recent Clerk/TradingFlow/verification search did not find a relevant verification email. Treat manual Browser registration and new-account lifecycle as blocked before OTP by Clerk/Turnstile in the current environment. Do not mark registration, OTP retrieval, onboarding, billing lifecycle for a new account, or new-account premium guard complete from this run.

2026-06-23 trial/no-payment continuation note: seeded login for `trialing+clerk_test@example.com` succeeded through the Browser OTP flow with `424242`, and the user menu proved `SIGNED IN AS TRIALING+CLERK_TEST@EXAMPLE.COM`. `/app/billing` showed `TRIAL EXPIRES IN 5 DAYS`, `ADD PAYMENT METHOD`, payment-method-needed copy, `Premium Plan`, and enabled `Manage Subscription`, `Manage Payment Methods`, `View Billing History`, and `View Plans`; this pass did not open Stripe-hosted portal buttons or mutate billing state. `/app/option-trades/historical` showed the same trial banner plus unlocked premium controls, no upgrade/paywall copy, and the account's saved chips `Size: >= 1000` and `Open Interest: >= 100000`; sampled rows satisfied those numeric ranges. Opening `Filters, Default` rendered the real filter dialog with saved `Size` minimum `1000`, saved `Open Interest` minimum `100000`, reset/apply/close controls, and no upgrade copy, then closed cleanly without applying changes. The native `Lookback window` select changed from `latest_day` to `past_3_days`, updated the visible date range from `2026-06-22` to `2026-06-20 - 2026-06-22`, and showed no paywall copy; restoring `latest_day` settled back to `DATE RANGE: 2026-06-22`, `Page 1 of 4`, and the same saved Size/OI chips. Count this as current positive trial_no_pm premium-access proof, with billing still correctly asking for a payment method. No repo E2E script, payment portal, payment-method save, subscription change, Stripe SDK/API mutation, AI prompt submit, or account-data mutation was executed.

2026-06-23 trial-with-payment drift continuation note: after signing out of the trial/no-payment user, Browser seeded login for `trialingwithpayment+clerk_test@example.com` succeeded through the email/OTP flow with `424242`; the user menu proved `SIGNED IN AS TRIALINGWITHPAYMENT+CLERK_TEST@EXAMPLE.COM`. The fixture is still not in the expected trial-with-payment state: `/app/option-trades/live` immediately showed `SUBSCRIPTION CANCELED`, `Premium required`, and `REACTIVATE SUBSCRIPTION`, while `/app/billing` settled to `SUBSCRIPTION CANCELED`, `REACTIVATE SUBSCRIPTION`, and `VIEW BILLING HISTORY` with no `TRIAL EXPIRES`, no payment-method-confirmed copy, no `Manage Payment Methods`, and no `Add Payment Method`. Treat this as current trial_with_pm fixture drift/blocker, not valid trial-with-payment premium-access coverage. No Stripe portal route, reactivation, payment-method save, subscription change, Stripe SDK/API mutation, AI prompt submit, or account-data mutation was executed.

2026-06-23 saved-filter CRUD/persistence continuation note: after switching from the canceled trial-with-payment fixture to `active+clerk_test@example.com`, Browser tested saved-filter manager behavior with reversible temporary copies. Baseline `/app/option-trades/historical` was `DEFAULT`, no applied chips, `DATE RANGE: 2026-06-22`, and broad high-premium SPX rows. The saved-filter dialog already contained `Default` plus a pre-existing `New Saved Filter Set`; clicking `Create from Current View` did not add a visible new saved-set row and showed no toast/error, so treat create as a visible no-op when that pre-existing generic set is present. Duplicating `Default` worked and created `Default Copy`. Rename did not work: clicking `Rename saved filter set` for `Default Copy` before and after selecting the row produced no input, rename dialog, toast, or name change. Setting `Default Copy` as the default worked, and restoring the default marker to `Default` also worked; note that using `Default` can make it `IN USE` while the disabled default-marker still remains on `Default Copy` until the star/default action is clicked back on `Default`. Applying `Size >= 3000` to `Default Copy` worked: the toolbar changed to `DEFAULT COPY`, chip `Size: >= 3000` appeared, page count dropped to `Page 1 of 31`, and sampled Historical rows all had size `>= 3000`. Reload preserved `DEFAULT COPY`, the chip, and matching rows. Cross-surface sharing also worked: `/app/option-trades/live` showed `DEFAULT COPY`, chip `Size: >= 3000`, and sampled Live rows all had size `>= 3000`. Switching back to `Default` through the `Use` action removed chips and broadened rows, but the filter dialog stayed mounted after the switch. Account-switch persistence is mixed: after a second `Default Copy` with `Size >= 4000` was applied, signing out and signing back into the same active account reset the active toolbar to `DEFAULT` with no chips and broad rows, but the `Default Copy` saved set still existed and retained saved `Size` minimum `4000`. Delete cleanup worked for both temporary `Default Copy` sets and final Browser state was `/app/option-trades/live`, active account, `DEFAULT`, no chips, no dialog, and no `Default Copy`; the pre-existing generic `New Saved Filter Set` was left untouched. New accessibility/product findings: delete icons are unlabeled icon buttons, rename is a silent no-op, create-from-current is a silent no-op in the observed state, and saved-set active selection does not persist across sign-out/sign-in even though set contents persist. No repo E2E script, payment portal, Stripe/Neon mutation, AI prompt submit, or non-temporary saved-set deletion was executed.

2026-06-23 canceled Historical guard continuation note: with the current Browser session on `canceled+clerk_test` subscription state, `/app/option-trades/historical` showed `SUBSCRIPTION CANCELED` plus `START HERE The default preview is open to everyone. Upgrade to change filters, sorting, pagination, and live mode beyond that preview.` Browser verified that `Default` filters, `Columns`, `Export`, `Explain`, the `Lookback window` select, and the rows-per-page select open the upgrade pricing modal and do not change the sampled preview rows, current `latest_day` lookback, sort state, or trigger a CSV download. The pricing modal remains hard to dismiss in this build: `Close`, `Cancel`, and `Escape` were unreliable enough that the route had to be reloaded between checks. The symbol/search control is not immediately gated; it opens the full `Search Symbols & Watchlists` drawer for the canceled user. Clicking drawer `Filter by this watchlist` then opens the upgrade modal on top of that drawer and leaves rows unchanged, so access is blocked but with nested-modal UX. The table has a persistent `Loading table data` layer while preview rows and enabled sort/watchlist buttons are visible underneath. Because of that overlay and the sticky footer, enabled DOM buttons are not necessarily actionable: at the `Premium` header center, `elementFromPoint` returned the footer language button before scrolling and the loading layer after scrolling; visible row watchlist buttons also resolved to the loading layer. Treat Historical canceled sorting and row watchlist feedback as still defective: the app exposes enabled controls but the user gets no clear upgrade feedback from those covered table actions. Score remained a static non-sortable header. No repo E2E script, billing portal, payment, Stripe/Neon mutation, or AI prompt submit was executed.

2026-06-23 Cookbooks continuation note: with the active session on `/app/cookbooks`, Browser verified the dated snapshot gallery contract from `doc/automation/cookbooks/SKILL.md`: source says reports are frozen JSON under `public/cookbook-snapshots/` with no live ClickHouse or LLM at view time, and `src/lib/cookbook-snapshots/load.ts` fetches `/cookbook-snapshots/index.json` plus `/<date>/<slug>.json`. Browser opened `Daily Market Recap` at `/app/cookbooks/market-recap~2026-06-18`; the report rendered the expected dated title, KPI cards, TOC, charts/tables, `AI READ` / `AI SYNTHESIS` blocks, terminal thesis, and disclaimer. The TOC `Takeaways` anchor updated the URL hash, and the report `Back` button returned to `/app/cookbooks`. The date picker exposed generated dates only; selecting `Jun 17, 2026` changed visible snapshot links to `~2026-06-17` reports, then restoring `Jun 18, 2026` returned six `~2026-06-18` links. Current app state is English `/app/cookbooks` with `Jun 18, 2026` selected. Open product findings from this pass: the active dev/test build exposes mutation-capable `NEW RECIPE`, private draft `OPEN` `/edit` links, draft delete buttons, report-level `EDIT WITH AI`, and global `RECIPE AI` despite the cookbook automation contract saying runtime LLM assistants are disabled/no role; these were treated as mutation-risk and not clicked except `RECIPE AI`, which opened a real `Recipe coding agent` dialog with starter prompts and enabled `Submit` and was closed without submitting. Locale check showed the Chinese report renders localized headings/prose, but chart/table labels still leak English (`Most option premium`, `Bullish`, `Mixed`, `Bearish`, `rows`) and the sentiment-composition chart rendered `undefined undefined undefined`; console also logged missing translations for `recipeAgent.*`, `assistant.*`, `layout.*`, and `pages.cookbooks.meta.*`. Browser page-assets did not expose static JSON/network entries, and guarded `performance` resource reads were unavailable, so do not mark the "no runtime query" network proof complete without a future Network-capable Browser/Chrome check.

2026-06-23 mobile Cookbooks continuation note: Browser set the viewport to `390x844` and verified `/app/cookbooks` reported `innerWidth=390`, `innerHeight=844`, and no page-level horizontal overflow. The mobile gallery kept the date picker usable; `Jun 18, 2026` still exposed six `~2026-06-18` snapshot links, while mutation-risk `New recipe`, draft `/edit` links, draft delete buttons, and `Recipe AI` remained visible and were not clicked. Clicking the dated `/app/cookbooks/market-recap~2026-06-18` link opened `Daily Market Recap · Jun 18, 2026`, but because the clicked link was far down the gallery, the report initially landed mid-report with the title and `Back` / `Edit with AI` controls above the viewport. A normal upward scroll recovered the report header, so file this as a mobile route-scroll-position defect rather than a permanently inaccessible report. The report used local `overflow-x-auto` wrappers for wider tables, rendered charts and tables, and the report `Back` button returned to `/app/cookbooks`. `viewport.reset()` restored desktop dimensions cleanly to `1280x720`; current Browser route after this slice is desktop `/app/cookbooks`.

2026-06-23 safe Billing smoke continuation note: from desktop `/app/cookbooks`, Browser opened the user menu and proved the current session is `active+clerk_test@example.com`, then navigated to `/app/billing`. Billing settled after about 6 seconds to `Premium Plan`, `Subscription active`, `Active`, and showed `Manage Subscription`, `Manage Payment Methods`, `View Billing History`, `View Plans`, and `Contact Support`. This pass intentionally did not open Stripe-hosted portal buttons or mutate subscription/payment state. `View Plans` was exercised because it is in-app and safe: the pricing dialog opened, monthly/quarterly/annual tabs selected correctly (`$69/mo`, `$59/mo` billed `$177` quarterly, `$49/mo` billed `$588` annually), then `Close` dismissed the dialog. Existing active-account copy issues still reproduce: duplicate `Promotion 30% Off...` text, `7 Days Free Trial For New Users` shown to an active subscriber, and a generic `Cancel` action inside the pricing dialog. Current Browser route after this slice is desktop `/app/billing` with no modal open.

2026-06-23 post-billing Live retest note: using the same proven active session from the safe Billing smoke, Browser navigated to `/app/option-trades/live`. Entitlement settled from `Checking access` to enabled premium controls (`Default` filters, `Columns`, enabled `Start`) and visible latest rows around `06-22 16:59:17-16:59:24`; status was `Disconnected` and the toolbar said `Latest trading day · Time descending`. Clicking `Start` immediately reproduced the contradictory `Sort Required` alert even though the `Date Time` header was already `sorted descending`; console logged fresh `[observability:development][P1] option-trades-live: Failed to fetch Object` warnings and the existing `SortRequiredForLiveDialog` ref warning. Clicking the dialog's `Sort by time (newest first)` action closed the alert but did not reach a connected stream; by the settled read NY time had crossed `2026-06-22 17:00:05`, footer `Market: Closed`, `Start` was disabled with `Live mode: off. Market is closed`, and stale latest rows remained visible. Count this as another active-account Live failure/market-close blocker, not a passed streaming test.

2026-06-23 Historical `past_week` lookback continuation note: from the same active session after the Live retest, `/app/option-trades/historical` baseline settled to `latest_day`, `Date range: 2026-06-22`, `Time range: Full day`, Premium sorted descending, and visible SPX rows. Browser selected the real `Lookback window` option value `past_week`; after about 16 seconds the page settled to `Date range: 2026-06-16 - 2026-06-22`, applied chip `Date range: 2026-06-16 to 2026-06-22`, metrics expanded from `$48.92B` total premium to `$235.05B`, and sampled rows included both older `06-18` rows and `06-22` rows, proving older-day inclusion under the current high-premium sort. Attempting to restore `latest_day` via the select hit the known Browser-control `Runtime.evaluate` timeout twice, but reloading `/app/option-trades/historical` restored default `latest_day`, `Date range: 2026-06-22`, and broad SPX rows. Current Browser route after this slice is desktop `/app/option-trades/historical` in the default latest-day state.

2026-06-23 Historical `past_month` lookback continuation note: from restored `latest_day`, Browser selected the real `Lookback window` option value `past_month`; after about 22 seconds the page settled to `Date range: 2026-05-24 - 2026-06-22`, applied chip `Date range: 2026-05-24 to 2026-06-22`, and metrics expanded to `$889.85B` total premium. Under the current Premium-descending sort, sampled visible rows still remained June 22 SPX block trades, so this proves the monthly range state and metric refresh but not older-row visibility by itself. A follow-up attempt to click the `Date Time` header to sort within the past-month window failed before interaction with the known Browser-control `Runtime.evaluate` timeout. Reloading `/app/option-trades/historical` restored default `latest_day`, `Date range: 2026-06-22`, and broad SPX rows. Current Browser route after this slice is desktop `/app/option-trades/historical` in the default latest-day state.

2026-06-23 Historical `past_month` Date Time sorter retry note: from a verified default `/app/option-trades/historical` baseline, Browser applied `past_month` again and settled to `Date range: 2026-05-24 - 2026-06-22`; the `Date Time` header rect was visible at roughly `x=125 y=527 w=104 h=36` and remained enabled while `Premium` was still `sorted descending`. To avoid the previous role-locator timeout, Browser attempted a coordinate click at the center of the verified `Date Time` header. The click itself timed out at the Browser-control layer (`Input.dispatchMouseEvent`), and the follow-up DOM probe timed out hard enough to reset Browser control. After reconnecting, reloading `/app/option-trades/historical` restored `latest_day`, `Date range: 2026-06-22`, and broad SPX rows. Treat `past_month` + `Date Time` sorter result proof as still Browser-control blocked; do not mark it failed as an app behavior because the click was not proven to reach the UI.

2026-06-23 registration/account continuation note: from signed-out `/app/option-trades/live`, Browser registration was retried with fresh aliases `evanzhousyforward+0623codex9574@gmail.com` and `evanzhousyforward+0623codex4915@gmail.com`. The first create-account submit closed the modal and left the app signed out with no OTP screen; Gmail search for the alias found no recent TradingFlow/Clerk verification mail. The second retry stayed in create-account mode and eventually showed `Request timed out. Please try again.` with no OTP inputs; console logs correlated the submit with Cloudflare Turnstile challenge frames and `[observability:development][P0] LoginModal Auth: Request timed out. Please try again. Object`. Gmail search for the second alias also found no verification mail. Treat Browser registration as blocked before OTP by Clerk/Turnstile protection plus weak inline recovery copy; do not mark OTP retrieval or new-account lifecycle complete from this pass. After the registration blocker, seeded active login recovered through the Browser OTP flow for `active+clerk_test@example.com` using `424242`; the user menu proved `SIGNED IN AS ACTIVE+CLERK_TEST@EXAMPLE.COM`. Live immediately attempted `CONNECTING...` after login but fell back to `Live data stopped after several reconnect attempts`, matching the existing live-streaming blocker. Account Center opened `/app/settings/profile` for the active user and showed verified email plus `Google Account Connect your Google account NOT LINKED`, but no visible connect button/link/control beyond that copy. Current Browser tab is active `/app/settings/profile`; no payment, billing portal mutation, account-linking action, or Stripe/Neon mutation was executed in this continuation.

2026-06-23 Historical numeric filter continuation note: with the recovered `active+clerk_test@example.com` session at desktop `1280x720`, `/app/option-trades/historical` was opened from `/app/settings/profile` and settled at `latest_day`, `DATE RANGE: 2026-06-22`, `TIME RANGE: FULL DAY`, 20 rows, and no initial applied-filter chips. Opening `DEFAULT` exposed the saved filter dialog; `min-size=4000` plus `min-oi=50000` applied successfully, rendered chips `Size: >= 4000` and `Open Interest: >= 50000`, changed metrics to a smaller filtered total, and every sampled row satisfied both thresholds (`Size >= 4000`, `OI >= 50000`). Reopening filters, clearing the minimums, and setting max-only ranges `max-size=100` plus `max-oi=1000` also applied successfully, rendered chips `Size: 0 to 100` and `Open Interest: 0 to 1000`, and every sampled row satisfied `Size <= 100`, `OI <= 1000`. `Reset to Defaults` plus `Apply` removed the applied-filter chips, restored broad rows, and settled back to `DEFAULT Saved`. This pass mutates only the active user's saved filter draft during the Browser interaction and restored it before stopping; no repo E2E script, export artifact, billing portal, payment, or Stripe/Neon mutation was executed.

2026-06-23 active Historical table-controls continuation note: from clean active `/app/option-trades/historical`, Browser verified default `latest_day`, toolbar `SEARCH TICKER...`, no Watchlist chip, `Page 1 of 342120`, and 20 broad SPX rows. Clicking enabled `EXPORT` produced no Browser download event within 10 seconds and no visible success/error toast beyond the app's standing data-issue banner; the button stayed enabled and rows did not change. Pagination is currently broken for active Historical: both the semantic `GO TO NEXT PAGE` click and a direct click on the visible enabled next-page control left the footer at `Page 1 of 342120`, kept previous-page controls disabled, and left sampled rows identical after a 35-second wait. The Columns popover opened through a scoped `button` text locator and functionally toggled `Size`: `SIZE` disappeared, visible row cell count dropped from 17 to 16, then a second click restored `SIZE` and 17 cells. New Columns accessibility/state findings: visible column toggles show text `on` while every checkbox reports `checked=false`, and the `Size` checkbox stayed `false` both before and after hide/restore. Columns dismissibility also fails: `Escape` and clicking `COLUMNS` again left the popover open, so Browser reloaded the page to recover. Rows-per-page is partly functional but mislabeled: the select value/ARIA was `Rows per page: 20` with 20 rows, switching to `50` changed the table to 50 rows and page count to `Page 1 of 136848`, then restoring `20` returned 20 rows and `Page 1 of 342120`; throughout, the visible footer text remained stale at `Rows per page 10`. No repo E2E script, AI prompt submit, billing portal, payment, or Stripe/Neon mutation was executed.

2026-06-23 active Historical sorter continuation note: from the same active `/app/option-trades/historical` baseline, Browser reconfirmed `Premium, sorted descending`, 20 rows, `Page 1 of 342120`, and path-only URL with no Score sort parameter. `Score` remains intentionally static/non-sortable in the current UI: it is a plain table header with no button, no `aria-sort`, and zero nested sort controls while server-backed columns expose sort buttons. Clicking `SIZE` changed the header to `Size, sorted ascending`; after loading settled, rows changed from high-premium SPX blocks to one-contract AAL rows with `Size=1`, proving the server-side Size sort changed table results. Clicking `PREMIUM` once changed rows to `$1` premium rows and `Premium, sorted ascending`; a role-locator click back to descending timed out at the Browser-control layer, but a visible-DOM click on the same `Premium, sorted ascending` header restored `Premium, sorted descending` and the high-premium SPX baseline (`$709.6M`, `$511.8M`, `$467.0M`). Treat Score non-sortability as expected behavior; continue any future sorter sweep from the restored Premium-descending baseline. No repo E2E script, billing portal, payment, or Stripe/Neon mutation was executed.

2026-06-23 active Historical Date Time sorter continuation note: from the restored Premium-descending baseline, a fresh visible-DOM click on `DATE TIME` changed the header to `Date Time, sorted ascending` and rows changed to market-open prints, with all sampled times at `06-22 09:30:00`. A second fresh visible-DOM click on `Date Time, sorted ascending` changed the header to `Date Time, sorted descending` and rows changed to late prints around `06-22 16:59:58` down to `06-22 16:59:49`. Restoring via two `PREMIUM` header clicks produced `Premium, sorted ascending` first, then `Premium, sorted descending` with the high-premium SPX baseline. This current latest-day Date Time proof supersedes the older `past_month` Date Time Browser-control blocker for the default Historical state only; the older monthly-window sorter proof remains unverified. No repo E2E script, billing portal, payment, or Stripe/Neon mutation was executed.

2026-06-23 active Historical OI sorter continuation note: from the restored Premium-descending baseline, Browser clicked `OI` with the visible-DOM path. `OI, sorted ascending` changed sampled rows from high-premium SPX blocks to AA rows with `OI=0`, proving the table results changed with the numeric sort. Clicking `OI` again changed the header to `OI, sorted descending` and sampled rows moved to high-open-interest contracts such as ASST `407356`, BKLN `406204`, HYG `387083`, and repeated VIX `317153`. Two `PREMIUM` header clicks restored `Premium, sorted descending` and the high-premium SPX baseline. No repo E2E script, billing portal, payment, or Stripe/Neon mutation was executed.

2026-06-23 active Historical Vol/OI sorter continuation note: from the restored Premium-descending baseline, Browser clicked `VOL/OI` through the visible-DOM header. `Vol/OI, sorted ascending` changed rows to contracts with `0X` ratios, including RUTW/XSP/SPXW/QQQ rows. A second click changed the header to `Vol/OI, sorted descending` and rows moved to extreme ratios such as GETY `11052.00X`, `11042.00X`, `11041.00X`, and GOOGL around `8238X`. Two `PREMIUM` header clicks again restored `Premium, sorted descending` and the high-premium SPX baseline. No repo E2E script, billing portal, payment, or Stripe/Neon mutation was executed.

2026-06-23 active Historical text/category sorter continuation note: from the restored Premium-descending baseline, Browser completed the remaining visible text/category headers and restored `Premium, sorted descending` after each. `SYMBOL` ascending returned `A` rows and descending returned `ZYME` rows. `EXPIRY` ascending returned same-day `26-06-22 (0d)` rows and descending returned far-dated `31-12-19 (2006d)` rows. `TYPE` ascending returned `CALL` rows and descending returned `PUT` rows. `SIDE` ascending returned `AASK` rows and descending returned `MID` rows. `MONEYNESS` ascending returned `ATM` rows and descending returned `OTM` rows. `SENTIMENT` ascending returned `BEARISH` rows and descending returned `NEUTRAL` rows. Each header's aria state changed to the expected `sorted ascending` / `sorted descending`, sampled rows changed with the selected sort, and the table was restored to the high-premium SPX baseline after the checks. No repo E2E script, billing portal, payment, or Stripe/Neon mutation was executed.

2026-06-23 active Historical numeric/price sorter continuation note: from the restored Premium-descending baseline, Browser completed the remaining numeric/price headers and restored `Premium, sorted descending` after each. `STRIKE` ascending returned `$0.5` rows and descending returned `$45000.0` NDX rows. `SPOT` ascending returned QVCAQ rows with `$0.10` spot and descending returned NDXP rows around `$30637.90` spot. `PRICE` ascending returned `$0.01` rows and descending returned high-priced NDX/NDXP rows such as `$25404.70`, `$25124.40`, and `$23406.65`. `DELTA` required horizontal table scrolling; ascending returned negative-delta rows down to `-1.10`, while descending returned positive-delta rows up to `2.05`. `IV` also required the horizontally scrolled header; ascending returned `0%` IV rows and descending returned extreme IV rows such as `21028%`, `16519%`, and `15523%`. Each header's aria state changed to the expected direction, sampled rows changed with the selected sort, and final Browser state was `/app/option-trades/historical`, `Premium, sorted descending`, `Page 1 of 342120`, high-premium SPX rows. No repo E2E script, billing portal, payment, or Stripe/Neon mutation was executed.

2026-06-23 active Billing/pricing/global-AI recheck note: with the current active session, `/app/billing` first showed `Loading billing information...` for roughly 12 seconds, then settled to `PREMIUM PLAN`, `Subscription active`, `ACTIVE`, and enabled `MANAGE SUBSCRIPTION`, `MANAGE PAYMENT METHODS`, `VIEW BILLING HISTORY`, and `VIEW PLANS`. This pass did not open Stripe portal routes or mutate billing state. `VIEW PLANS` opened the pricing modal after the page recovered; the period controls are exposed as `role=tab` (`MONTHLY`, `QUARTERLY`, `ANNUALLY`) and switched terms correctly (`$69/mo` billed monthly, `$59/mo` billed `$177` quarterly, `$49/mo` billed `$588` annually). A fresh safe Billing slice repeated that result from `/app/billing`: after `Refreshing billing status from Stripe...`, management buttons were briefly disabled and then enabled; `Contact Support` resolved to `mailto:support@tradingflow.com` and was not clicked; `VIEW PLANS` again switched monthly/quarterly/annual pricing correctly and was closed through `CLOSE`; user menu identity showed `SIGNED IN AS ACTIVE+CLERK_TEST@EXAMPLE.COM` and was closed with Escape. A later safe Account Center recheck from the same `/app/billing` session opened user menu `ACCOUNT CENTER`, landed on `/app/settings/profile`, verified `active+clerk_test@example.com` plus `VERIFIED`, and showed `Google Account` / `Connect your Google account` / `NOT LINKED` with no visible connect/link control beyond that copy; returning through user menu `BILLING` preserved the active billing state and enabled management buttons. The existing billing-copy findings still reproduce: the promo line appears twice, active subscribers still see `7 Days Free Trial For New Users`, and the modal has a generic `CANCEL` action that can be confused with subscription cancellation. The shared functionality doc currently says `AI Assistants` are disabled and removed from the runtime bundle, but active `/app/billing` exposes enabled `AI` (`aria-label="TradingFlow AI assistant"`) and `RECIPE AI` (`aria-label="Build a recipe with AI"`) controls. `AI` opens a real TradingFlow AI side panel with suggested prompts, new/clear/history/close controls, and no dialog role; `Close assistant` dismissed it. `RECIPE AI` opens a real `dialog "Recipe coding agent"` with starter prompts, `Submit`, read-only SQL / not-investment-advice copy, and a `Close` button that dismissed it. No prompt was submitted, and the fresh Account Center/Billing slice did not open Stripe portal routes, switch plans, cancel subscriptions, save payment methods, submit support, click sign out, click account linking, or mutate Stripe/Neon state.

2026-06-23 legacy-route continuation note: active-session direct legacy route checks were run without repo scripts. `/app/contract-rank` redirected to `/app/rank/contracts` and showed `Contract-level analysis` with Rank controls. `/app/market-rank` and `/app/symbol-level` both redirected to `/app/rank/symbols` and showed `Symbol-level analysis`. Retired `/app/option-chain-analysis` did not redirect; it stayed at `/app/option-chain-analysis`, title `TradingFlow`, and visible body copy included `Not Found` with only the global shell/nav controls. This contradicts the shared/rank docs' older-link continuity promise for the retired standalone Option Chain Analysis path.

2026-06-23 Historical Watchlist persistence recheck note: with `active+clerk_test@example.com`, `/app/option-trades/historical` settled to 20 rows and enabled controls. Opening `SEARCH TICKER...` showed the saved `consumered (7)` watchlist and members. Clicking `Filter by watchlist consumered` closed the drawer but did not apply scope: after a 90-second wait plus a 10-second post-wait check there was no `FILTERING: CONSUMERED` / `Watchlist: consumered` chip, the trigger returned to `SEARCH TICKER...`, and sampled rows remained broad SPX rows. Selecting `AAPL` from the same drawer did work: the trigger changed to `AAPL` and sampled rows were all AAPL. Reloading `/app/option-trades/historical` then lost the AAPL scope and returned to broad SPX rows with no clear-filter button or querystring state, so current Historical symbol/watchlist scope is not reload-persistent.

2026-06-23 clean Browser recovery and Historical time-range note: after the repeated `Page.getFrameTree` timeout, resetting the Browser-control session, closing the stuck `about:blank` tab, reacquiring `iab`, creating a new tab, and navigating directly to `/app/option-trades/historical` recovered the app in a signed-in active session. Historical then settled at default `DATE RANGE: 2026-06-22` / `TIME RANGE: FULL DAY` with rows. The `TIME RANGE` popover worked in this clean tab: applying `13:00` to `13:30` closed the dialog, changed the toolbar to `TIME RANGE: 13:00 - 13:30`, showed applied chip `Time Range: 13:00 to 13:30`, updated metrics, and every sampled row time was between `13:08:02` and `13:27:28`. Clearing via the session-hours icon plus `APPLY` restored `TIME RANGE: FULL DAY`, removed the chip, and sampled rows again included out-of-window times such as `12:25:13` and `13:40:04`.

2026-06-23 active Live lifecycle continuation note: with `active+clerk_test@example.com` proven from the user menu and `/app/option-trades/live` showing `Market: OPEN`, Live still does not reach a connected/paused stream state. On entry the page showed `START` / `Disconnected`, then without an explicit click moved to `CONNECTING...` and populated 22 rows at `06-22 14:57:51`; within about 12 seconds it returned to `START` / `Connection failed` with repeated `[observability:development][P1] option-trades-live: Failed to fetch Object` warnings. Clicking `START` from that failure state reproduced the contradictory `SORT REQUIRED` alert even though the page already showed `Latest trading day · Time descending · Shared filters with Historical` and the `Date Time` header was `sorted descending`; the alert also re-logged the `SortRequiredForLiveDialog` React ref warning. Clicking `SORT BY TIME (NEWEST FIRST)` closed the alert but did not connect; rows advanced to `06-22 14:58:55` while the control stayed `START` / `Connection failed`. A final `START` retry advanced rows again to `06-22 14:59:31`, but settled back to `START` / `Connection failed` with visible `Live data stopped`, `Could not reach... Failed to fetch` copy and no connected/pause state. A later recovered-tab retest from active `/app/billing` navigated cleanly to Live, but retrying `Live mode: connection failed. Press Start to try again.` stayed at `START` / `Connection failed` after 19 seconds, kept rows frozen around `06-22 16:30:58`, showed `Please sort by time in descending order before starting live mode`, and logged more `[observability:development][P1] option-trades-live: Failed to fetch Object` warnings plus the same `SortRequiredForLiveDialog` ref warning. Latest non-mutating post-billing continuation reverified the active identity from the user menu, unlocked premium controls (`Search ticker`, `Default`, `Columns`), 21 visible rows around `06-22 16:59:46-16:59:58`, disabled Live sort headers with `Live locks sort to Time`, and disabled `START` only because `Market: CLOSED` with `Live mode: off. Market is closed`; do not count this as streaming proof. Live `Columns` also reproduces the column-menu state bug: `Delta` started visible with `aria-checked=true`, one click hid the `DELTA` header while `aria-checked` still reported `true`, a second click left it hidden with `aria-checked=false`, and a third click restored the header while `aria-checked` remained `false`; the menu was closed and `DELTA` was restored visible. Live Type filter now has current positive evidence: in the `Default` filter dialog, deselecting `PUT` and applying produced applied chip `Type: CALL`, loading settled, and all 21 sampled rows were `CALL`; `Reset to Defaults` plus `Apply` removed the chip and restored mixed `CALL`/`PUT` rows. Treat Live as partial polling/ingest plus failed connection or market-closed blocking, not a working stream.

2026-06-23 shared symbol-clear retest note: with `active+clerk_test@example.com`, Rank Symbols and Option Trades Historical were rechecked for the shared symbol picker after the earlier clear-state finding. On `/app/rank/symbols`, starting from mixed rows and `FILTERS (0 ACTIVE)`, selecting `AAPL` from the symbol/watchlist panel narrowed the page to one `AAPL` row, toolbar `Symbol filter: AAPL`, `FILTERS (1 ACTIVE)`, and `1 total records`; the adjacent `Clear filter` icon restored `SEARCH SYMBOLS`, `FILTERS (0 ACTIVE)`, and mixed rows such as `SPY`, `QQQ`, `NVDA`, `TSLA`, `EWZ`. Rank Symbols nuance: once `AAPL` was active, clicking the `AAPL` pill did not reopen the picker even though the control is marked as a dialog trigger, so changing an active symbol depends on the separate clear icon. On `/app/option-trades/historical`, selecting `AAPL` from the panel worked after settling: toolbar `AAPL`, `87,042 total records`, and sampled rows were all `AAPL`. The panel-level `CLEAR` inside `SEARCH SYMBOLS & WATCHLISTS` still failed: it closed the dialog but left toolbar `AAPL`, `87,042 total records`, and sampled rows all `AAPL`. The adjacent toolbar `Clear filter` icon did work after loading settled, restoring `SEARCH TICKER...`, mixed SPX rows, and about `5.9M total records`. Keep the finding focused on the panel-level clear affordance, not the table filter backend.

2026-06-23 Historical controls recheck note: with `active+clerk_test@example.com` on `/app/option-trades/historical`, the settled baseline was `5,988,948 total records`, `Page 1 of 299448`, 20 rows, and premium controls enabled. `GO TO NEXT PAGE` now worked from page 1 to page 2 and changed sampled rows, so the older "next-page no-op" finding no longer reproduces as a blanket issue. New precise pagination finding: from `Page 2 of 299448`, `GO TO LAST PAGE` stayed on page 2 with the same rows after a 45-second wait and no visible error; `GO TO PREVIOUS PAGE` and `GO TO FIRST PAGE` also stayed on page 2 with the same rows after 25-second waits, while all four pagination buttons remained enabled. A later footer recheck from a fresh active default state (`6,842,399 total records`) proved the rows-per-page select works: changing `20` to `50` updated the visible row count to 50 and page label from `Page 1 of 342120` to `Page 1 of 136848` while preserving the same total record count, then restoring `20` returned to 20 rows and `Page 1 of 342120`. Export still failed to provide Browser proof: clicking `EXPORT` produced no Browser download event within 10 seconds and no export-specific visible toast/error; only the generic data-issue banner remained. Columns retest nuance: a Recipe AI side panel can overlay the right edge and make the Columns trigger appear unresponsive; after closing the panel, Columns opened normally. The `Iv` column toggle functionally removed and restored the `IV` header, but checkbox state is still wrong: one click hid `IV` while `aria-checked` still read `true`, a second click left `IV` hidden while changing `aria-checked` to `false`, and a third click restored `IV` while `aria-checked` remained `false`. Current dismissibility retest passed after the overlay was closed: Escape, re-clicking the Columns trigger, and outside click all closed the menu, so do not carry forward the older Columns dismissibility failure unless it reappears.

2026-06-23 guest Live guard recheck note: the active session was logged out through the visible user menu and the app landed on guest `/app/option-trades/live`. Guest baseline showed `Premium required`, disabled sortable headers, 22 preview rows, and `SIGN IN` / `SIGN IN TO SAVE FILTERS & WATCHLIST` prompts. Clicking `START` opened the login modal and left sampled rows unchanged. Clicking `COLUMNS` opened the login modal, no Columns menu, and left sampled rows unchanged. Clicking exact toolbar `FILTERS` opened the full filter dialog, which still says `Sign in to unlock premium advanced filters. Basic date, time, and contract filters still work here.` Selecting `PUT` and pressing `APPLY` opened the login modal instead of applying the visible basic type filter; sampled rows stayed mixed `CALL`/`PUT` and unchanged from the guest preview. This confirms the guest filter-copy mismatch on Live as well as Historical. Restore warning: after this guest pass, two attempts to restore `active+clerk_test@example.com` through the Browser login UI did not leave the app signed in. One attempt reached the six-digit OTP step and accepted `424242` into the inputs but then closed back to guest; a clean retry from the header `SIGN IN` button submitted the email and closed the modal without reaching OTP. The current in-app Browser tab is guest `/app/option-trades/live` until a later run signs in again.

2026-06-23 guest Rank/Billing guard recheck note: from the current guest session, direct `/app/billing` redirected back to `/app/option-trades/live` and opened the login modal; no billing portal or subscription-management surface was exposed. `/app/rank/contracts` and `/app/rank/symbols` both still settle into the ClickHouse `Failed to load contract-level analysis ... There is no supertype for types UInt64, UInt32, Float64 ... In scope symbol_context AS sc` blocker, so guest Rank result matching remains blocked. Contracts still exposed `FILTERS (0 ACTIVE)`, `COLUMNS`, `LIVE UPDATES · PREMIUM`, enabled sort headers such as `PREMIUM`, and `SEARCH SYMBOLS`; clicking filters, columns, live updates, and the premium sort header all opened the login modal and left the errored `No results` table unchanged. Rank Symbols exposed `FILTERS (0 ACTIVE)`, `LIVE UPDATES · PREMIUM`, `FLOW`/`VOL`, disabled `EXPORT`, and `SEARCH SYMBOLS`; filters, live updates, and `VOL` all opened the login modal with no row-state mutation. New/current privacy-conversion finding: the signed-out `SEARCH SYMBOLS & WATCHLISTS` dialog opens on both Rank tabs and reveals a saved `Default 6` watchlist plus symbols (`TSLA`, `AAPL`, `META`, `AMZN`, `MSFT`, `NVDA`) before login. Applying `Filter by watchlist Default` then opens the login modal and does not apply a watchlist scope, so the action gates correctly but the saved-list contents are exposed pre-auth.

2026-06-23 Live streaming retest note: with `active+clerk_test@example.com` verified from the user menu and `/app/option-trades/live` showing `Market: OPEN` at NY Time `2026-06-22 14:26-14:29`, the enabled `START` control still did not establish a stable stream. The first attempt loaded rows at `06-22 14:25:57`, entered `CONNECTING...`, then returned to `START` with `Connection failed` and repeated `[observability:development][P1] option-trades-live: Failed to fetch Object` warnings. An explicit retry opened a `SORT REQUIRED` alertdialog asking to `SORT BY TIME (NEWEST FIRST)` even though the toolbar/header already showed `Time descending` / `Date Time, sorted descending`; the dialog also logged a React ref warning from `SortRequiredForLiveDialog`. After using the dialog's sort action, the Date Time header still read `sorted descending`; starting again ingested short bursts up to `06-22 14:28:21` and showed `RECONNECTING...` with `Could not reach the live data connection... Failed to fetch`, then settled back to `START` / `Connection failed`. Count current Live as partial ingest only, not a stable connected stream.

2026-06-23 Rank filters/drawers/watchlist continuation note: with `active+clerk_test@example.com`, `/app/rank/contracts` was re-checked after the earlier Rank note. Filter dialog `Cancel` discarded a draft `Min contract premium = 1000000` and left full results unchanged. Exact expiry `2026-08-21` applied as `FILTERS (1 ACTIVE)` with `29,041 total records`; sampled rows all showed `26-08-21(60d)`. `PUT` plus strike `50-100` applied as 2 active filters with sampled rows all `PUT` and strikes in range. `Positive` GEX plus `Min premium >= 1000000`, `Min Vol/OI >= 2`, and `Net DEI >= 5` applied as 4 active filters and returned 3 rows; sampled rows matched positive GEX, premium >= $1M, Vol/OI >= 2x, and Net DEI >= 5%. `Reset form` cleared only the draft; canceling after reset preserved the live 4-filter result. `CALL` plus delta `0.5-0.7` plus `Out of The Money` applied as 3 active filters with 18,505 records; sampled rows all matched `CALL`, OTM, and delta within range. Contract symbol scoping via the symbol picker worked for `AAPL`: toolbar showed `Symbol: AAPL`, totals dropped to about 1.3K records, and sampled rows were all AAPL. The small `Clear filter` chip restored `FILTERS (0 ACTIVE)`, disabled `CLEAR FILTERS`, and returned mixed full-session rows.

2026-06-23 Rank Symbols continuation note: `/app/rank/symbols` loaded 4,676 active-account symbol rows. Symbols filter coverage verified combined contract/symbol filters: `Underlying type = Stock`, sector `MOTOR VEHICLES & PASSENGER CAR BODIES`, market cap `>= 1000000000000`, sentiment `Bullish`, and `IV30 >= 0.3` applied as `FILTERS (5 ACTIVE)` and returned only `TSLA`; the row matched Stock, Bullish, that sector, `$1.5T` market cap, and `46.46%` IV30. `CLEAR FILTERS` restored `FILTERS (0 ACTIVE)` and full scope. New accessibility/copy finding: the Symbols tab filter trigger still announces `Open contract narrowing filters`, and the dialog title/copy says `Narrow contracts` even when the user is filtering Symbols. Flow/Vol presets worked: `VOL` hid flow columns and kept volatility headers (`Spot`, `IV30`, `ATM IV`, `IV Rank`, `IV Percentile`, skew/slope/bfly, `Earnings`); `FLOW` restored the full 27-column table. The Symbols Columns popover functionally toggled `Net DEX`: unchecked removed the `NET DEX` header and reduced sampled row cell counts from 27 to 26; rechecking restored it. `Total Premium` sorting worked both ways: ascending showed `$5` rows with header `Total Premium, sorted ascending`, and descending showed high-premium rows such as `SPX`, `MU`, `SPXW`, `SNDK`, `QQQ` with header `Total Premium, sorted descending`. Watchlist scope worked on Rank Symbols: applying `consumered (7)` changed the toolbar to `FILTERING: CONSUMERED (7)`, returned 7 rows, and every sampled symbol was inside `AAPL, AMZN, ASST, META, SPXW, TSLA, XSP`; clearing restored full rows. Row watchlist add/remove also worked for `MU`: `Add MU to watchlist` became `Remove MU from watchlist`, then removing restored the add state. The MU symbol drawer opened from Symbols; `Flow` loaded 30-session history after `LOAD 30-SESSION FLOW HISTORY`, `Vol` rendered an IV surface, and `Chain` rendered bid/ask/last rows. `SHOW ALL STRIKES` in Chain changed to `SHOW ±25% WINDOW` and expanded the table from 121 rows to 367 rows. New Rank export finding: clicking Symbols `EXPORT` showed an `Export started` toast but produced no Browser download event within 8 seconds; the button stayed enabled.

2026-06-23 registration retry note: fresh Browser registration with `evanzhousyforward+0623codexreg777603@gmail.com` is blocked before OTP. Starting signed out from `/app/option-trades/live`, `Create account` accepted the alias but stayed on the email step; after the first submit the modal disabled action buttons, never rendered OTP inputs, and then showed `Request timed out. Please try again.` Gmail exact search for `to:evanzhousyforward+0623codexreg777603@gmail.com newer_than:1d` returned no messages; a broader Clerk/TradingFlow/code search returned only unrelated mail. Browser console showed Cloudflare Turnstile challenge URLs plus `[observability:development][P0] LoginModal Auth: Request timed out...`; a visible retry reproduced the blocker and logged `[Cloudflare Turnstile] Turnstile has already been rendered in this container. The render attempt was rejected.` Treat current manual Browser registration as blocked by a hidden/failed Turnstile/Clerk challenge before OTP, not Gmail retrieval. New-account lifecycle and post-registration billing/access review remain unproven until the user solves/approves the challenge, Clerk test-token Browser setup is explicitly allowed, or the local test environment disables bot protection for manual Browser review.

2026-06-23 active streaming, Historical sort, and Score retry note: seeded sign-in for `active+clerk_test@example.com` still advances through OTP normally with code `424242`, so the fresh registration blocker is isolated to create-account/Turnstile rather than the seeded login path. After active sign-in on `/app/option-trades/live`, the Live control entered `CONNECTING...`, advanced the table from `13:40:20` rows to newer `13:41:50` rows, then returned to `START` with `Connection failed`; an explicit user retry via the `Live mode: connection failed. Press Start to try again.` button repeated the failure and logged repeated `[observability:development][P1] option-trades-live: Failed to fetch Object` warnings. Browser later showed the user-facing toast `Live data stopped after several reconnect attempts. Tap Start to try again, or refresh the page.` Do not mark streaming as connected; current proof is "receives a short burst, then fails/retries out." On `/app/option-trades/historical`, Premium sorting worked both ways: ascending changed sampled rows from mixed recent premiums to `$1` rows with header `Premium, sorted ascending`; descending changed sampled rows to high-premium SPX rows such as `$511.8M`, `$313.3M`, `$308.5M`, with header `Premium, sorted descending`. The Score header was verified as intentionally non-sortable: no Score button, no sort query parameter, and the header contains a tooltip trigger with accessible copy explaining that Score is browser-calculated and not sortable in the server-side table.

2026-06-23 Historical controls continuation note: with `active+clerk_test@example.com` on `/app/option-trades/historical`, the Columns popover opened and the `Iv` column toggle functionally worked: toggling `Iv` off removed the `IV` header and sampled rows dropped from 17 cells to 16; toggling it back restored the `IV` header and rows to 17 cells. New product/accessibility finding: the `Iv` checkbox `aria-checked` appeared inverted during this sequence (`true` when the column was hidden, `false` after the column was restored). New dismissibility finding: after opening Columns, Escape, re-clicking the Columns trigger, and an outside click all left the popover mounted; a reload was needed to recover. Rows-per-page worked: changing `Rows per page` from 20 to 50 rendered 50 rows and changed pagination from `Page 1 of 256505` to `Page 1 of 102602`; restoring 20 rendered 20 rows and restored `Page 1 of 256505`. New pagination finding: `GO TO NEXT PAGE` was enabled, but role click, visible-DOM node click, and coordinate click all left the table on `Page 1 of 256505` with the same sampled first rows, so next-page navigation is a no-op in this Browser pass. Lookback `Past 3 days` worked: the select value changed to `past_3_days`, the visible date range changed from `DATE RANGE: 2026-06-22` to `DATE RANGE: 2026-06-20 - 2026-06-22`, and total/page count changed to `5,156,846 total records` / `Page 1 of 257843`. The restore path briefly hit Browser-control timeouts (`Page.getFrameTree` / `Page.enable`), but the final state recovered and verified `latest_day`, `DATE RANGE: 2026-06-22`, 20 rows, and page 1.

2026-06-23 Historical refresh/export/date-time continuation note: with `active+clerk_test@example.com` on `/app/option-trades/historical`, Refresh worked: it showed `Loading table data`, disabled the Refresh button while running, preserved `latest_day`, `DATE RANGE: 2026-06-22`, and `TIME RANGE: FULL DAY`, and returned 20 rows with no visible error while total/page count updated from `5,185,361` / `Page 1 of 259269` to `5,217,747` / `Page 1 of 260888`. New export finding: clicking `EXPORT` as an entitled user produced no Browser download event within 10 seconds and no visible toast/error, while table state stayed unchanged. Time range worked: applying `13:00` to `13:59` changed the button to `TIME RANGE: 13:00 – 13:59`, reduced totals to `647,793 total records` / `Page 1 of 32390`, and all sampled row times were 13:xx. New time-clear UX finding: the clear/full-day icon inside the time popover only reset the form inputs to `09:30` and `17:00`; it did not apply the full-day query until `APPLY` was clicked. Applying those defaults restored `TIME RANGE: FULL DAY`, showed out-of-13:xx sampled rows again, and returned totals to `5,241,492 total records` / `Page 1 of 262075`. Date range picker opened with June/July calendars, disabled weekends/future dates, and selecting `Thursday, June 18th, 2026` plus `APPLY` changed the toolbar to `DATE RANGE: 2026-06-18 - 2026-06-22` with page count `Page 1 of 639623`. Stability finding/blocker: after the date-range apply/reload recovery sequence, the original in-app Browser tab crashed to Chrome's `This page crashed` interstitial for `localhost`; the app was recovered by opening a fresh in-app Browser tab directly to `/app/option-trades/historical`, which loaded signed-in at default `DATE RANGE: 2026-06-22` and `TIME RANGE: FULL DAY`.

2026-06-23 Billing/global-shell continuation note: with `active+clerk_test@example.com`, `/app/billing` showed `Subscription active` / `ACTIVE` and enabled `MANAGE SUBSCRIPTION`, `MANAGE PAYMENT METHODS`, `VIEW BILLING HISTORY`, and `VIEW PLANS`. `VIEW PLANS` opened the pricing modal; Monthly/Quarterly/Annually tabs updated plan terms (`$69/mo` billed monthly, `$59/mo` billed `$177` quarterly, `$49/mo` billed `$588` annually), Monthly showed disabled `CURRENT PLAN`, and Quarterly/Annually showed `SWITCH PLAN` but that mutating action was not clicked. New pricing-modal UX findings: the promotion line appeared twice, active users still see `7 Days Free Trial For New Users` copy, and the modal contains a generic `CANCEL` button in a billing context where it can be confused with subscription cancellation. `MANAGE SUBSCRIPTION` reached a Stripe test portal session and rendered current subscription, `Update subscription`, `Cancel subscription`, saved `Visa **** 4242` payment methods, invoice history, and `Return to TradingFlow`; the return link brought the app back to `/app/billing` and the app refreshed Stripe status before settling back to active. `MANAGE PAYMENT METHODS` reached the Stripe test `/payment-methods` target titled `Add payment method | TradingFlow Billing`; no card was added. `VIEW BILLING HISTORY` reached the same general Stripe portal landing page rather than a history-specific route, but invoice history was visible. User menu identity proof passed: the menu showed `active+clerk_test@example.com`, `Account Center` routed to `/app/settings/profile` with verified email and Google not linked, and the menu `Billing` item returned to `/app/billing`. Global shell controls checked from Billing: theme toggled dark -> light -> dark and restored; language toggled directly English -> Chinese -> English instead of opening a chooser; Glossary opened, `gamma` search reduced results to `Showing 4 of 28 concepts`, and close dismissed it. Recipe AI opened; clicking `Top 10 symbols by total premium today` immediately entered `Thinking...` with an empty textarea instead of merely pre-filling a prompt, then close dismissed it. No subscription update, cancellation, payment-method save, file upload, custom AI prompt submit, or repo E2E script was executed in this pass.

2026-06-23 Billing mobile continuation note: active-account `/app/billing` was rechecked at `390x844`. The Billing page had no horizontal overflow, visible buttons kept reasonable hit sizes, and scrolling reached the lower `VIEW PLANS` action above the fixed footer controls. The pricing modal opened full-width (`390px`) with title/description wiring present; Monthly still showed duplicated promotion copy and `7 Days Free Trial For New Users` for an active subscriber. The bottom `CANCEL` action initially rendered below the visible viewport but became reachable after scrolling inside the modal; `CLOSE` dismissed the modal. Mobile menu opened and exposed `OPTION TRADES`, `RANK`, and `COOKBOOKS`; when the viewport was reset to desktop while the mobile menu remained open, the `MAIN MENU` overlay persisted on desktop with a tiny visible `CLOSE` control and no desktop hamburger, so count this as a responsive shell-state finding. The menu was dismissed by clicking the visible close control. No Stripe portal, plan switch, subscription update, or payment mutation was executed in this mobile pass.

2026-06-23 active mobile data-workbench note: after seeded sign-in as `active+clerk_test@example.com`, mobile viewport `390x844` was used across data-heavy pages. `/app/option-trades/historical` shows the explicit `Mobile View Optimized` warning, loads real rows, and uses an inner horizontal table scroller: the table is about `1752px` wide in a `374px` scroller, and a horizontal swipe moved from `SYMBOL/DATE TIME/EXPIRY/TYPE` to `PRICE/PREMIUM/SIZE/OI/VOL/OI`. The toolbar is reachable, but compact controls such as date/time/refresh/export render as `38px` icon-width buttons with long accessible labels; info buttons and column-menu checkboxes are only about `14-17px`, which is small for touch. Mobile `COLUMNS` fits in the viewport, but `Escape` did not dismiss it. A later outside tap hit `EXPLAIN`; the mobile Explain bottom sheet had no obvious close button, `Escape` did not close it, and pressing `EXPLAIN` again left it open and restarted `Thinking...`, so treat mobile AI explain as a dismissibility/accessibility issue. `/app/option-trades/live` on mobile loaded rows up to `06-22 14:47:39`, showed `RECONNECTING...`, then returned to `START` / `Connection failed` with repeated `[observability:development][P1] option-trades-live: Failed to fetch Object`, matching desktop Live instability. `/app/rank/contracts` and `/app/rank/symbols` both loaded active rows on mobile and horizontal table scrolling worked; however, their headline cards push filters/table far below the first viewport, and when scrolled into tables the fixed footer controls overlap lower row actions around y=760-830. Rank Symbols' table is about `3720px` wide in a `294px` scroller; horizontal swipe moved headers from `SYMBOL/TYPE/TOTAL PREMIUM` to `SENTIMENT/CALL %/CALL PREMIUM/PUT PREMIUM`. Viewport was reset to desktop after this pass.

2026-06-23 guest access continuation note: after logging out of `trialingwithpayment+clerk_test@example.com`, direct guest navigation to `/app/billing` redirected to `/app/option-trades/live` and opened the login dialog with title/description wiring; no billing portal buttons or subscription details were exposed. Guest `/app/rank/contracts` and `/app/rank/symbols` still reproduce the ClickHouse `symbol_context AS sc` type-supertype error after settling; Symbols also showed the app-level `An internal error occurred. Please refresh the page.` banner. Rank guest controls still gate correctly despite the data failure: Contracts `FILTERS (0 ACTIVE)`, `LIVE UPDATES · PREMIUM`, and `COLUMNS`, plus Symbols `FILTERS (0 ACTIVE)`, opened the login dialog instead of mutating state. Guest `/app/option-trades/historical` loads real preview metrics and rows (`5,733,059 total records`, sampled SPY/CLOV/COST/CRCL/SPXW rows). Historical `COLUMNS`, `EXPORT`, `PREMIUM` sort, and `GO TO NEXT PAGE` all opened the login dialog; Export produced no Browser download within 8 seconds, and sort/pagination left sampled rows plus `Page 1 of 57331` unchanged. New UX/copy finding: Historical guest `FILTERS` opens the real filter dialog and says `Basic date, time, and contract filters still work here`, but selecting `CALL` and pressing `APPLY` opened the login dialog and left sampled rows mixed PUT/CALL with no active filter. Either the copy is too permissive or basic guest filter application is broken.

2026-06-23 access-tier continuation note: canceled guard coverage is now broad for `canceled+clerk_test@example.com`. `/app/billing` showed `SUBSCRIPTION CANCELED` and `REACTIVATE SUBSCRIPTION`. On `/app/option-trades/live`, the `Default` filter button, `Columns`, `Start`, row Watchlist add, watchlist-scope apply, and AAPL single-symbol selection all opened the upgrade modal and left sampled rows/query state unchanged; Live sort headers were disabled. The shared symbol/watchlist drawer itself still opens for canceled users and exposes the saved Default watchlist contents before the final action gates, so treat that as a UX/privacy review point even though the action did not mutate state. On `/app/rank/contracts` and `/app/rank/symbols`, canceled users saw explicit premium-blocked empty states; filters, columns, live-updates, visible sortable headers, symbol/watchlist selections, and the Symbols Flow/Vol toggle opened upgrade feedback without loading Rank rows or mutating state; Export was disabled.

2026-06-23 canceled access re-run note: Browser logged in as `canceled+clerk_test@example.com` through the seeded email OTP flow and reconfirmed the user menu identity. `/app/option-trades/live` showed `SUBSCRIPTION CANCELED`, `REACTIVATE SUBSCRIPTION`, `Premium required`, disabled Live sort headers, and upgrade-labeled Watchlist controls. Clicking `Start`, `Columns`, `Default` filters, and a row Watchlist add all opened the upgrade modal and left URL plus sampled rows unchanged. `/app/option-trades/historical` showed the same canceled banner and gated `Filters`, `Columns`, and `Export`: each opened the upgrade modal, Export produced no Browser download event, and rows/URL were unchanged. New/reconfirmed Historical guard findings from this re-run: sortable headers such as `Premium` remain enabled for canceled users but a CSS-verified click produced no visible upgrade feedback and no row/header change, and the `Loading table data` status remained visible while KPI totals, row count, headers, and rows were already rendered. `/app/rank/contracts` showed `Premium is required to load Rank data`, `No results`, disabled Export, and upgrade gating for `Filters`, `Columns`, and a visible sorter; no Rank rows loaded or mutated. `/app/rank/symbols` showed the premium-blocked Symbol-level empty state and disabled Export; `Filters` opened the upgrade modal and left the empty state unchanged. A clean follow-up on Rank Symbols proved `Vol`, `Live Updates · Premium`, and `Refresh` also open the upgrade modal, keep `Flow` selected / `Vol` unselected, keep Export disabled, and load no rows. Current Browser route after this slice was `/app/rank/symbols`; no repo E2E script, payment portal, Stripe SDK/API, billing mutation, AI prompt submit, or account-data mutation was executed.

2026-06-23 trial entitlement continuation note: `trialing+clerk_test@example.com` showed `TRIAL EXPIRES IN 6 DAYS` and `ADD PAYMENT METHOD`; after `/app/billing` finished refreshing, `MANAGE SUBSCRIPTION`, `MANAGE PAYMENT METHODS`, `VIEW BILLING HISTORY`, and `VIEW PLANS` were enabled. On `/app/option-trades/live`, premium controls were unlocked: the Columns menu opened, the filter dialog opened with persisted `Size >= 1000` and `Open Interest >= 100000`, sampled rows matched those numeric chips, and a reversible Watchlist add/remove for `BSX` worked and was restored. Live streaming still failed for the trial user with `Connection failed` and recent console warnings `[observability:development][P1] option-trades-live: Failed to fetch Object`, matching the active-account streaming blocker. On `/app/rank/contracts`, trial access loaded full Rank rows and opened the real filter dialog, not a paywall. A follow-up attempt to prove Rank sort with `Flow DEX` via Browser locator caused the browser-control kernel to time out; after reconnect the table was still on `Net DEI, sorted descending`, so do not count that specific trial sort proof from this pass. Active-account Rank sort proof from the earlier note remains valid.

2026-06-23 trial-with-payment re-probe note: after logging out of `active+clerk_test@example.com`, seeded login for `trialingwithpayment+clerk_test@example.com` succeeded through the Browser email/OTP flow with `424242`, proving this seeded account can still authenticate. The account landed on `/app/option-trades/live` with `SUBSCRIPTION CANCELED`, `REACTIVATE SUBSCRIPTION`, `Premium required`, disabled Live sort headers, disabled symbol search, and upgrade-oriented controls. `/app/billing` showed `SUBSCRIPTION CANCELED`, `REACTIVATE SUBSCRIPTION`, and `VIEW BILLING HISTORY`, with no subscription overview, payment-methods card, or explore-plans card visible. `VIEW BILLING HISTORY` safely reached Stripe test portal and returned to the app; the portal was a general customer portal showing saved `Visa **** 4242`, `Add payment method`, billing email `trialingwithpayment+clerk_test@example.com`, and invoice history rather than a history-only view. User menu identity was `TRIALINGWITHPAYMENT+CLERK_TEST@EXAMPLE.COM`. Treat this fixture as still drifted/canceled in the current environment; do not use it as trial-with-payment coverage until restored or replaced. No Stripe SDK/API mutation, plan switch, payment-method save/delete, subscription reactivation, or payment change was executed in this re-probe.

2026-06-23 continuation note: current Browser pass still has unresolved coverage, but several blockers are now proven. Active account proof completed for `active+clerk_test@example.com`: `/app/billing` showed `Subscription active`, management buttons enabled after refresh, Option Trades premium controls unlocked, and Live attempted but ended `Connection failed`. A later Watchlist pass repeated the Live issue while active: the page showed `Connection failed` and recent console warnings included `[observability:development][P1] option-trades-live: Failed to fetch Object`. The expected trial-with-payment persona `trialingwithpayment+clerk_test@example.com` is fixture-drifted in the current environment: `/app/billing` and Option Trades both show `SUBSCRIPTION CANCELED`, so do not count it as trial-with-payment coverage until restored or replaced. Rank guest coverage is blocked for result matching because both `/app/rank/contracts` and `/app/rank/symbols` settle into `Failed to load contract-level analysis` with the ClickHouse `There is no supertype for types UInt64, UInt32, Float64 ... In scope symbol_context AS sc` error; only gate behavior can be counted there. Registration retry with `evanzhousyforward+0623codex1301@gmail.com` stayed on the create-account email step, Gmail had no OTP email, and the modal removed the `Continue` button after submit, leaving only email plus `Close`. Mobile viewport override was verified at `390x844`; `viewport.reset()` did not restore desktop dimensions in this run, so an explicit `1280x720` viewport set was needed before continuing desktop checks. Current checkout also may not contain the older `doc/automation/product-review/*` or `doc/automation/e2e-test/*` prompt files; use the current domain docs and `tests/e2e` specs as read-only journey maps when those prompt files are absent.

2026-06-23 Watchlist coverage note: guest row-level Watchlist mutation on `/app/option-trades/live` opened the sign-in modal and left preview rows unchanged. After signing in as `active+clerk_test@example.com`, row-level add/remove worked for `AMAT`: `Add AMAT to watchlist` changed to `Remove AMAT from watchlist`, then removing restored the original add state. Applying the default `consumered` Watchlist from the symbol/search panel showed `FILTERING: CONSUMERED (7)` plus `Watchlist: consumered`; after loading settled, sampled Live rows and then Historical rows were all within `AAPL, AMZN, ASST, META, SPXW, TSLA, XSP`. Selecting `AAPL` from the applied Watchlist cleared the Watchlist chip and narrowed rows to AAPL only. New product finding: the symbol panel `Clear` control failed twice after AAPL was active; it closed the panel but left the toolbar at `AAPL` and rows still all AAPL, so the visible clear affordance does not clear the single-symbol scope. Fresh Live recheck repeated the pattern with `XSP`: selecting `XSP` from `consumered` changed the toolbar to `XSP`, loading settled, and all 21 sampled rows were `XSP`; reopening the drawer showed `Filtering: XSP`, but the drawer-level `CLEAR` closed the drawer and left the toolbar plus all sampled rows on `XSP` through the wait window. The adjacent toolbar `Clear filter` icon did work after loading settled, restoring `SEARCH TICKER...` and mixed `SPXW`/`XSP` rows. Fresh active Historical Watchlist manager lifecycle coverage: the drawer initially had `semi-conductor 10`, `consumered 7 Default`, `New Watchlist Copy 1`, and two duplicate `New Watchlist 0` lists. Clicking `NEW` created another duplicate `New Watchlist 0`; adding `AAPL` to the new list worked and temporarily showed it as `New Watchlist 1`, then removing `AAPL` restored an empty `New Watchlist 0`. While the new list contained AAPL, the active pane did not expose `Filter by this watchlist` or `Actions`; after the list was empty/refreshed those controls appeared, and `Actions -> DELETE` removed only the temporary list, returning the duplicate `New Watchlist 0` count to the pre-test two entries. The drawer `CLOSE` control and `Escape` repeatedly failed to dismiss the dialog, so Browser had to reload `/app/option-trades/historical`; after reload there was no visible dialog, no Watchlist chip, toolbar `SEARCH TICKER...`, and broad SPX Historical rows. Current Browser state after the manager lifecycle cleanup is desktop `/app/option-trades/historical` with no symbol/watchlist filter active.

2026-06-23 Watchlist persistence continuation note: after logging out of the drifted `trialingwithpayment+clerk_test@example.com` fixture, seeded active login with `active+clerk_test@example.com` succeeded through OTP `424242`. Applying `consumered (7)` from `/app/option-trades/live` worked: toolbar `FILTERING: CONSUMERED (7)`, chip `Watchlist: consumered`, and sampled rows were all inside `AAPL, AMZN, ASST, META, SPXW, TSLA, XSP`. A later direct Live reload recheck lost the same applied watchlist state on `/app/option-trades/live`: after reload the toolbar returned to `SEARCH TICKER...`, the `Watchlist: consumered` chip disappeared, and the URL stayed path-only with no querystring state. Because the latest Live tape visibly contained only `SPXW`/`XSP` in that sample, use the toolbar/chip loss as the persistence evidence rather than claiming row broadening from that reload. Switching to `/app/option-trades/historical` preserved the same Watchlist scope and all sampled rows stayed inside the set, but reloading Historical lost the scope: the toolbar returned to `SEARCH TICKER...`, chips disappeared, totals returned to the broad multi-million result set, and sampled rows became broad `SPX` rows. `/app/rank/symbols` showed the same pattern: applying `consumered (7)` worked with `FILTERS (1 ACTIVE)`, `7 total records`, and sampled rows exactly `TSLA, SPXW, AAPL, AMZN, META, XSP, ASST`; reloading Rank Symbols lost the scope and returned to `SEARCH SYMBOLS`, `FILTERS (0 ACTIVE)`, `4,757 total records`, and mixed rows such as `SPY`, `QQQ`, `NVDA`, `TSLA`, `SPXW`. `/app/rank/contracts` also applied `consumered (7)` correctly with `FILTERS (1 ACTIVE)`, `Watchlist: consumered`, and sampled contract rows only for `ASST, SPXW, META`, but reloading Contracts lost the scope and returned to `SEARCH SYMBOLS`, `FILTERS (0 ACTIVE)`, `367,197 total records`, and broad rows such as `ASHS`, `QVCAQ`, `BKV`, `QRVO`, `PVL`. No Watchlist membership add/remove, payment, billing, or Stripe mutation was executed in this continuation.

2026-06-23 Rank active-account coverage note: with `active+clerk_test@example.com`, `/app/rank/contracts` and `/app/rank/symbols` both loaded rows, so the ClickHouse `symbol_context AS sc` blocker was not present for this active-session re-probe. Contracts coverage verified `Premium` sort both ways (`$1` rows for ascending, high-premium rows such as `$573.1M`, `$446.8M`, `$388.8M` for descending), `<=7D` filtering (`Filters (1 active)`, `Expiry scope: <=7D`, headline cards changed to filtered counts, sampled rows all 0-4D), contract drawer Flow load, Tradeability snapshot, 60-session history load, and Rank -> Option Trades handoff. The handoff kept `/app/option-trades/historical` path-only while applying exact MU contract identity (`MU`, `2026-06-26`, `CALL`, strike `1200 to 1200`), and sampled rows matched. Symbols coverage verified 4,611 rows, Vol preset after a fresh click (pressed `Vol`, flow columns hidden, spot/IV/skew/term columns visible), SPY symbol drawer overview, paid Flow history load, and Chain tab bid/ask/last rows. New product finding: during the first Symbols `Vol` attempt the page unexpectedly re-rendered into Chinese while `Flow` remained selected; after a fresh click, `Vol` worked, and the language selector restored English. Treat this as an i18n/state regression candidate.

2026-06-23 Rank Contracts utility-controls continuation note: from active desktop `/app/rank/contracts`, Browser verified `367,492 total records`, `Page 1 of 7350`, 50 visible rows, and `Net DEI, sorted descending`. `Export` emitted a visible `Export started` status but no Browser download event appeared within the wait window; the table remained on the same page and rows. Rows-per-page changed 50 -> 20 -> 50 with matching visible row counts and page counts (`Page 1 of 18375` then `Page 1 of 7350`). Footer pagination worked through the visible controls: next moved to `Page 2 of 7350` with different rows, previous restored page 1, last moved to `Page 7350 of 7350` with 42 rows, and first restored page 1. The semantic role click for next timed out at the Browser-control layer before acting, so count only the visible-node path. `Columns` role click also timed out, but the visible Columns button opened the menu; toggling `Underlying Type` added and removed the header and changed row cell counts 18 -> 19 -> 18 with checkbox aria false -> true -> false. `Escape` did not dismiss the Columns menu, so future runs should verify outside-click/trigger dismissal; current state was recovered to English with no popover open.

2026-06-23 Rank Contracts sorter sweep continuation note: from the restored active baseline, Browser exercised every visible server-backed contract sorter in both directions and verified sorted header state plus sampled row changes: `Symbol`, `GEX Env`, `Expiry`, `Strike`, `Side`, `Net DEI`, `Flow DEX`, `ΔOI DEI`, `Ask/Bid %`, `Premium`, `Vol/OI`, `Δ OI`, `OI`, `Contract Last`, `Moneyness`, `Delta`, and `IV`. `Flow DEX` correctly exposed the UI contract that sorting uses absolute impact, not signed numeric order. Two header clicks (`Side` and an intermediate `Premium` attempt) reported detached-node Browser-control timeouts while the page state still changed; these were recovered with fresh locators and verified from the DOM before continuing. The table was restored to `Net DEI, sorted descending`, `Page 1 of 7350`, with top rows `ASHS`, `BKV`, `QV QVCAQ`, `CATO`, and `QRVO`. No repo E2E script, billing portal, payment, Stripe/Neon mutation, or AI prompt submit was executed.

2026-06-23 Rank Contracts filter/drawer continuation note: active `/app/rank/contracts` filter matrix was re-run with reversible Browser interactions and row-result checks. `Expiry scope <=7D` + `Side = PUT` + `Min contract premium >= $1M` rendered `FILTERS (3 ACTIVE)`, reduced results to `693 total records`, and sampled rows all had DTE `0-4d`, `PUT`, and premium above `$1M`. Numeric inputs `Strike range $700 to $800` + `Delta 0.2 to 0.8` + `Moneyness = Out of The Money` rendered the three chips, reduced results to `2,001 total records`, and sampled rows all matched strike, delta, and `OTM`. `GEX Environment = Positive` + `Min Vol/OI >= 2` + `Net DEI >= 5` rendered the three chips, reduced results to `33 total records`, and sampled rows all had positive GEX, `Vol/OI >= 2`, and `Net DEI >= 5%`. `CLEAR FILTERS` restored `367,492 total records`, `Page 1 of 7350`, and the top `ASHS/BKV/QVCAQ/CATO/QRVO` rows after each combination. The ASHS contract Flow drawer opened, `LOAD INTRADAY 5-MINUTE BUCKETS` loaded intraday size/DEX/premium charts, `POSITIONING` rendered the contract-history prompt, `TRADEABILITY` rendered structure/greeks, and `CLOSE` dismissed cleanly. Browser-control note: the visible `APPLY FILTERS` button did not resolve by exact role name in this run but did resolve as a scoped dialog button by text. No repo E2E script, billing portal, payment, Stripe/Neon mutation, or AI prompt submit was executed.

2026-06-23 Rank Symbols sorter sweep continuation note: active `/app/rank/symbols` loaded `4,766 total records`, `Page 1 of 191`, 25 rows, and no explicit sorted header on the default view. Browser exercised every visible server-backed symbol sorter in both directions with header-state and sampled-row checks: `Symbol`, `Type`, `Total Premium`, `Net Premium`, `Net DEX`, `Net DEI`, `Bullish DEI`, `Bearish DEI`, `Sentiment`, `Call %`, `Call Premium`, `Put Premium`, `Trades`, `Contracts`, `GEX Env`, `Spot`, `IV30`, `ATM IV`, `IV Rank`, `IV Percentile`, `25Δ Skew`, `Term Slope`, `25Δ Bfly`, `Sector`, `Market Cap`, `Avg Stock Vol`, and `Earnings`. A few sorter clicks (`Sentiment`, `Earnings`) detached at the Browser-control layer before toggling; each was retried with a fresh locator and verified before counting. Reload restored the default view with no explicit sorted header and top rows `SPY`, `QQQ`, `NVDA`, `TSLA`, and `SPXW`. No repo E2E script, billing portal, payment, Stripe/Neon mutation, or AI prompt submit was executed.

2026-06-23 Rank Symbols filter/drawer continuation note: the active Symbols filter button still has the accessible name `Open contract narrowing filters`, and opening it shows a `NARROW CONTRACTS` dialog with contract-oriented helper copy even on `/app/rank/symbols`. Functionally, two reversible filters matched results: `Underlying type = ETF` rendered chip `Underlying type: ETF`, reduced results from `4,766` to `1,207`, and sampled rows were all ETFs; `GEX Environment = Positive` plus `Net DEI >= 3` rendered `FILTERS (2 ACTIVE)`, chips `GEX Environment: Positive` and `Net DEI: >= 3`, reduced results to `151`, and sampled rows all had `GEX ENV = POSITIVE` with `NET DEI >= 3%`. `CLEAR FILTERS` restored `4,766 total records` and mixed ETF/STOCK/INDEX rows. The SPY symbol drawer opened from the row action, showed Overview metrics, and the visible tabs rendered content for `Flow`, `Positioning`, `GEX`, `Vol`, `Chain`, and `Overview`; the 30-session Flow history button loaded the chart/table with dated rows from `2026-05-11` through `2026-06-22`. The drawer `Close` button dismissed cleanly back to default `/app/rank/symbols`. No repo E2E script, billing portal, payment, Stripe/Neon mutation, or AI prompt submit was executed.

2026-06-21 billing lifecycle handoff: `trialing+clerk_test@example.com` was exercised from `/app/billing` through Stripe test portal and restored. Browser completed `Add Payment Method` with Stripe test card data in the hosted card iframe, returned to the app, and verified `Trial Active - Payment Method Confirmed`. SDK support, guarded by a local `sk_test_` key, ended the trial to create an active precondition; Browser then verified `/app/billing` showed `Subscription active`. Browser opened `Manage Subscription`, used Stripe portal `Cancel subscription`, and returned to the app showing `SUBSCRIPTION SET TO CANCEL` with `2026-07-20`, matching Stripe's July 20, 2026 portal copy. SDK support then forced terminal `canceled`; Browser verified `/app/billing` showed `SUBSCRIPTION CANCELED` and `/app/option-trades/live` kept Live Mode at `Premium required` while opening upgrade/paywall feedback. Cleanup restored the seeded customer `cus_UCYiFPXSi5JJgb` to trial/no-payment-method state with current subscription `sub_1TkUCWDVsC6tSD27TiYHcPtM`; Browser verified `TRIAL EXPIRES IN 7 DAYS` and Stripe/Neon probe returned `primarySubscriptionStatus: trialing`.

Streaming blocker from the same run: premium access was available while scheduled to cancel, but the Live `Start` button was disabled because the app reported `Market closed` on Saturday, June 20, 2026 in NY time. Do not mark live streaming connected until a run occurs during market hours or the user approves an explicit market-clock/test-fixture override.

Stripe-hosted UI note: in this run the in-app Browser could type into Stripe Elements' cross-origin card iframe. If a future run cannot click or type in that iframe, mark add-card/payment completion as Browser-blocked unless the user approves Chrome or SDK support. SDK support remains support-only evidence, not Browser proof of the hosted card form.

## Goal

Produce an evidence-backed Browser walkthrough report that answers:

1. Does the selected surface work end-to-end for realistic users?
2. What visible UI defects, broken states, layout issues, dead clicks, or confusing flows did the browser walkthrough expose?
3. What is unreasonable or weak from a product manager and option trader perspective?
4. Which UI elements should be added, deleted, merged, updated, or kept?
5. Do premium guards allow paid/trial users to use premium controls while preventing guest or unpaid users from receiving premium data, starting live streams, or mutating gated table state?
6. When billing lifecycle behavior is in scope, can the user complete the Browser-visible test-mode payment, add-payment-method, change-payment-method, payment-status, and cancellation journeys from the app through Stripe-hosted UI and back to the app with the correct billing/access result?
7. When auth or registration is in scope, can a new user create an account with email verification and land in the expected signed-in access state?

## Non-Negotiables

- Use the Browser plugin for product walkthroughs. In Codex, follow the `Browser:control-in-app-browser` skill and use the in-app browser surface.
- Do not substitute `pnpm exec playwright test`, `npx playwright test`, test generators, or repo automation scripts for the walkthrough.
- Do not edit tests, product code, route files, or docs unless the user explicitly expands scope beyond review.
- Do not commit `FINDINGS.md`, screenshots, browser exports, or review artifacts. Findings stay in the session output unless the user asks for a persistent artifact.
- Treat E2E specs as journey maps only: read titles, personas, setup, routes, and expected user outcomes; do not use selectors or spec line numbers as UX evidence.
- Domain truth wins over current code and current tests. If glossary or invariant docs conflict with the observed UI, report the mismatch.
- Do not transmit sensitive data, make purchases, save payment methods, submit destructive forms, change account permissions, or mutate Stripe/Neon billing state unless the user explicitly authorized that exact action for a test environment.
- When the user explicitly authorizes billing lifecycle testing, judge pass/fail from the Browser-visible user action and app result. Stripe SDK/API mutation is support evidence only; it cannot prove that a user can pay, add or change payment method, change payment status, or cancel.
- Do not bypass CAPTCHA, MFA, or account-protection challenges during registration. If a visible CAPTCHA challenge appears, ask the user to complete or explicitly approve the step. Automated E2E may use Clerk's test-token helper, but this Browser product review should treat CAPTCHA as a blocker unless the user intervenes.

## What "Not From Scripts" Means

Allowed:

- Start or reuse the local dev server.
- Read docs, E2E specs, and app code for context.
- Use `@Browser` interactions: navigate, click, type, inspect DOM, check console/network, take screenshots, switch viewports, and verify visible states.
- Use Browser's internal locator or DOM APIs as a control aid.

Forbidden unless the user explicitly changes scope:

- `pnpm exec playwright test ...`
- `npx playwright test ...`
- Running `tests/e2e/**/*.spec.ts`
- Running custom scripts that automate the review in place of interactive Browser walkthroughs.
- Editing specs to make the review pass.
- Treating a screenshot alone as proof of auth, billing, saved preference, stream health, access gate, or route-state correctness.

## Required Context

Set the app repo first:

```bash
cd /Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack
```

Read in this order:

1. `AGENTS.md`
2. Glossary when present. The current checkout may not have `doc/knowledge/glossary.md`; do not block the run on that missing file.
3. Relevant domain docs in the current checkout:
   - Shared auth, billing, access, Watchlist, and app shell context: `doc/domain-knowledge/shared/domain-invariants.md` and `doc/domain-knowledge/shared/functionality.md`
   - Option Trades: `doc/domain-knowledge/option-trades/domain-invariants.md` and `doc/domain-knowledge/option-trades/functionality.md`
   - Rank workbench, Contract-level analysis, Symbol-level analysis: `doc/domain-knowledge/rank/domain-invariants.md` and `doc/domain-knowledge/rank/functionality.md`
   - Cookbooks when in scope: `doc/automation/cookbooks/SKILL.md`; if Network evidence is needed, also read `src/lib/cookbook-snapshots/load.ts` to understand the intended static JSON fetch contract.
4. Shared product review contract when present: `doc/automation/product-review/README.md`
5. Shared E2E policy when present: `doc/automation/e2e-test/e2e-update-skills.md`
6. The module-specific product-review prompt when present:
   - Auth: `doc/automation/product-review/auth-goal-driven-prompt.md`
   - Option Trades: `doc/automation/product-review/option-trades-goal-driven-prompt.md`
   - Contract-level analysis: `doc/automation/product-review/contract-rank-goal-driven-prompt.md`
7. The module-specific E2E prompt and spec as read-only journey maps.

Path drift note: older product-review prompts may still mention `doc/knowledge/glossary.md`, `platform.md`, `option-trades.md`, `rank.md`, `contract-rank.md`, or standalone `/app/contract-rank`. Some checkouts may also lack the older `doc/automation/product-review/*` and `doc/automation/e2e-test/*` prompt files. Prefer the current checkout's `doc/domain-knowledge/{shared,option-trades,rank}/...` files as source of truth, use existing `tests/e2e` specs only as journey maps when prompt docs are absent, and record prompt drift in `Prompt maintenance suggestion`.

## Module Map

| Surface | Primary routes | Domain truth | Read-only journey maps |
| --- | --- | --- | --- |
| Auth, Billing, Access Gates | `/`, `/app`, `/app/billing`, `/app/account`, `/app/settings/profile`, gated app routes | `shared/domain-invariants.md`, `shared/functionality.md` | `doc/automation/product-review/auth-goal-driven-prompt.md`, `doc/automation/e2e-test/auth-goal-driven-prompt.md`, `tests/e2e/specs/auth/` |
| Option Trades | `/app/option-trades`, `/app/option-trades/live`, `/app/option-trades/historical` | `option-trades/domain-invariants.md`, `option-trades/functionality.md`, plus shared docs for Watchlist/access | `doc/automation/product-review/option-trades-goal-driven-prompt.md`, `doc/automation/e2e-test/option-trades-goal-driven-prompt.md`, `tests/e2e/specs/option-trades/option-trades.spec.ts`, `watchlist.spec.ts` |
| Contract-level analysis | `/app/rank/contracts`, legacy `/app/contract-rank` | `rank/domain-invariants.md`, `rank/functionality.md`, plus shared docs for Watchlist/access | `doc/automation/product-review/contract-rank-goal-driven-prompt.md`, `doc/automation/e2e-test/contract-rank-goal-driven-prompt.md`, `tests/e2e/specs/contract-rank/contract-rank.spec.ts` |
| Symbol-level analysis | `/app/rank/symbols`, legacy `/app/symbol-level` or `/app/market-rank` if supported | `rank/domain-invariants.md`, `rank/functionality.md`, plus shared docs for Watchlist/access | `doc/automation/e2e-test/market-rank-goal-driven-prompt.md`, `tests/e2e/specs/market-rank/market-rank.spec.ts`; if product-review prompt is missing, use `product-review/README.md` + rank domain docs |
| Cookbooks | `/app/cookbooks`, `/app/cookbooks/$templateId`, dated `slug~YYYY-MM-DD` reports | `doc/automation/cookbooks/SKILL.md`, `src/lib/cookbook-snapshots/load.ts` | use the gallery/report UI as the journey map; do not run snapshot generation during Browser review |

## Cookbooks Browser Review Rules

- Treat dated Cookbook reports as read-only frozen snapshots. Verify the gallery date picker, snapshot card links, report rendering, TOC anchors, Back navigation, localized report copy, and disclaimer.
- Do not click `New recipe`, private draft delete confirmations, `/edit` workspace links, `Edit with AI`, or submit `Recipe AI` prompts unless the user explicitly authorizes recipe-draft or AI-agent mutation for this run.
- It is safe to open and close `Recipe AI` without submitting when reviewing visible UI, but record that no prompt was submitted.
- If Browser cannot expose Network entries, use source only as supporting evidence for static fetch paths; do not mark "no runtime query / no LLM call" as fully network-proven without a Browser/Chrome network check.

## Runtime Setup

Local default:

```bash
PATH=/opt/homebrew/bin:$PATH pnpm dev
```

Default URL: `http://localhost:8000`

Default credentials from `tests/e2e/fixtures/auth.ts`:

| Persona | Email | Expected state |
| --- | --- | --- |
| Guest | Clean Browser context / cleared Clerk cookies | Public preview or `LoginModal` gates |
| Active | `active+clerk_test@example.com` | Paid/entitled baseline |
| Canceled | `canceled+clerk_test@example.com` | Signed-in unpaid baseline |
| Trial without payment method | `trialing+clerk_test@example.com` | Trial access granted, payment method still needed |
| Trial with payment method | `trialingwithpayment+clerk_test@example.com` | Trial access granted, payment method confirmed |

Seeded test-account OTP defaults to `424242` unless the repo docs or user say otherwise. Fresh disposable registration must use the code actually delivered to Gmail.

Before using these credentials in a Browser review, re-open `tests/e2e/fixtures/auth.ts` in the app repo and confirm the scenario labels and email defaults have not drifted. Environment overrides such as `E2E_LOGIN_EMAIL_ACTIVE` can change the actual seeded account in a local checkout.

## Browser Registration Test

Use this section whenever auth, signup, onboarding, or guest-to-user conversion is in scope. The app-under-test interactions must happen in `@Browser`; Gmail or Chrome is only support for retrieving the verification code.

Disposable email pattern:

- Preferred manual Browser-review address family: `evanzhousyforward+<date-or-run-id>@gmail.com`, for example `evanzhousyforward+0619codex1552@gmail.com`.
- The verification email should arrive in the base Gmail mailbox `evanzhousyforward@gmail.com`.
- Use a unique plus-address per run. If a run is retried after code expiry or account creation, generate a new suffix instead of reusing the same alias.

OTP retrieval order:

1. Prefer the Gmail connector when it is already available or the user approves installing it.
2. If the Gmail connector is unavailable and the user has approved `@Chrome`, use `plugin://chrome@openai-bundled` to open Gmail and read the latest verification email for the alias.
3. If neither path is available, stop at the verification-code screen and ask the user for the OTP. Do not guess or bypass the code.
4. Do not include the OTP value in the final report unless the user explicitly asks. Record only that the OTP was retrieved from the approved mailbox path.

Manual Browser procedure:

1. Start from a signed-out state:
   - Verify the header shows `Sign in` or equivalent signed-out copy.
   - If a previous avatar/email is visible, sign out and clear Clerk/browser session state before continuing.
2. Open the app route under review, normally `/app/option-trades/live` or the auth entrypoint requested by the user.
3. Open `LoginModal` from the visible app CTA or gate.
4. Switch to `Create account` / registration mode.
5. Enter the unique disposable email alias and submit.
6. CAPTCHA handling:
   - If the Clerk CAPTCHA container is present but no visible challenge blocks the flow, continue.
   - If a visible CAPTCHA, MFA, or account-protection challenge appears, stop and ask the user to complete or approve the step. Do not use automated CAPTCHA bypasses in this Browser review.
7. Verify the modal advances to the code-entry state and clearly shows the target email alias.
8. Retrieve the OTP from Gmail using the approved support path.
9. Enter the OTP in Browser and submit.
10. Verify post-registration state:
    - Login modal closes.
    - Header shows user avatar or signed-in account control.
    - User/account menu shows the exact disposable email.
    - `/app/billing` or the current app surface shows the expected new-user access state, such as trial banner, add-payment CTA, or default free/trial guard.
    - The route under review recovers without losing the intended return path.
11. If registration is part of premium-guard review, continue with the same account only after recording it as a new-user/trial scenario. Do not assume it replaces the seeded `active`, `canceled`, `trial_no_pm`, or `trial_with_pm` accounts unless the billing state proof matches one of those scenarios.

Automated E2E note:

- Repository E2E registration may use Clerk's testing token helper and `#clerk-captcha` fixture support.
- That helper is not proof for this Browser product review. Browser review requires a real visible create-account flow unless the user explicitly changes scope to automated E2E certification.

## Premium Guard Account Matrix

Use this section whenever the requested surface includes auth, billing, paid controls, premium data, live data, export/download, gated filters, drawers, or cross-route handoffs into premium surfaces. The goal is to prove the premium guard with real Browser interaction, not to assume it works because an account is signed in.

| Scenario | Required account state proof | Expected premium-control behavior |
| --- | --- | --- |
| Guest | Clean context, signed-out header or login prompt, no user avatar | Gated actions open `LoginModal` or redirect to sign in; premium table/filter/live/export state must not apply as if entitled |
| Active | `/app/billing` and app chrome show paid access for `active+clerk_test@example.com` | Premium controls work; filters/sorters/live/export/drawer content visibly update or open as intended |
| Canceled | `/app/billing` shows no active subscription for `canceled+clerk_test@example.com` | Premium controls open `PaywallModal` or upgrade CTA; gated table/result state does not mutate behind the paywall |
| Trial without payment method | `/app/billing` shows trial access plus payment-method-needed messaging | Premium controls work, but billing clearly asks for payment method; add-payment CTA may reach Stripe test flow but must not be completed unless explicitly authorized |
| Trial with payment method | `/app/billing` shows trial access with payment method confirmed or equivalent reassurance | Premium controls work; UI must not incorrectly ask for a payment method |

Minimum cross-account pass:

1. Start from a clean guest context and verify at least one premium action per scoped surface opens the correct guest gate.
2. Sign in as `active`, prove billing/access state, and exercise the same premium actions until the table, drawer, stream, or export affordance visibly behaves as entitled.
3. Sign out fully, then sign in as `canceled`; prove billing/access state changed to unpaid and repeat the same premium actions. The visible outcome must be paywall/upgrade, not premium data access and not a silent no-op.
4. If trial behavior is in scope, repeat with `trial_no_pm` and `trial_with_pm`; both should have premium access, but billing copy and CTAs must differ by payment-method status.
5. After every account switch, verify the displayed email or account identity plus `/app/billing` state before continuing. If the identity or billing state did not change, clear Clerk/browser session state and retry; do not count the run.

Safety rule: do not complete Stripe checkout, add a payment method, change a subscription, or mutate seeded account billing state during a normal product review. In a normal review, verifying that a button reaches Stripe Checkout or the customer portal proves CTA wiring only; it does not prove that the user can pay, add or change payment method, change payment status, or cancel. If the user explicitly asks to test payment, add-payment-method, change-payment-method, cancel, payment-status change, or billing-access behavior in a test environment, use `Authorized Browser Payment Capability Test` below.

## Authorized Browser Payment Capability Test

Use this section only when the user explicitly asks to test payment, add-payment-method, change-payment-method, cancel, payment-status change, or billing-access behavior in a test environment. The testing goal is the user-visible Browser journey: the user starts from the app, completes the Stripe-hosted step a real user would take, returns to the app, and sees the correct billing/access result. Do not call this a Stripe mutation test; Stripe mutation is only fixture support.

Intent boundary:

- Name the objective and findings in user-capability language: `user can make payment`, `user can add payment method`, `user can change payment/billing status`, `user can cancel`, or `user cannot ... because ...`.
- The product test asks whether the user can make payment, add a payment method, change payment method, change payment status through a user-facing billing flow, cancel or schedule cancellation, and still see correct access status in the app.
- This is not a Stripe state-mutation test. A Stripe SDK/API state change can help set up, verify, force a terminal state, or clean up a scenario, but it is not the evidence that the user flow works.
- If the app or Stripe-hosted UI blocks a Browser step, report that capability as `blocked` or `fail`; do not replace the missing Browser step with an SDK/API mutation and call it passed.
- If terminal `canceled` cannot be produced through the user-facing portal, first test the Browser cancellation path that the user can actually perform, then use SDK/API only to force a disposable subscription into terminal `canceled` for app-state verification.
- Treat `payment-status change` as a Browser-initiated user transition, such as trial/no-payment-method to trial-with-payment-method or active, active to scheduled cancellation, or active to terminal canceled when the portal exposes immediate cancellation. Direct SDK/API status mutation is fixture support, not the user capability under test.

Browser-first pass rules:

- To mark `user can make payment`, `user can add payment method`, `user can change payment method`, `user can change payment status`, or `user can cancel payment/subscription` as passed, the agent must perform the corresponding app and Stripe-hosted UI action in Browser and verify the visible result after returning to the app.
- SDK/API state mutation may create a precondition that would be slow or impossible to reach safely through UI, verify the canonical Stripe/Neon state, force a terminal state that the UI cannot produce directly, or restore the seeded account.
- Do not report a user payment capability as passed when the only evidence is a Stripe SDK update.
- If `browserAction` is empty, skipped, or replaced by SDK/API mutation, the user capability is `blocked` or `fail`; the SDK/API step can only explain support work in `sdkSupportUsed`.
- Put SDK/API work in the `sdkSupportUsed` column of `BillingLifecycleMatrix`; never put SDK/API mutation in `browserAction` as a substitute for the user action.

Required safety gates before any payment-capability test:

1. Confirm the target app repo is `/Users/evansmacbookpro/Desktop/Projects/tradingflow-webapp-fullstack`.
2. Read `.env.local` or the active runtime config locally and require the Stripe secret key used for verification or cleanup to start with `sk_test_`. Abort on missing key, `sk_live_`, or unknown key source.
3. Treat Stripe connector/plugin results as unsafe for mutation until proven test-mode. If any fetched Stripe object has `livemode: true`, do not mutate through that connector. Use only the local test key or stop.
4. Use only Stripe test cards or test tokens on Stripe-hosted pages. Never enter a real card, real address beyond harmless test values, or personal payment data.
5. Verify the target Clerk/Neon user and current Stripe customer before the run. For the seeded trial-no-payment account, expected baseline is:
   - Email: `trialing+clerk_test@example.com`
   - Original Stripe customer: `cus_UCYiFPXSi5JJgb`
   - Current restored subscription: currently `sub_1TkUCWDVsC6tSD27TiYHcPtM` in the local test environment; verify live before mutating because seeded Stripe IDs can drift after lifecycle tests.
   - Expected baseline state: `trialing`, `cancel_at_period_end=false`, no `default_payment_method`, no attached card payment methods.
6. Prefer disposable test customers/subscriptions for destructive or hard-to-restore states. If the seeded user's Neon `stripe_customer_id` is repointed to a disposable customer, restore it before final response.
7. Print only safe object IDs and statuses. Do not print API keys, raw env files, Clerk secrets, full card details, or full payment method payloads.

Browser capability pattern:

1. Prove the starting state in Browser:
   - `/app/billing` shows the expected account state and CTA, such as `Add Payment Method`, `View Plans`, `Manage Subscription`, or `Manage Payment Methods`.
   - The header/account identity matches the intended Clerk user.
2. Test payment or add-payment-method through UI:
   - Click the app CTA in Browser (`Add Payment Method`, `View Plans`, paywall CTA, or equivalent).
   - Verify navigation to Stripe Checkout or Customer Portal test flow.
   - Complete the Stripe-hosted test flow only after the user has explicitly authorized this payment-capability test and test mode is verified.
   - Return to the app and verify billing refreshes to the expected state, such as active/trial-with-payment-method copy, subscription management controls, or premium access.
3. Test changing payment method through UI:
   - Start from a state that has a payment method.
   - Open `Manage Payment Methods` or the customer portal from `/app/billing`.
   - Add, replace, or set a default test payment method using the Stripe-hosted UI.
   - Return to the app and verify visible billing copy, portal success state, and canonical Stripe state if the app does not display card metadata.
4. Test canceling through UI:
   - Open `Manage Subscription` or the customer portal from `/app/billing`.
   - Use the Stripe-hosted cancellation flow a real user would use.
   - Return to the app and verify `cancel_at_period_end` / scheduled-cancel copy when the portal schedules cancellation.
   - Verify premium access behavior still matches the scheduled-cancel contract.
5. Test terminal canceled status when required:
   - If the product must handle immediate `canceled` but the user-facing portal only creates scheduled cancellation, use Stripe SDK/API only to move the disposable test subscription to the terminal canceled state after the Browser cancel flow has already been tested.
   - Browser-verify `/app/billing` canceled copy, hidden/gated paid management controls, and premium guard behavior on the scoped app route.
6. When starting from `trialing+clerk_test@example.com`, cover the full seeded-account lifecycle the user requested:
   - Prove the initial `/app/billing` state is trial access with no payment method.
   - Use Browser to start from the app CTA, complete the Stripe-hosted add-payment or checkout flow with Stripe test data, return to the app, and verify payment-method/active-access state plus premium surface access.
   - Use Browser to open the billing portal from the app, cancel through the user-facing cancellation flow, return to the app, and verify scheduled-cancel or canceled copy plus the correct access behavior.
   - If immediate terminal `canceled` cannot be produced from the user-facing portal, use SDK/API only after the Browser cancel flow, preferably on a disposable subscription, then Browser-verify the app's terminal canceled state.
   - Restore the seeded user to the original trial/no-payment-method baseline before final response.
7. Restore the seeded user:
   - Update Neon `users.stripe_customer_id` back to the original customer id if it was changed.
   - Ensure the seeded customer has exactly one current access subscription that is `trialing` and not set to cancel.
   - Ensure the original customer has no default payment method and no attached card payment methods when restoring `trialing+clerk_test@example.com`.
   - Detach payment methods from disposable customers when possible.
   - Delete disposable customers when possible.
8. Browser-verify restored state:
   - `/app/billing` shows the original trial/no-payment-method banner and management state.
   - `/app/option-trades/live` or the scoped premium surface regains entitled access.
   - If Live streaming is in scope, click `Start`, wait for `Connected` / `Pause`, and verify populated rows.

Support-only SDK/API examples:

- Create a disposable Stripe test customer/subscription only to isolate the seeded user from destructive tests.
- Use metadata such as `codex_billing_state_test=active_cancel_restore`, `restore_customer_id=<original customer id>`, and `neon_user_id=<Neon user id>` on disposable objects.
- Verify canonical state after Browser actions when app UI does not expose enough detail.
- Force terminal canceled state only after the Browser cancellation flow has already been tested and only on a disposable test subscription.
- Restore Neon and Stripe test fixtures before final response.
- Never use these SDK/API examples as a replacement for Browser proof that the user can perform the corresponding billing action.

Minimum evidence to report:

| Evidence | Required proof |
| --- | --- |
| Test-mode guard | State that all payment lifecycle actions used Stripe test mode; do not reveal the key |
| Original baseline | User id, email, original customer id, original subscription id, original status, payment-method absence |
| Browser payment/add-card flow | App CTA clicked, Stripe-hosted test flow reached/completed, return URL or app billing success state, premium access result |
| Browser change-card flow | Portal/payment-method UI action performed, returned app state, canonical default/payment-method proof when app UI lacks card metadata |
| Browser cancel flow | Portal subscription-cancel action performed, returned app scheduled-cancel or canceled copy, premium access result |
| Support-only SDK terminal-state verification | If used, explain the UI limitation, disposable subscription id, status transition, linked Browser cancel-flow evidence, and Browser proof after mutation |
| Restore state | Neon pointer restored to original customer id, original subscription status, no attached payment methods |
| Live data | Connected/Pause state plus non-empty sampled rows when streaming is in scope |

Failure recovery:

- If any SDK/API step fails after the Neon pointer changes, restore the pointer to the original customer id before investigating further.
- If the Browser payment or portal flow cannot be completed, report the visible blocker and do not replace that missing Browser evidence with SDK mutation.
- If Stripe Elements card fields are visible but the in-app Browser cannot click or type into the cross-origin iframe, record the Stripe test portal URL and visible form as Browser evidence, then stop for user approval before using `@Chrome` or SDK support. If SDK support is approved, use Stripe test tokens such as `tok_visa` instead of sending raw card numbers to the API.
- If a disposable customer cannot be deleted, detach its test payment methods, leave the original user restored, and report the disposable customer id for cleanup.
- If Browser still shows stale billing after Stripe/Neon changes, wait for billing refetch, reload `/app/billing`, and verify the canonical state from Stripe/Neon before filing a UI bug.
- If Stripe's API shape lacks top-level `current_period_end`, inspect subscription item `current_period_end` and `cancel_at`; do not assume `N/A` is acceptable billing copy.

## Browser Plugin Procedure

1. Read and follow the Browser plugin skill before browser work. The required plugin is `plugin://browser@openai-bundled`.
2. Use the in-app Browser. Keep it hidden unless the user explicitly wants to watch.
3. Do not fall back to Chrome, standalone Playwright, Computer Use, or web search for local app testing unless `@Browser` is unavailable and the user approves the fallback.
   - Exception: when registration testing needs an email verification code, user-approved `@Chrome` may be used only to visit Gmail and retrieve the OTP. Continue using `@Browser` for the TradingFlow app itself.
4. Before each interaction, know the current visible state. After each click, type, navigation, filter apply, modal action, or viewport switch, collect the cheapest verification signal:
   - DOM/state snapshot for labels, roles, enabled state, route, modal open/closed.
   - Screenshot only when visual layout, overlap, chart rendering, table density, or mobile fit matters.
   - Console/network inspection when a UI error, blank widget, dead action, or failed load is suspected.
5. Use a clean Browser context for guest checks. Do not confuse signed-out UI with cached Clerk/session state.
6. Reload after code or build changes only if implementation scope was added. For review-only sessions, do not modify code.

## Workflow

### 0. Scope The Run

Write a short scope block before opening the UI:

- Surface(s) and routes.
- Personas: guest, active, canceled, trial, or user-specified.
- Registration scope: whether to create a fresh disposable account, which alias pattern to use, and which approved Gmail path will retrieve the OTP.
- Premium-guard scope: list the gated controls or data surfaces to compare across account states. If any paid control is in scope, include guest, active, and canceled at minimum; include both trial states when the user asks about Stripe/subscription status or trial UX.
- Billing-capability scope: if payment lifecycle behavior is in scope, list the exact user capabilities to prove in Browser, such as make payment, add payment method, change payment method, change payment status, schedule cancellation, immediate canceled-state handling, restore seeded state, and streaming/access after billing change.
- Viewports: desktop default and mobile if the surface has responsive controls.
- Explicit non-goals.
- Whether this is review-only or user-approved implementation follow-up.

### 1. Build The Journey Map

Use the read-only E2E docs and specs to turn test coverage into user outcomes:

1. List relevant `test.describe` / `test(...)` titles and module prompt journey IDs.
2. Translate them into user-language journeys, not selector tasks.
3. Merge duplicates into a compact `BrowserJourneyCoverage` checklist.
4. Add exploratory checks that E2E scripts usually miss: visual layout, copy clarity, scanability, empty/loading/error states, mobile fit, and cross-route continuity.

Do not paste Playwright locators into the walkthrough plan unless they are the only stable way to identify a control internally. User-facing findings must cite visible behavior, copy, URL, persona, and state.

### 2. Pass 0: Greenfield Model

Before opening the route, state:

- The primary user or trader job.
- The ideal workflow if this product did not already exist.
- One sentence product promise.
- The clearest path to a useful decision or conversion.

This pass prevents "the existing UI works as designed" from becoming the default answer.

### 3. Browser Walkthrough

For each persona and route in scope:

1. Navigate from the route a real user would use, not only a deep link.
2. Verify the initial state: title, nav location, loading state, data presence or empty state, account state, and visible gates.
3. Exercise the journey actions in Browser:
   - Auth and billing: login, registration with disposable email and OTP, logout, gate redirects, billing/account/profile flows, subscription copy, guest-to-signed-in recovery, and explicitly authorized test-mode payment/add-card/change-card/cancel journeys through the app and Stripe-hosted UI.
   - Option Trades: Historical/Live modes, filters, date/time controls, chips, Watchlist/symbol scope, saved filter behavior, column layout, sorting, pagination, export affordance, Live status/empty/error states.
   - Contract-level analysis: Rank shell tabs, preview vs paid snapshot, filters/sort/pagination, symbol/watchlist scope, KPI/brief, row inspect, drawer tabs, exact-contract Option Trades handoff.
   - Symbol-level analysis: Rank shell tabs, symbol filters/sort, drawer tabs, Watchlist/symbol lookup, Option Trades handoff, premium gates.
4. For each action, record the visible outcome and whether it matches the domain invariant.
5. For each account state, record the billing/access proof before recording premium-control results. A premium-control result without account-state proof is not valid evidence.
6. Switch to mobile viewport for any surface with sheets, drawers, tabs, dense tables, or modal controls. Check for overlap, clipped text, scroll traps, unusable tap targets, and lost state.
   - After setting a Browser viewport override, verify `window.innerWidth` and `window.innerHeight` changed before counting mobile coverage. If the Browser still reports desktop dimensions, mark mobile verification as Browser-capability blocked for this run instead of claiming a mobile pass from desktop layout.

### 3A. Exhaustive Control Matrix

For data-app surfaces, do not assume a visible control works because it renders or because a test spec names it. Build and execute an `ElementActionMatrix` for every user-facing actionable element in scope:

1. Inventory the rendered controls by visible UI group:
   - Tabs, segmented controls, date/session selectors, symbol/watchlist controls, filter dialogs, numeric inputs, switches, column pickers, sort headers, pagination, export/download, refresh/live controls, row actions, drawer tabs, and handoff buttons.
   - Record disabled controls too, including whether the UI explains why they are disabled.
2. Exercise each actionable control at least once with Browser interaction.
3. After every filter, sorter, input, date/time, symbol/watchlist, or pagination change, verify the table/result state:
   - For visible table fields, every visible row sampled must match the selected value or numeric range.
   - For sorters, the active sort indicator must change and visible row values must be ordered in the displayed direction after the table settles.
   - For pagination/page-size controls, the visible row count and page label must match the selected setting.
   - For symbol/watchlist filters, the trigger/chip and visible row symbols must both reflect the selection.
   - For columns, the header set and row cell alignment must change consistently.
4. If a control affects data that is not represented in the visible UI, mark it as `not directly verifiable from UI`, then still verify applied chips, row-count/result changes, loading/error handling, and absence of contradictory success/failure feedback. File a UX/testability finding when a trader cannot tell whether the control did what it says.
5. Wait for the final settled state before judging a control. A first non-loading DOM frame is not sufficient when rows continue to update after a filter/date/symbol change.
6. When the page cannot load rows, record the exact blocker and do not claim filter/sorter coverage for that surface. Test any controls still available in the blocked state, such as disabled explanations, refresh, date selectors, tabs, and empty/loading copy.

### 3A.1 Option Trades Saved Filter Lifecycle

When `/app/option-trades/live` or `/app/option-trades/historical` filter behavior is in scope for an entitled account, execute a reversible saved-filter lifecycle test in Browser and report it in `SavedFilterLifecycleMatrix`.

Use a clearly temporary name, such as `Codex Saved Filter <date>`, and delete it before finishing unless cleanup is blocked. Do not delete user-created saved sets except temporary sets created during the run.

Required active-account coverage:

1. Prove the starting state: account email, active/trial entitlement, route, active saved-filter trigger label, applied chips, row count/page label, and sampled rows.
2. Open the real filter dialog and inventory saved-set rows plus row actions: select row, `Use`, rename, duplicate, set default, delete, `Create from Current View`, `Reset to Defaults`, `Apply`, and `Close`.
3. Change a draft filter that has visible row evidence, preferably `Size` or `Open Interest`. Do not apply it yet.
4. Click `Create from Current View`.
   - Expected: an in-app name entry UI appears, not a native browser prompt and not a silent no-op.
   - If a generic `New Saved Filter Set` already exists, verify the default proposed name is unique or that the new row is otherwise visibly distinguishable.
5. Submit the temporary name and verify a new saved-filter row appears after the server round trip.
6. Prove the saved set captured the draft:
   - Switch/select another saved set so the draft field changes away from the temporary value.
   - Select the temporary set again and verify the edited filter value returns.
7. Apply or `Use` the temporary set and verify table state:
   - Filter chips and the toolbar saved-filter label reflect the temporary set.
   - The table settles, row count/page label changes when expected, and sampled visible rows satisfy the saved numeric range or selected filter.
   - The `Use` action gives clear feedback, such as closing the dialog or updating the toolbar; it must not leave the user unsure whether anything happened.
8. Reload the route and verify the active saved-filter label, chips, and sampled rows persist.
9. Navigate between Live and Historical and verify shared saved-filter state behaves according to the product contract. If Live cannot stream because the market is closed, still verify the saved-filter label/chips and sampled loaded rows when rows are available.
10. If auth/account persistence is in scope, sign out and back into the same account and verify the active saved-filter selection and saved set contents both restore.
11. Test rename using the row action.
   - Expected: visible app UI appears, the current name is prefilled, Save updates the row, and failure is visible.
   - File a finding if rename uses an invisible native prompt, silently no-ops, or loses the saved set.
12. Test duplicate and set-default when available.
   - Expected: duplicate creates a distinguishable non-default copy; set-default moves exactly one default marker and does not confuse default vs in-use state.
13. Test delete cleanup for the temporary set.
   - Expected: non-default temporary set deletes, active state falls back to a valid saved set, and default/last-set deletion is disabled with clear copy.
   - Verify delete icon buttons have accessible labels/tooltips.
14. Reopen the dialog at the end and verify only the intended non-temporary saved sets remain. Record any cleanup blocker with row names and route state.

Required gated-account coverage when premium guard is in scope:

1. Guest users: open saved-filter controls and verify login feedback appears; the table/filter state must not mutate behind the login modal.
2. Canceled/unpaid users: open saved-filter controls and verify upgrade/billing feedback appears; the table/filter state must not mutate behind the paywall.
3. Trial and active users: saved-filter lifecycle should behave as entitled; differences should be billing copy only, not saved-filter access.

Do not mark saved-filter coverage complete when:

- Only row creation is tested without proving the saved draft affects table results.
- The active saved-filter label changes but sampled rows/chips do not match the saved filter.
- The run does not test reload persistence.
- Temporary test saved sets are left behind without an explicit cleanup blocker.

### 3B. Premium Guard Verification

When a route exposes any paid or high-value action, build an `AccessTierGuardMatrix` before the final report. Cover every user-facing gated control in the scoped surface, not just one representative CTA.

Required gated-control inventory:

- Route access and deep links.
- Premium filters, date/session controls, saved filters, Watchlist-only scopes, live stream/start controls, refresh controls, export/download, column sets, drawers, detail tabs, cross-route handoff buttons, and table row actions.
- Billing, account, subscription banners, plan CTAs, manage-subscription CTAs, add-payment CTAs, paywall/login modals, and gate copy.

For each gated control:

1. Capture the baseline visible state before the click: route, persona, account email or signed-out state, billing/access proof, active chips/sort, visible row count, first sampled rows, and modal/drawer state.
2. Click or type in Browser as the current persona.
3. Verify the settled result:
   - Active and trial accounts: the control should perform the paid action, and table-affecting actions must visibly change rows, chips, sort indicators, route state, drawer content, stream status, or export affordance as appropriate.
   - Canceled accounts: the control should show paywall or upgrade copy, and the underlying premium result must not silently apply. Confirm table rows, active filters, live status, drawer content, and export state did not change as if entitled.
   - Guest accounts: the control should show login or redirect to sign-in, and the underlying premium result must not silently apply.
4. Compare the same control across at least guest, active, and canceled. If trial states are in scope, compare both trial states against active for access and against each other for billing/payment-method copy.
5. If a gate opens Stripe test checkout or the customer portal during a normal product review, record only the safe navigation evidence and return to the app. Do not complete checkout, add payment methods, or change subscriptions. If the user explicitly authorized a payment-capability test, continue under `Authorized Browser Payment Capability Test` and record the completed Browser user flow in `BillingLifecycleMatrix`.

Do not mark premium-guard coverage complete when:

- Only the active account was tested.
- The run did not prove the account state after switching users.
- A modal appeared but the underlying table/result state was not checked for accidental mutation.
- A control has no visible verification signal and no UX/testability finding explains that gap.

### 4. UI Defect Sweep

Look specifically for:

- App crash, error boundary, blank route, blank chart/widget, or infinite spinner.
- Dead click, disabled control with no explanation, wrong modal (`LoginModal` vs `PaywallModal`), or action with no visible feedback.
- Text overflow, clipped labels, hidden buttons, overlapping sticky headers, inaccessible mobile controls, and horizontal scroll that hides primary actions.
- Conflicting copy, stale labels, wrong canonical product names, implementation terms visible to users, or copy that contradicts the glossary.
- Broken route state: reload loses committed state where the contract says it should persist, or query params leak where docs say state should be local/path-only.
- Loading, empty, market-closed, live-streaming, stale-data, and error states that do not explain what happened or what to do next.
- Console errors that correlate with visible breakage.
- Network failures that leave the user in a misleading success state.
- TradingView widgets that are blank only on this Mac. Before filing a product bug, check whether Shadowrocket/fake-IP routing is blocking `www.tradingview-widget.com`.

### 5. Product And Option Trader Review

Judge the surface with these dimensions:

| Dimension | What to ask |
| --- | --- |
| `speedToInsight` | How fast can the user reach the first useful read? |
| `scanability` | Can a trader compare rows, contracts, symbols, metrics, and states without fighting the UI? |
| `decisionConfidence` | Are freshness, caveats, context, and metric labels strong enough to support a trading/research decision? |
| `dataTrust` | Are delayed/intraday/historical/live states explicit and credible? |
| `controlErgonomics` | Are filters, sorting, tabs, drawers, sheets, and reset/apply flows discoverable and efficient? |
| `statePersistence` | Do saved preferences, route state, reload, and tab switches behave as promised? |
| `crossRouteHandoff` | Does movement to related surfaces preserve enough context to continue the job? |
| `accessConversion` | For auth/paywall surfaces, does the gate explain value and recover cleanly? |

For option-trader judgment, prioritize the trader's workflow over visual polish: contract identity, symbol/date/put-call/strike, premium and liquidity context, volume/OI, delta, GEX/regime context, live/off-hours truth, and ability to carry context into Option Trades.

### 6. Synthesize Findings

Deduplicate as you go. A finding is real when it has:

- Persona.
- Route and viewport.
- Visible evidence.
- Expected behavior from invariant/docs or clear PM/trader job.
- Consequence.
- Acceptance signal for a future browser review.

Do not file a product bug for missing account data, market-closed live states, empty Watchlist, or local network/proxy problems unless the UI fails to explain or recover from those states.

## Required Output

### BrowserJourneyCoverage

| Field | Meaning |
| --- | --- |
| `journeyId` | Stable ID from module prompt or local ID, e.g. `OT-BROWSER-LIVE-001` |
| `surface` | Route or area |
| `persona` | Guest, active, canceled, trial, or other |
| `viewport` | Desktop, mobile, or exact size |
| `journey` | User-outcome phrasing |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, state/copy observed, screenshot label, console/network note |

### RegistrationFlowMatrix

Required when auth, signup, registration, onboarding, or guest-to-user conversion is in scope.

| Field | Meaning |
| --- | --- |
| `step` | `signed_out_start`, `open_auth_modal`, `switch_to_register`, `submit_email`, `captcha_or_protection`, `otp_sent`, `otp_retrieved`, `otp_submitted`, `post_register_identity`, `post_register_access_state`, or user-specified |
| `route` | Route and modal/surface where the step was exercised |
| `emailAlias` | Disposable alias used, such as `evanzhousyforward+0619codex1552@gmail.com`; do not include passwords or OTP values |
| `browserAction` | Browser action performed in the TradingFlow app |
| `supportTool` | `gmail_connector`, `chrome_gmail`, `user_provided_otp`, `none`, or `blocked` |
| `visibleResult` | Settled UI state, modal copy, identity proof, account menu copy, billing/access banner, or return-path result |
| `expectedBehavior` | What the auth/platform contract requires |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, visible copy, approved Gmail path note, screenshot label, console/network note; never print OTP values unless explicitly requested |

### AccessTierGuardMatrix

Required when premium guard, auth, billing, subscription, trial state, or any gated data/action is in scope.

| Field | Meaning |
| --- | --- |
| `control` | User-facing gated route/control/action, e.g. Live Start, export, premium filter, drawer tab, billing CTA |
| `route` | Route and panel/modal/drawer where it was exercised |
| `accountScenario` | `guest`, `active`, `canceled`, `trial_no_pm`, `trial_with_pm`, or user-specified |
| `accountStateProof` | Visible email/session plus billing/access state observed before the action |
| `beforeState` | Relevant route, chips, sort, row count, first sampled rows, modal/drawer state, live status, or CTA state before interaction |
| `actionTaken` | Browser action performed |
| `afterState` | Settled visible result after the action |
| `expectedGuard` | What `platform.md` and module invariants require for that account state |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, visible copy, screenshot label, console/network note, or safe Stripe destination note |

### SavedFilterLifecycleMatrix

Required when Option Trades saved-filter behavior is in scope. Each row should describe one Browser-proven capability or blocker from the saved-filter lifecycle, not an implementation assumption.

| Field | Meaning |
| --- | --- |
| `capability` | `inventory`, `create_from_draft`, `draft_restore`, `apply_or_use`, `reload_persistence`, `account_switch_persistence`, `cross_live_historical`, `rename`, `duplicate`, `set_default`, `delete_cleanup`, `guest_guard`, `canceled_guard`, or user-specified |
| `route` | Route and dialog/panel where the action was exercised |
| `accountScenario` | `active`, `trial_no_pm`, `trial_with_pm`, `guest`, `canceled`, or user-specified |
| `beforeState` | Active saved-set label, chips, row/page count, sampled rows, dialog state, and relevant draft field value before interaction |
| `browserAction` | Exact Browser-visible action performed, such as `Create from Current View`, row rename, row `Use`, reload, sign-out/sign-in, Live/Historical navigation, or delete |
| `afterState` | Settled UI result: saved-set row label, active toolbar label, chips, field value, table rows, modal/paywall/login feedback, or cleanup state |
| `expectedBehavior` | Product contract for saved filters and account access |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, saved-set temporary name/id when safe, visible copy, sampled row values, screenshot label, console/network note, or cleanup blocker |

### BillingLifecycleMatrix

Required when the user explicitly asks to test payment, add-payment-method, change-payment-method, payment-status change, cancellation, or billing-access behavior. Keep the existing matrix name for continuity, but treat it as a user payment-capability evidence matrix. SDK/API evidence can support this matrix, but each user capability must have Browser evidence or be marked `blocked`/`fail`.

Do not produce a passed row when the `browserAction` is only "mutated Stripe status", "updated subscription with SDK", "changed Neon row", or any other backend-only fixture action. Those actions belong in `sdkSupportUsed`; the pass/fail claim belongs to what the user actually did and saw in Browser.

| Field | Meaning |
| --- | --- |
| `capability` | User-facing capability such as `make_payment`, `add_payment_method`, `change_payment_method`, `change_payment_status`, `schedule_cancel`, `terminal_canceled_state_visible_in_app`, `restore_seeded_state`, or user-specified |
| `startingState` | Account email, visible billing state, Stripe/Neon baseline when used |
| `browserAction` | The app and Stripe-hosted UI actions actually performed in Browser; never use SDK/API mutation as this value |
| `browserResult` | Visible settled state after returning to the app |
| `sdkSupportUsed` | `none`, `precondition`, `canonical_verify`, `terminal_state`, or `cleanup_restore`; include safe object IDs only and explain how the SDK/API action supported the Browser journey |
| `expectedBehavior` | What the billing/access contract requires |
| `status` | `pass`, `fail`, `blocked`, or `not-in-scope` |
| `evidence` | URL, visible copy, safe Stripe destination note, safe object IDs/statuses, or console/network note |

### ProductReviewFinding

| Field | Meaning |
| --- | --- |
| `id` | Stable ID, e.g. `OT-UX-001`, `CR-UX-001`, `AUTH-UX-001` |
| `severity` | `Critical`, `High`, `Medium`, or `Low` |
| `action` | `add`, `delete`, `merge`, `update`, or `keep` |
| `surface` | Route, panel, drawer, table, modal, gate, chart, handoff |
| `personaJob` | User/trader job being blocked or improved |
| `observedFriction` | What was visible in the browser |
| `traderConsequence` | Why it matters for speed, trust, decision quality, or conversion |
| `greenfieldTarget` | Cleaner product shape from Pass 0 |
| `recommendation` | PM-level recommendation, not implementation steps |
| `evidence` | URLs, visible copy, state descriptions, screenshot labels, console/network correlation |
| `acceptanceSignal` | What a future Browser review would see to call it resolved |

### ElementActionMatrix

| Field | Meaning |
| --- | --- |
| `elementControl` | UI element, control, copy block, chart, tab, table affordance, modal, or handoff |
| `currentRole` | What it appears to do today |
| `action` | `add`, `delete`, `merge`, `update`, or `keep` |
| `rationale` | Why this follows from the user job and invariant contract |
| `expectedImpact` | Expected improvement |
| `riskTradeoff` | What could get worse or needs product decision |

### TraderScorecard

Use concise ratings or notes for:

- `speedToInsight`
- `scanability`
- `decisionConfidence`
- `dataTrust`
- `controlErgonomics`
- `statePersistence`
- `crossRouteHandoff`
- `accessConversion` when auth/paywall is in scope

### Final Report Shape

1. Scope and environment.
2. Browser procedure summary: routes, personas, viewports, and whether Browser was hidden or visible.
3. BrowserJourneyCoverage table.
4. RegistrationFlowMatrix when auth/signup/registration is in scope.
5. AccessTierGuardMatrix when premium guard/auth/billing is in scope.
6. SavedFilterLifecycleMatrix when Option Trades saved filters are in scope.
7. BillingLifecycleMatrix when payment/add-card/change-card/cancel behavior is in scope.
8. Ranked ProductReviewFinding table.
9. ElementActionMatrix.
10. TraderScorecard.
11. Evidence index: screenshot labels/descriptions, URLs, notable console/network observations.
12. Blockers and uncertainty.
13. Prompt/runbook maintenance suggestion.
14. Explicit statement: `Repository Playwright E2E scripts were not run`.

## Severity Guide

| Severity | Use when |
| --- | --- |
| `Critical` | Core route/action unusable, account/access flow broken, user is misled into wrong payment/access/data state, or critical trading context is dangerously wrong. |
| `High` | Major workflow blocked, visible data trust failure, broken handoff, unusable mobile path for a core flow, or high-friction access/conversion blocker. |
| `Medium` | Meaningful friction, confusing copy, weak empty/loading/error state, hard-to-use control, or scanability issue that slows decisions. |
| `Low` | Polish, minor copy, localized layout issue, or coverage gap that does not block the journey. |

## Troubleshooting

- If login hits CAPTCHA, MFA, or account protection, stop and ask the user to complete or approve the step. Do not bypass it.
- If registration submission returns `Request timed out. Please try again.` before OTP and console logs mention Cloudflare Turnstile, search Gmail for the alias to prove no OTP was sent, retry the visible registration submit once, then record the registration as CAPTCHA/challenge blocked unless the retry reaches OTP. Do not bypass the challenge or call Gmail retrieval failed when no email was sent.
- If registration reaches OTP entry and the Gmail connector is unavailable, use the user-approved `@Chrome` Gmail path if available. If neither Gmail path is available, ask the user for the OTP and mark OTP retrieval blocked until provided.
- If the OTP email does not arrive for a plus-address, verify the alias shown in the modal, search the base Gmail mailbox for recent TradingFlow/Clerk verification messages, wait for the resend timer, then resend once. If it still fails, retry with a fresh alias and record the first alias as blocked.
- If active/canceled/trial seeded accounts do not work, report the exact login step, URL, visible copy, and whether the OTP was accepted.
- If account switching leaves the previous avatar/email, billing banner, or entitlement state visible, sign out, clear the Browser context or Clerk cookies, and retry once. If it still persists, stop counting premium-guard coverage and file a blocker with evidence.
- If the local app is not running, start it with `PATH=/opt/homebrew/bin:$PATH pnpm dev` from the app repo and retry the route.
- If a route returns stale UI after implementation changes, reload the Browser page before re-verifying.
- If the in-app Browser cannot observe a CSV or file download artifact, record export button/gate coverage and mark artifact verification blocked by Browser capability; do not switch to repository Playwright scripts unless the user changes scope.
- If a TradingView widget is blank only on this Mac, verify local proxy/Shadowrocket routing for `www.tradingview-widget.com` before treating it as a product defect.
- If product-review docs reference missing paths, use the current checkout's `AGENTS.md`, glossary, and invariant docs, then record doc drift in the final maintenance suggestion.
- If Browser viewport override does not change `window.innerWidth` / `window.innerHeight` after reload, retry once, reset the viewport before finishing, and mark mobile coverage blocked by Browser capability if it still reports desktop dimensions. If `viewport.reset()` leaves the Browser at the mobile dimensions, explicitly set a desktop fallback such as `1280x720` before continuing desktop checks, then record the reset drift in the handoff.
- If the in-app Browser page-control channel repeatedly times out with `Page.getFrameTree` or leaves only an unusable `about:blank` tab, reset the Browser-control session, reacquire `iab`, close the stuck tab when possible, create a new blank tab with `browser.tabs.new()`, then call `tab.goto(<route>)`. After recovery, verify signed-in identity and route state before counting any product coverage.

## When To Switch Runbooks

- User asks to fix tests or certify Playwright coverage: switch to the matching `doc/automation/e2e-test/*-goal-driven-prompt.md` in the app repo.
- User asks for code implementation and PR after findings: use the app repo product-review full playbook workflow and then normal engineering workflow.
- User asks for production error correlation: use `ops/webappp-fullstack/error-investigate.md`.
- User asks for PostHog analytics, traffic, dashboards, or session replay research: use `ops/webappp-fullstack/posthog-research.md`.

## Runbook Self-Maintenance

At the end of each run:

1. Decide whether Browser walkthrough, docs, auth, route, or product-contract behavior revealed a reusable lesson.
2. Promote durable lessons into Required Context, Module Map, Browser Plugin Procedure, Workflow, Troubleshooting, or output templates.
3. Keep transient state in Agent Handoff only.
4. Prune completed or obsolete handoff items before adding new ones.
5. If no durable rule changed, state `Runbook maintenance: no change` in the final report.

Update this runbook when:

- Browser plugin usage, available routes, test-account behavior, canonical product names, domain invariant paths, or output formats drift.
- A repeated Browser review blocker needs a standard recovery step.
- A verification gate was too weak, too broad, or missing.
- The source app docs consolidate or rename product-review/E2E prompts.

Do not update this runbook for:

- One-off UI findings.
- Raw screenshot lists.
- Temporary local data availability.
- Completed review progress.
- Speculative PM ideas not supported by an actual Browser walkthrough.
