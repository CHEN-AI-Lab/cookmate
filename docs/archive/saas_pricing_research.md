# SaaS Pricing Page Best Practices — Research Summary for CookMate

## 1. Company-by-Company Breakdown

---

### 1.1 Notion (4 tiers: Free → Plus → Business → Enterprise)

| Plan | Monthly | Annual | Annual Effective/Mo | Savings |
|------|---------|--------|-------------------|---------|
| **Plus** | $12/user/mo | $120/user/yr | $10/user/mo | **~16.7%** (save $24/yr) |
| **Business** | $24/user/mo | $240/user/yr | $20/user/mo | **~16.7%** (save $48/yr) |
| **Enterprise** | $32/user/mo | $312/user/yr | $26/user/mo | **~18.75%** (save $72/yr) |
| **AI Add-on** | $10/user/mo | $96/user/yr | $8/user/mo | **20%** (save $24/yr) |

- **Notable**: Annual discount is consistently ~17-19% across tiers
- **Approach**: Simple per-user/month pricing with annual toggle; annual discount always displayed prominently
- **AI add-on** priced separately from core plan
- No quarterly or semi-annual options — just monthly vs annual

---

### 1.2 Linear (4 tiers: Free → Basic → Business → Enterprise)

| Plan | Monthly (est.) | Annual | Savings |
|------|---------------|--------|---------|
| **Basic** | $12/user/mo | $10/user/mo (billed yearly) | **~16.7%** |
| **Business** | ~$20/user/mo (est.) | $16/user/mo (billed yearly) | **~20%** |
| **Enterprise** | Custom | Custom (annual only) | — |

- **Notable**: Toggle between monthly/yearly with checkbox labeled "Billed yearly" — default set to annual
- The yearly billing checkbox is **checked by default**, nudging users toward annual
- Enterprise requires annual billing only
- Clean 4-tier structure with feature comparison table below

---

### 1.3 Slack (4 tiers: Free → Pro → Business+ → Enterprise+)

| Plan | Monthly | Annual | Savings |
|------|---------|--------|---------|
| **Pro** | $8.75/user/mo | $7.25/user/mo | **~17.1%** |
| **Business+** | $18/user/mo | $15/user/mo | **~16.7%** |
| **Enterprise+** | Custom | Custom | — |

- **Notable**: Aggressive introductory pricing — "50% off for 3 months" promo pill shown prominently
- Annual price shown as a tooltip when clicking "More pricing information" — not the default display
- Monthly price is the headline number; annual savings are surfaced on interaction
- Highlights AI features per-tier with checkmarks and disabled states

---

### 1.4 Figma (4 tiers: Starter → Professional → Organization → Enterprise)

| Plan | Monthly | Annual | Savings |
|------|---------|--------|---------|
| **Professional (Full seat)** | ~$19/mo (est.) | $16/mo | **~16%** |
| **Professional (Dev seat)** | — | $12/mo | — |
| **Professional (Collab seat)** | — | $3/mo | — |
| **Organization (Full seat)** | — | $45/mo (billed annually) | — |
| **Enterprise** | Custom | Custom | — |

- **Notable**: **Multi-seat pricing** — Full seats ($16/mo), Dev seats ($12/mo), Collab seats ($3/mo) — very innovative approach
- Toggle between "Show annual billing prices" / "Show monthly billing prices"
- Multiple products (Figma Design, FigJam, Dev Mode, Slides, etc.) bundled differently per seat type
- AI credits add-on with daily/monthly caps per plan
- Add-ons section (AI credits, Governance+) below the main plan grid

---

### 1.5 GitHub (3+ tiers: Free → Team → Enterprise + Add-ons)

| Plan | Monthly | Annual Discount |
|------|---------|----------------|
| **Free** | $0 | — |
| **Team** | $4/user/mo | Annual billing available (discount not advertised on pricing page) |
| **Enterprise** | $21/user/mo (starting) | Annual billing available |

- **Notable**: Very low entry price for Team plan ($4/user/mo)
- No quarterly or semi-annual options
- Heavy focus on **add-ons** (Copilot, Codespaces, Advanced Security) as separate purchase tracks
- Copilot priced per user/month with usage tiers
- Codespaces: usage-based pricing ($0.18/hr compute, $0.07/GB storage)
- GitHub Actions: **usage-based billing** on top of included minutes

---

### 1.6 Vercel (3 tiers: Hobby → Pro → Enterprise)

| Plan | Monthly | Key Feature |
|------|---------|-------------|
| **Hobby** | $0 | Free tier with 1M edge requests/mo, 100GB transfer |
| **Pro** | $20/mo | Includes $20 usage credit, 10M edge requests/mo, 1TB transfer |
| **Enterprise** | Custom | SLAs, SCIM, multi-region, custom pricing |

- **Notable**: **Hybrid (flat + usage-based) pricing** — $20 flat fee includes $20 usage credit; overages priced per-unit ($2/1M edge req, $0.15/GB transfer)
- "Fluid Compute" — pay for actual execution time, not idle resources
- Spend management controls: set limits + alerts
- No annual billing option on Pro tier
- Full feature comparison matrix with per-item pricing breakdown

---

## 2. Key Patterns & Takeaways for CookMate

### 2.1 Discount Percentages: The Industry Standard

| Billing Period | Typical Discount (vs Monthly) | Examples |
|---------------|------------------------------|----------|
| **Annual** | **16-20%** (≈ 2 months free) | Notion 16.7%, Linear 16.7%, Slack 17%, Figma ~16% |
| **Quarterly** | Rare — few companies offer it | Most skip quarterly entirely |
| **Semi-annual** | Very rare | Most skip or bake into annual-only |

**Common approach**: "2 months free when billed annually" = **~16.7%** discount. This is the most prevalent and easy-to-communicate format.

### 2.2 Recommended Tier Structure for CookMate

| Tier | Target | Monthly Price | Annual Price | Annual Effective/Mo |
|------|--------|--------------|-------------|-------------------|
| **Free** | Casual users | $0 | $0 | $0 |
| **Pro** | Individuals / power users | $15/mo | **$150/yr ($12.50/mo)** → **17% off** |
| **Pro Annual** | Commitment discount | — | — | As above |
| *(Optional)* **Quarterly** | Bridge option | $15/mo × 3 = $45 | **$39/quarter ($13/mo)** → **13% off** | — |
| *(Optional)* **Semi-annual** | New option | $15/mo × 6 = $90 | **$72/6mo ($12/mo)** → **20% off** | — |

### 2.3 Novel Approaches Worth Considering

1. **Multi-seat pricing (Figma)** — Different seat types with different feature access
2. **Default-to-annual (Linear)** — Yearly billing checkbox checked by default
3. **Usage-based + flat hybrid (Vercel)** — Flat base fee + usage credits included, then overages
4. **Add-ons marketplace (GitHub, Figma)** — Base plan + purchasable add-ons
5. **AI as add-on tier (Notion, Slack)** — Keep AI features as a separate line item
6. **Percentage-savings language (Slack)** — "50% off for 3 months" promo hooks

### 2.4 What Pricing Pages Highlight

- **Headline benefit summary** per plan (1 sentence)
- **What's included** as scannable bullet list
- **"Most popular" / "Recommended" / "Best value" badge** on the mid-tier
- **Feature comparison table** below the plans
- **Social proof** — logos of companies using the product
- **AI features** increasingly highlighted as plan differentiators
- **Clear CTA** per plan (Get Started / Contact Sales)

### 2.5 Recommended Discount Structure for CookMate

For a $15/mo Pro plan, implement:

```
Monthly:   $15/mo
Quarterly: $39/quarter ($13/mo, 13% off)
Semi-annual: $72/6mo ($12/mo, 20% off)  
Annual:    $150/yr ($12.50/mo, 17% off)
```

This gives users a "savings ladder" where:
- Longer commitment = bigger discount
- Quarterly is a gentle intro to commitment (13% off)
- Semi-annual gives the steepest discount for a medium commitment (20% off)
- Annual matches the industry standard (17% off, "2 months free")

**Alternative simpler approach** (most common among researched companies):
```
Monthly: $15/mo
Annual:  $150/yr ($12.50/mo — "2 months free", 17% off)
```