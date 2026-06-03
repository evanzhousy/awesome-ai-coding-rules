# quantedOptions — Methodology Summary

Source: [quantedOptions — Learn](https://www.quantedoptions.com/learn)

Product positioning: real-time gamma exposure (GEX) analytics for SPX and VIX, using exchange-tagged positional data from official CBOE feeds. Focus on what market makers actually hold, not inferred open interest.

## Core thesis

Options don't just react to the underlying — they move it. Since the 0DTE volume explosion, the options chain is a first-class driver of SPX / ES / SPY price action. To read the tape, you have to read market-maker positioning.

## The eight concepts

1. **Options move markets now.** 0DTE volume has made the options chain a leading signal for index products, not a derivative of them.

2. **The middleman.** Every retail/institutional options trade has a market maker on the other side. MMs don't take directional views — they accumulate the opposite side across thousands of strikes and stay delta-neutral.

3. **Open interest lies.** Public OI is ambiguous: 5 contracts of OI is consistent with the MM being flat, +5, or −5. Same OI, 200% discrepancy in actual MM inventory. Resolving this requires exchange-tagged positional data (CBOE), which is what quantedOptions claims to use.

4. **Why MMs move markets.** MMs hedge immediately to stay neutral, but delta shifts continuously with price, time, and vol, so they re-hedge continuously. Each re-hedge is real buying or selling pressure in the underlying — aggregated across strikes, this is a major intraday flow.

5. **Gamma is gravity.**
   - Positive gamma regime: MMs buy dips and sell rips → stabilizing, mean-reverting (gravity pulling price back to a peak).
   - Negative gamma regime: MMs sell dips and buy rips → destabilizing, trend-amplifying (a cliff; small pushes become avalanches).

6. **Charm is wind.** Charm = dDelta/dTime. Positive charm drifts price down (suppressive, headwind). Negative charm lifts it (supportive, tailwind). Charm matters most as expiry approaches and compounds the gamma regime.

7. **The flip changes everything.** Crossing from positive to negative gamma is a regime change, not a gradient: brakes become a gas pedal, self-correcting becomes self-reinforcing. The location of the flip (the "gamma flip level") is the key level.

8. **Theory → data.** Everything above is delivered live, updated every minute, sourced from CBOE positional data rather than inferred from public OI.

## Implied methodology (how they build the product)

- **Data source.** Exchange-tagged positional data from CBOE, which disambiguates MM long vs short inventory in a way public OI cannot.
- **Aggregation.** Gamma and charm exposures rolled up per strike across the full SPX / VIX option chain, attributed to dealers.
- **Regime classification.** Identification of the gamma flip level; labeling the market as positive-gamma (stabilizing) or negative-gamma (accelerating).
- **Real-time cadence.** Minute-level updates during the session, framed as actionable intraday positioning rather than end-of-day analytics.
- **Scope.** Index and index-vol only (SPX, VIX). No single-name coverage implied on the learn page.

## Relevance to TradingFlow

- Contrasts with our single-name / multi-ticker flow orientation (Option Trades, Symbol-level and Contract-level analysis, Option Chain Analysis). quantedOptions is narrow (SPX/VIX) and deep (dealer-attributed GEX/charm).
- Their moat claim is the data: exchange-tagged CBOE positional data to resolve the "OI lies" problem. Any competing dealer-GEX product must either license the same CBOE feed or estimate dealer positioning from public data (with the attendant ambiguity they call out).
- Their pedagogy — gamma as gravity, charm as wind, the flip as regime change — is a clean narrative frame worth studying for our own explainers around GEX columns and the OI Time Machine in Option Chain Analysis.
