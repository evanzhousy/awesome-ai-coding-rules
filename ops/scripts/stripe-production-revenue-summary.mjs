#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const SECOND = 1000;
const DAY_SECONDS = 24 * 60 * 60;
const MAX_PAGES = Number.parseInt(process.env.STRIPE_REVENUE_MAX_PAGES ?? "100", 10);
const PAGE_LIMIT = 100;

function redact(value) {
  return String(value ?? "")
    .replace(/sk_(live|test)_[A-Za-z0-9_]+/g, "sk_$1_***")
    .replace(/rk_(live|test)_[A-Za-z0-9_]+/g, "rk_$1_***")
    .replace(/whsec_[A-Za-z0-9_]+/g, "whsec_***")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]");
}

function fail(message, details = {}) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mode: "live",
        generated_at_utc: new Date().toISOString(),
        error: redact(message),
        ...details,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

function runStripe(args, { json = true } = {}) {
  const result = spawnSync("stripe", args, {
    encoding: "utf8",
    env: {
      ...process.env,
      NO_COLOR: "1",
      STRIPE_COLOR: "0",
    },
  });

  if (result.error) {
    fail(`stripe CLI failed to start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`stripe ${args.join(" ")} failed`, {
      stderr: redact(result.stderr.trim()).slice(0, 1000),
    });
  }

  const stdout = result.stdout.trim();
  if (!json) return stdout;

  try {
    return JSON.parse(stdout);
  } catch (error) {
    fail(`stripe ${args.join(" ")} returned non-JSON output`, {
      parse_error: redact(error.message),
      stdout_prefix: redact(stdout).slice(0, 1000),
    });
  }
}

function stripeList(resource, params = []) {
  const records = [];
  let startingAfter = null;
  let pages = 0;
  let hasMore = true;

  while (hasMore && pages < MAX_PAGES) {
    const args = [resource, "list", "--live", "-d", `limit=${PAGE_LIMIT}`, ...params];
    if (startingAfter) {
      args.push("-d", `starting_after=${startingAfter}`);
    }

    const page = runStripe(args);
    const data = Array.isArray(page.data) ? page.data : [];
    records.push(...data);
    hasMore = Boolean(page.has_more);
    startingAfter = data.length > 0 ? data[data.length - 1].id : null;
    pages += 1;

    if (!startingAfter) break;
  }

  return {
    records,
    pages,
    truncated: hasMore,
  };
}

function nowSeconds() {
  return Math.floor(Date.now() / SECOND);
}

function monthToDateStartUtc(now = new Date()) {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / SECOND);
}

function centsToAmount(cents) {
  return Number((Number(cents ?? 0) / 100).toFixed(2));
}

function normalizeCurrency(currency) {
  return String(currency || "unknown").toLowerCase();
}

function blankMoneyBucket() {
  return {
    count: 0,
    amount: 0,
    fee: 0,
    net: 0,
    by_type: {},
    by_reporting_category: {},
  };
}

function addMoney(bucket, transaction) {
  const amount = Number(transaction.amount ?? 0);
  const fee = Number(transaction.fee ?? 0);
  const net = Number(transaction.net ?? 0);
  const type = transaction.type || "unknown";
  const category = transaction.reporting_category || "unknown";

  bucket.count += 1;
  bucket.amount += amount;
  bucket.fee += fee;
  bucket.net += net;
  bucket.by_type[type] = (bucket.by_type[type] ?? 0) + amount;
  bucket.by_reporting_category[category] =
    (bucket.by_reporting_category[category] ?? 0) + amount;
}

function finalizeMoneyBucket(bucket) {
  const byType = {};
  for (const [type, amount] of Object.entries(bucket.by_type)) {
    byType[type] = centsToAmount(amount);
  }

  const byReportingCategory = {};
  for (const [category, amount] of Object.entries(bucket.by_reporting_category)) {
    byReportingCategory[category] = centsToAmount(amount);
  }

  return {
    count: bucket.count,
    gross_amount: centsToAmount(bucket.amount),
    fee: centsToAmount(bucket.fee),
    net: centsToAmount(bucket.net),
    by_type: byType,
    by_reporting_category: byReportingCategory,
  };
}

function aggregateBalanceTransactions(transactions, windows) {
  const result = {};

  for (const window of windows) {
    const byCurrency = {};

    for (const transaction of transactions) {
      if (Number(transaction.created ?? 0) < window.start) continue;
      const currency = normalizeCurrency(transaction.currency);
      byCurrency[currency] ??= blankMoneyBucket();
      addMoney(byCurrency[currency], transaction);
    }

    result[window.key] = {
      start_utc: new Date(window.start * SECOND).toISOString(),
      end_utc: new Date(window.end * SECOND).toISOString(),
      by_currency: Object.fromEntries(
        Object.entries(byCurrency).map(([currency, bucket]) => [
          currency,
          finalizeMoneyBucket(bucket),
        ]),
      ),
    };
  }

  return result;
}

function aggregateCharges(charges) {
  const byCurrency = {};
  const byStatus = {};
  let paid = 0;
  let refunded = 0;
  let disputed = 0;

  for (const charge of charges) {
    const currency = normalizeCurrency(charge.currency);
    byCurrency[currency] ??= {
      count: 0,
      gross_amount: 0,
      amount_refunded: 0,
    };
    byCurrency[currency].count += 1;
    byCurrency[currency].gross_amount += Number(charge.amount ?? 0);
    byCurrency[currency].amount_refunded += Number(charge.amount_refunded ?? 0);

    const status = charge.status || "unknown";
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    if (charge.paid) paid += 1;
    if (charge.refunded) refunded += 1;
    if (charge.disputed) disputed += 1;
  }

  return {
    count: charges.length,
    by_status: byStatus,
    paid,
    refunded,
    disputed,
    by_currency: Object.fromEntries(
      Object.entries(byCurrency).map(([currency, bucket]) => [
        currency,
        {
          count: bucket.count,
          gross_amount: centsToAmount(bucket.gross_amount),
          amount_refunded: centsToAmount(bucket.amount_refunded),
        },
      ]),
    ),
  };
}

function monthlyPriceCents(price, quantity) {
  if (!price || !price.recurring) return 0;

  const unitAmount =
    price.unit_amount_decimal !== undefined
      ? Number.parseFloat(price.unit_amount_decimal)
      : Number(price.unit_amount ?? 0);
  const intervalCount = Number(price.recurring.interval_count ?? 1) || 1;
  const subtotal = unitAmount * (Number(quantity ?? 1) || 1);

  switch (price.recurring.interval) {
    case "day":
      return (subtotal * 30) / intervalCount;
    case "week":
      return (subtotal * 52) / 12 / intervalCount;
    case "month":
      return subtotal / intervalCount;
    case "year":
      return subtotal / 12 / intervalCount;
    default:
      return 0;
  }
}

function aggregateSubscriptions(subscriptions) {
  const byStatus = {};
  const mrrByStatusAndCurrency = {};

  for (const subscription of subscriptions) {
    const status = subscription.status || "unknown";
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    const items = Array.isArray(subscription.items?.data)
      ? subscription.items.data
      : [];

    for (const item of items) {
      const price = item.price;
      const currency = normalizeCurrency(price?.currency);
      const monthlyCents = monthlyPriceCents(price, item.quantity);
      if (!monthlyCents) continue;

      mrrByStatusAndCurrency[status] ??= {};
      mrrByStatusAndCurrency[status][currency] =
        (mrrByStatusAndCurrency[status][currency] ?? 0) + monthlyCents;
    }
  }

  const mrr = {};
  for (const [status, byCurrency] of Object.entries(mrrByStatusAndCurrency)) {
    mrr[status] = {};
    for (const [currency, cents] of Object.entries(byCurrency)) {
      mrr[status][currency] = {
        mrr: centsToAmount(cents),
        arr_proxy: centsToAmount(cents * 12),
      };
    }
  }

  return {
    count: subscriptions.length,
    by_status: byStatus,
    mrr_by_status_and_currency: mrr,
    revenue_risk_split: {
      active_paid_mrr: mrr.active ?? {},
      trialing_plan_mrr: mrr.trialing ?? {},
      past_due_at_risk_mrr: mrr.past_due ?? {},
    },
  };
}

function summarizeBalance(balance) {
  const summarizeList = (list) =>
    (Array.isArray(list) ? list : []).map((entry) => ({
      currency: normalizeCurrency(entry.currency),
      amount: centsToAmount(entry.amount),
    }));

  return {
    object: balance.object,
    available: summarizeList(balance.available),
    pending: summarizeList(balance.pending),
  };
}

function main() {
  const generatedAt = new Date();
  const now = nowSeconds();
  const windows = [
    { key: "trailing_24h", start: now - DAY_SECONDS, end: now },
    { key: "trailing_7d", start: now - 7 * DAY_SECONDS, end: now },
    { key: "trailing_30d", start: now - 30 * DAY_SECONDS, end: now },
    { key: "month_to_date_utc", start: monthToDateStartUtc(generatedAt), end: now },
  ];
  const oldestWindowStart = Math.min(...windows.map((window) => window.start));

  const cliVersion = runStripe(["--version"], { json: false });
  const balance = runStripe(["balance", "retrieve", "--live"]);
  const balanceTransactions = stripeList("balance_transactions", [
    "-d",
    `created[gte]=${oldestWindowStart}`,
    "-d",
    `created[lte]=${now}`,
  ]);
  const charges = stripeList("charges", [
    "-d",
    `created[gte]=${now - 30 * DAY_SECONDS}`,
    "-d",
    `created[lte]=${now}`,
  ]);
  const subscriptions = stripeList("subscriptions", ["-d", "status=all"]);

  const output = {
    ok: true,
    mode: "live",
    generated_at_utc: generatedAt.toISOString(),
    cli_version: cliVersion,
    data_policy:
      "Aggregate-only production Stripe revenue summary. Raw keys, customer PII, payment methods, invoices, and full Stripe objects are intentionally omitted.",
    balance: summarizeBalance(balance),
    balance_transactions: {
      pages: balanceTransactions.pages,
      truncated: balanceTransactions.truncated,
      windows: aggregateBalanceTransactions(balanceTransactions.records, windows),
    },
    charges_trailing_30d: {
      pages: charges.pages,
      truncated: charges.truncated,
      ...aggregateCharges(charges.records),
    },
    subscriptions_current: {
      pages: subscriptions.pages,
      truncated: subscriptions.truncated,
      ...aggregateSubscriptions(subscriptions.records),
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
