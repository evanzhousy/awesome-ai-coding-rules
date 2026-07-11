# Market Recap PostHog Dashboard

Dashboard: [Market Recap — Preview Growth Funnel](https://us.posthog.com/project/300646/dashboard/1811122)
Project: `app.tradingflow.com` (`300646`)

This dashboard measures whether public `/app/market-recap` previews drive qualified traffic, registrations, and paid conversion.

## Event Contract

Market Recap emits these product events through `capturePostHogEvent`:

| Event | Purpose | Key properties |
| --- | --- | --- |
| `market_recap_index_viewed` | Directory exposure | `surface`, `access_state`, `recap_count`, `public_archive_count`, `premium_recent_count` |
| `market_recap_card_clicked` | Directory-to-post click | `surface`, `trading_date`, `full_access`, `index_position` |
| `market_recap_preview_viewed` | Public preview exposure | `surface`, `trading_date`, `reader_mode`, `hidden_section_count`, `chart_count`, `source_count` |
| `market_recap_full_article_viewed` | Full article exposure | `surface`, `trading_date`, `reader_mode`, `section_count`, `chart_count`, `source_count` |
| `market_recap_upgrade_cta_clicked` | Upgrade intent from preview/index | `surface`, `source`, `paywall_attempt_id`, `paywall_context`, `return_url`, `trading_date` |
| `market_recap_session_changed` | Paid/public-archive session picker use | `surface`, `from_trading_date`, `to_trading_date`, `recent_count` |
| `market_recap_share_clicked` | Share intent | `surface`, `network`, `trading_date` |

The upgrade CTA passes the same `paywall_attempt_id` and `paywall_context = market_recap` into the existing Access Gateway, PayWall, billing, and auth flows. This lets PostHog join Market Recap intent to:

- `auth_login_modal_opened`
- `auth_login_completed`
- `paywall_shown`
- `paywall_cta_clicked`
- `billing_checkout_session_created`
- `billing_subscription_activated`

## Dashboard Tiles

1. **Reach and preview readership**
   - `$pageview` where `$pathname` contains `/app/market-recap`
   - `market_recap_index_viewed`
   - `market_recap_preview_viewed`

2. **Preview to registration funnel**
   - `market_recap_preview_viewed`
   - `auth_login_modal_opened`
   - `auth_login_completed`

3. **Preview to paid conversion funnel**
   - `market_recap_preview_viewed`
   - `market_recap_upgrade_cta_clicked`
   - `paywall_shown` with `paywall_context = market_recap`
   - `paywall_cta_clicked` with `paywall_context = market_recap`
   - `billing_checkout_session_created` with `paywall_context = market_recap`
   - `billing_subscription_activated` with `paywall_context = market_recap`

4. **Exact attributed outcomes**
   - Daily Market Recap-attributed upgrade CTA, auth completion, paywall, checkout, and activation counts.

5. **Preview performance by recap date**
   - Per `trading_date`: preview readers, preview events, upgrade clicks, share clicks, and upgrade click rate.

6. **Growth and revenue KPI summary**
   - 30-day counts for preview readers, upgrade clickers, attributed registrations, checkout creators, and subscription activations.

## Metric Decisions

- **How many people landed on the preview?** Use `$pageview` for traffic and `market_recap_preview_viewed` for successful preview content exposure. `$pageview` answers route traffic; `market_recap_preview_viewed` answers content actually rendered.
- **How did preview help registration?** Use the broad funnel `market_recap_preview_viewed -> auth_login_modal_opened -> auth_login_completed`. Use `auth_login_completed.paywall_context = market_recap` for exact CTA-attributed registrations.
- **How did preview help revenue conversion?** Use the paid funnel through `market_recap_upgrade_cta_clicked`, `paywall_shown`, checkout creation, and `billing_subscription_activated`. Subscription activation is the current paid-conversion event; it is a conversion count, not MRR.
- **Which recaps work best?** Break down preview and CTA events by `trading_date`. Compare `hidden_section_count`, `chart_count`, and share behavior to see what content drives upgrade intent.
- **How does sharing help growth?** Use `market_recap_share_clicked` by `network` and downstream funnels from shared landing sessions. PostHog can measure human traffic; crawler/indexing performance still belongs in Search Console.

## Caveats

- New `market_recap_*` events start populating only after the public-preview branch is deployed.
- PostHog frontend events measure browser-executed traffic. Search crawlers and indexing coverage should be reviewed in Search Console, not inferred only from PostHog.
- If revenue dollars or MRR are needed, add Stripe price/amount attribution or join to a Stripe revenue warehouse. The current dashboard measures paid activation counts.
