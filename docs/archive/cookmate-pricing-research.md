# CookMate International Pricing Research

## 1. CURRENCY: USD vs CNY for International Markets

### The Standard: Yes, USD is the default "global" currency

Every major SaaS company visited uses **USD as the default** for international audiences:

| Company | Default Currency | Currency Selector? |
|---------|-----------------|-------------------|
| **Linear** | **USD** ($) | No selector — USD only |
| **Vercel** | **USD** ($) | No selector — USD only |
| **Cal.com** | **USD** ($) | No selector — USD only |
| **Intercom** | **USD** ($) | No selector — USD only |
| **Notion** | **USD** ($) | YES — dropdown with JPY, EUR, GBP, etc. |
| **Figma** | **USD** ($) | YES — dropdown with JPY, EUR, etc. |
| **Slack** | **Localized** (¥JP in Japan) | Geo-detected, regional subdomain |

### Key finding:
- **Most premium/developer-focused SaaS (Linear, Vercel, Cal.com, Intercom) use USD only** — no currency selector at all. This signals "global product, global price."
- **Consumer-focused SaaS (Notion, Figma, Slack) offer a currency selector** but still default to USD for most regions.
- **No major SaaS shows dual currencies simultaneously** on a single pricing card.

### Chinese-origin SaaS going global:

| Company | International Currency | Notes |
|---------|----------------------|-------|
| **ByteDance (TikTok)** | **USD** | TikTok monetization (Coins, Ads) uses USD globally |
| **Canva** (Australian origin, big in China) | **USD** default; local currency selector available | Pivot to USD for global |
| **Notion** (Korean founder, US-based) | **USD** default; offers JPY, EUR, GBP, KRW | Has user-selectable currency |
| **CapCut/剪映** | **USD** | International version uses USD |
| **Tencent/WeChat** | **Local currency per region** | But they're platform more than SaaS |

### Recommendation for CookMate:
**USE USD AS THE PRIMARY CURRENCY** for the international pricing page. This is the overwhelming standard. Anyone who can pay for a SaaS internationally can transact in USD. Adding a currency selector is a nice-to-have for later, not a launch requirement.

---

## 2. PRICING PAGE DESIGN ANALYSIS

### 2a. What "Professional" pricing pages do (based on 8 sites studied)

#### Layout & Spacing
| Element | Best Practice | Examples |
|---------|--------------|----------|
| **Cards** | 3-4 plan columns, side-by-side, equal width | Linear, Notion, Vercel, Cal.com |
| **Highlighted plan** | Middle card has accent border/glow, "Popular" or "Recommended" badge | Linear (Business), Vercel (Pro), Slack (Business+) |
| **Price font** | Very large (2-3x body text), bold, same line as currency symbol | Linear: "$16" in huge font; Notion: "¥1,650" in display size |
| **Plan name** | Medium weight, above the price | Universal pattern |
| **Feature list** | Compact, checkmark icons, short phrases | Linear, Cal.com |
| **CTAs** | Primary button on the recommended plan, secondary on others | Universal pattern |
| **Spacing** | LOTS of white space — minimum 48px between cards | Linear, Vercel |

#### Annual/Monthly Toggle
| Pattern | Used By | Notes |
|---------|---------|-------|
| **Toggle switch** (monthly/yearly) | Notion, Intercom | Clean, modern, most common |
| **Checkbox** ("Billed yearly") | Linear | Subtle, under the price |
| **Radio buttons** | Intercom | "Billed annually" / "Billed monthly" |
| **Default to annual** | **ALL of them** | Annual is pre-selected; savings shown ("Save 20%") |

**Critical finding**: ALL sites default to annual billing and show the "save X%" message prominently. Monthly is the secondary option.

#### What Makes a Pricing Page Look "Professional" vs "Cheap"

| Professional ✅ | Cheap ❌ |
|----------------|----------|
| Clean, minimal design with lots of whitespace | Cluttered, too many badges/ribbons |
| Consistent typography (1-2 font sizes) | Many different font sizes/colors |
| Subtle highlight on recommended plan | Multiple "BEST VALUE" / "POPULAR" badges |
| Prices end in .00 or .99 (rounded) | .45, .37, .68 — look arbitrary |
| Feature comparison table below | Features crammed into cards |
| "Free" tier is genuinely useful | Free tier is useless (bait) |
| One clear CTA per plan | Multiple CTAs competing |
| Annual savings shown as percentage | Annual savings hidden or absent |

### 2b. Currency/Region Handling Comparison

| Pattern | Example | Pro/Con |
|---------|---------|---------|
| **USD only, no selector** | Linear, Vercel, Cal.com, Intercom | ✅ Simplest, most professional; ❌ Non-US users may mentally convert |
| **Currency dropdown** | Notion, Figma | ✅ User-friendly for international; ❌ Adds complexity, more UI clutter |
| **Geo-detected auto-switch** | Slack | ✅ Seamless; ❌ Must maintain correct rates, can confuse VP users |

---

## 3. CONVERSION: ¥119 to USD — Recommended Price Points

### Current exchange rate: 1 CNY = 0.147 USD (July 2026)

| Current (CNY) | Exact Conversion | Recommended USD | Rounding Strategy |
|---------------|-----------------|-----------------|-------------------|
| ¥20/mo | $2.94 | **$2.99/mo** | Round to .99 (common SaaS floor) |
| ¥51/3mo | $7.50 | **$7.99/3mo** ($2.66/mo) | Round up to .99 |
| ¥90/6mo | $13.23 | **$13.99/6mo** ($2.33/mo) | Standard .99 |
| ¥119/yr | $17.49 | **$16.99/yr** or **$17.99/yr** | See analysis below |

### The ¥119 → USD Decision

**$16.99** is the better choice because:
- **$17.49** (exact) is an odd, untrustworthy-looking price
- **$16.99** is a well-known psychological price point (just under $17)
- **$17.99** is also fine but less common for SaaS annual plans
- **$16** would be too aggressive — you're giving up 8% from the ¥119 equivalent
- **$19.99** would be too expensive — it's a 14% increase from the ¥119 equivalent

**Recommendation: $16.99/year** — this is approximately equivalent to ¥115, keeping the value very close to the Chinese pricing while using a clean, professional USD price point.

### Suggested USD Pricing Structure:
| Plan | Price |
|------|-------|
| Free | $0 |
| Pro Monthly | **$2.99/mo** |
| Pro Quarterly | **$7.99/3mo** |
| Pro Semi-annual | **$13.99/6mo** |
| Pro Annual | **$16.99/yr** (save 53% vs monthly) |

> Note: This is actually CHEAPER than the Chinese pricing at current exchange rates. If you want to maintain parity, you could go with $3.49/mo and $19.99/yr — but for a new international launch, the lower entry price of $2.99/mo is a stronger acquisition strategy.

---

## 4. DISPLAY: Single Currency vs Dual Currency

### Standard Approach: SHOW ONE CURRENCY ONLY

**No major SaaS displays two currencies on the same pricing card.** Here's the evidence:

- **Linear**: USD only
- **Vercel**: USD only
- **Cal.com**: USD only
- **Intercom**: USD only
- **Notion**: Shows one currency at a time (user selects from dropdown)
- **Figma**: Shows one currency at a time (user selects from dropdown)

### Why single currency wins:
1. **Cleaner UI** — Two prices on one card is visually noisy
2. **Avoids confusion** — Users don't know which price applies to them
3. **No conversion rate anchoring** — Showing both lets users "comparison shop" between currencies
4. **Matches user expectation** — International users expect to see USD or their local currency, not both

### Recommended display strategy for CookMate:

**Phase 1 (Launch):** Single currency — show USD for all international visitors. Use a simple geo-detected `Accept-Language` or IP-based switcher if you want to personalize.

**Phase 2 (Post-launch):** Add a small currency selector dropdown (like Notion/Figma) in the top-right of the pricing section. Options: USD, EUR, GBP, JPY. Still show only one price per card.

### What to show on the pricing page:
```
Pro Annual
$16.99
per year (billed annually)
Save 53% vs monthly
```

And in the toggle:
```
[Monthly] [Annual ✓]  Save 53%
```

---

## 5. ACTIONABLE RECOMMENDATIONS SUMMARY

### Immediate (launch-blocking):
1. ✅ **Use USD as the default/only currency** for international pricing page
2. ✅ **Price at $16.99/yr** for the Pro Annual plan (equivalent to ¥119)
3. ✅ **Set monthly at $2.99/mo** (equivalent to ¥20)
4. ✅ **Default to annual billing** in the toggle, show "Save 53%" vs monthly
5. ✅ **Show only one currency per card** — no dual-currency display

### Visual design:
6. Use a 3-column card layout: Free | Monthly | Annual (or Free | Pro | Enterprise)
7. Pre-select annual; show monthly as secondary option
8. Highlight the annual plan with a subtle accent border
9. Use clean .99 price endings
10. Large price font, simple feature list with checkmarks

### Future (nice-to-have):
11. Add a currency selector dropdown (USD/EUR/GBP/JPY) after launch
12. Consider geo-detected currency auto-switching (but only if you maintain rates)
13. Add a feature comparison table below the pricing cards

### One-pager for the developer:

```
┌─────────────────────────────────────────────────────┐
│  CookMate International Pricing                     │
│                                                     │
│  [Monthly] [Annual ✓]  Save 53%                     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐      │
│  │  FREE    │  │  PRO     │  │  ENTERPRISE  │      │
│  │  $0      │  │  $16.99  │  │  Custom      │      │
│  │  forever │  │  /year   │  │  pricing     │      │
│  │          │  │          │  │              │      │
│  │  ✓ Basic │  │  ✓ All   │  │  ✓ Dedicated │      │
│  │  ✓ 3     │  │    Free  │  │    support   │      │
│  │    meals │  │    +     │  │  ✓ Custom    │      │
│  │  ...     │  │  ✓ AI    │  │    features  │      │
│  │          │  │    plans │  │  ...          │      │
│  │          │  │  ✓ ...   │  │              │      │
│  │          │  │          │  │              │      │
│  │ [Sign Up]│  │[Get Pro] │  │[Contact Us]  │      │
│  └──────────┘  └──────────┘  └──────────────┘      │
│                                                     │
│  Monthly price: $2.99/mo                            │
│  Quarterly: $7.99/3mo                               │
│  Semi-annual: $13.99/6mo                            │
└─────────────────────────────────────────────────────┘
```