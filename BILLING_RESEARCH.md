# SaaS Billing Page Research — CookMate Redesign Reference

## 1. SaaS Patterns Analyzed

### 1.1 Linear.app — The Clean Card + Toggle Pattern

**Layout:** 4 horizontal cards (Free, Basic, Business, Enterprise) with built-in yearly/monthly checkbox inside each paid card. No separate payment methods on the pricing page.

**Toggle behavior:**
- A "Billed yearly" checkbox is embedded directly inside each paid pricing card (Basic, Business)
- Checked by default (yearly = lower monthly price)
- The price text dynamically updates: `$10/user/month` with checkbox on, presumably `$12/user/month` unchecked
- No dedicated global toggle above the cards

**CTA buttons:**
- Free → "Get started" (links to signup)
- Basic/Business → "Get started" (links to checkout)
- Enterprise → "Contact sales"

**Flow (plan selection → payment):**
1. User sees 4 cards with per-user/month prices
2. Checks/unchecks "Billed yearly" on the card they want → price updates instantly
3. Clicks "Get started" → redirected to signup/checkout
4. **Total steps from selection to payment: 1 click (no intermediate page)**

**Key insight: Payment method is never shown on pricing page. It's deferred entirely to the checkout/portal.**

---

### 1.2 Notion — The Global Toggle Pattern

**Layout:** Global toggle at top ("Pay monthly" / "Pay yearly" radio group), then 4 cards below (Free, Plus, Business, Enterprise). Dedicated feature comparison table below.

**Toggle behavior:**
- Global radio toggle at the very top, above all pricing cards
- "Pay yearly" is checked by default with text "Save up to 20% with yearly"
- When toggled, ALL card prices update simultaneously
- Currency selector (USD, EUR, etc.) also at the top

**CTA buttons:**
- Free → "Sign up"
- Plus → "Get started"
- Business → "Get started"
- Enterprise → "Contact Sales"

**Flow:**
1. User sees global toggle, picks monthly/yearly
2. Sees prices update on all cards
3. Clicks "Get started" → goes to signup/checkout flow
4. **Total steps: 1 click (toggle is optional, then CTA)**

**Key insight: Yearly/monthly toggle is global and separate from the cards. Payment method handled entirely during checkout.**

---

### 1.3 Vercel — Flat Monthly Pricing, No Toggle

**Layout:** 3 vertical cards (Hobby $0, Pro $20/mo, Enterprise Custom). No yearly/monthly toggle at all.

**CTA buttons:**
- Hobby → "Start Deploying"
- Pro → "Start a free trial"
- Enterprise → "Get a demo"

**Flow:**
1. User picks a card and clicks the CTA
2. If Pro → free trial starts → payment collected at trial end
3. **Total steps: 1 click**

**Key insight: No yearly option at all on the public pricing page; billing period decisions happen later in the portal.**

---

### 1.4 飞书 (Feishu/Lark) — Chinese SaaS Standard

**Layout:** 5 vertical cards (免费版, 商业标准版, 商业专业版, 商业旗舰版, enterprise). Each shows ¥ price per person/month.

**Toggle behavior: No monthly/yearly toggle** — all versions are stated as "所有版本需按年付费" (all versions require annual payment). This is a common Chinese SaaS pattern to simplify pricing.

**CTA buttons:**
- Free → "立即免费体验" (Free Trial)
- Paid tiers → "立即购买" (Buy Now)
- Enterprise → "购买咨询" (Contact Sales)

**Flow:**
1. User picks a card
2. Clicks "立即购买" → goes to order page (no payment methods on pricing page)
3. **Total steps: 1 click → order page → payment**

**Key insight: Chinese SaaS often defaults to annual-only billing, simplifying the UI. No payment methods on pricing page.**

---

### 1.5 Stripe — The Billing Infrastructure Pattern

**Pricing approach:** Stripe's pricing page shows product pricing (per-transaction fees), not subscription plans. But Stripe Billing as a product has a well-known pattern used by thousands of SaaS companies:

**The Stripe-hosted pricing page pattern (via Stripe Pricing Table feature):**
- Card layout with plan names, features, prices
- Yearly/monthly toggle integrated into each plan card
- CTA button: "Subscribe" or "Buy"
- Click → embedded Stripe Checkout modal opens within the same page
- Checkout modal shows: plan summary, price, payment method form (credit card, Alipay, WeChat, etc.)
- User selects payment method AND completes payment in the modal

**Flow:**
1. User picks a plan on the pricing page
2. Clicks "Subscribe" → Stripe Checkout modal opens (no page navigation)
3. Inside modal: order summary + payment method selection + pay button
4. **Total steps: 2 clicks (Subscribe → Pay)**

**Key insight: The payment method selection is IN the checkout modal, not on the pricing page. This is the most important pattern for CookMate to follow.**

---

## 2. Comparison of the 3 Main Approaches

| Approach | Example | Toggle Location | Payment Method Location | Steps to Payment |
|---|---|---|---|---|
| **Card-embedded toggle** | Linear | Inside each card | Deferred to checkout | 1 click (CTA) |
| **Global toggle** | Notion | Above all cards | Deferred to checkout | 1 click (CTA) |
| **Modal/inline checkout** | Stripe | On card | In the checkout modal | 2 clicks (CTA → Pay) |

All three have one thing in common: **Payment methods are NEVER displayed as separate buttons on the pricing/billing page.**

---

## 3. Analysis of CookMate's Current Problem

### Current Flow (Broken):

```
Cards (Free, Pro Yearly, Pro Monthly) — ALL disabled/greyed out
    ↓ (user can only toggle selection between monthly/annual)
Buttons below: [Alipay] [Stripe] [Creem] [Check Payment]
    ↓ (user clicks a payment method button)
API called → redirect to payment gateway
```

**Problems identified:**
1. **Cards are disabled** — the user can see plans but feels locked out. The "Select This Plan" buttons do nothing except change the selected period state.
2. **Payment methods are separated from plans** — the cognitive model is broken: "I pick my plan on the card, then I pick how to pay separately below." In every real SaaS, picking the plan IS the payment action.
3. **Multiple payment buttons cause confusion** — the user has to make an extra decision ("which payment method do I want?") before they can complete the purchase.
4. **No unified CTA** — there's no single "Subscribe" or "Upgrade" button. The user has to figure out the protocol.
5. **Demo user block is confusing** — demo users see a special demo block instead of payment buttons, but the cards above are interactive, creating a disconnect.

### Real SaaS Pattern (What Users Expect):

```
Cards (Free, Pro) — ALL ENABLED, interactive
    ↓ (user clicks "Subscribe" / "Upgrade" on desired plan)
Checkout modal / redirect to payment gateway
    ↓ (inside checkout: payment method selection happens)
Complete payment
```

**The golden rule: Plan selection and payment method selection happen in DIFFERENT steps.**

---

## 4. Recommended Redesign for CookMate

### 4.1 The One-Click-to-Checkout Model (Recommended)

#### Top section: Current Plan Status

```
┌──────────────────────────────────────────────────┐
│ Current Plan: Free / Pro                         │
│ [Badge: Free | Pro]                              │
│ Expiry: Dec 31, 2026 (if Pro)                    │
└──────────────────────────────────────────────────┘
```

#### Pricing Cards (Like Notion/Linear)

Use a **global yearly/monthly toggle** above the cards (like Notion), then 2-3 cards:

```
[ Pay Monthly ○ | ● Pay Yearly — Save 20% ]

┌─────────────┐  ┌─────────────────────┐  ┌─────────────┐
│    Free     │  │   Pro (Popular)     │  │  Lifetime   │
│     $0      │  │    ¥119/yr          │  │   ¥299      │
│             │  │  or ¥20/mo          │  │             │
│ [Current]   │  │ [Subscribe →]       │  │ [Buy Now]   │
└─────────────┘  └─────────────────────┘  └─────────────┘
```

- **Cards are always enabled** for non-demo users
- Clicking "Subscribe" on Pro goes directly to checkout
- The yearly/monthly toggle updates ALL card prices in real time
- Free card is non-interactive (just shows current state)

#### What happens when "Subscribe" is clicked:

**Option A (Recommended for CookMate):** Open a checkout modal/page that shows:
```
┌─ Checkout ──────────────────────────┐
│  Plan: Pro - Annual                 │
│  Price: ¥119/year                   │
│                                      │
│  Select payment method:             │
│  [Alipay ●] [WeChat ○] [Card ○]    │
│                                      │
│  [Pay ¥119]                         │
└──────────────────────────────────────┘
```
- This is the Stripe Checkout model
- Payment method selection happens INSIDE the checkout, not on the billing page
- Single "Pay" button at the bottom

**Option B (Simpler):** Click "Subscribe" → immediately redirect to Stripe Checkout / Creem Checkout / Alipay. For CookMate with multiple payment gateways, Option A (a modal page showing payment options) is better because:
- It gives users a choice of payment methods
- The billing page stays clean
- The checkout modal clearly shows what they're buying

#### Demo Users

Keep the demo block but make it cleaner:
```
┌──────────────────────────────────────┐
│ 🔒 Demo account — Register to upgrade │
│ [Register Now →]                     │
└──────────────────────────────────────┘
```

### 4.2 Specific Changes to Make

1. **Remove separate payment method buttons from the billing page** (Alipay, Stripe, Creem, Check Payment buttons below the cards)
2. **Make pricing cards fully interactive** — clicking "Subscribe" triggers the checkout flow
3. **Add a yearly/monthly toggle at the top** (like Notion) instead of putting it inside individual cards
4. **Create a checkout modal/page** that shows:
   - Plan summary (name, period, price)
   - Payment method selection (Alipay, Stripe/card, Creem)
   - Pay button
5. **Consolidate API calls** — instead of separate endpoints for each payment method, have one checkout endpoint that returns the appropriate redirect URL based on the selected payment method

### 4.3 Visual Layout (Wireframe)

```
┌──────────────────────────────────────────────────────────┐
│ Billing & Subscription                            [Title] │
│ Manage your plan and payment settings              [Subtitle] │
├──────────────────────────────────────────────────────────┤
│ Current Plan: Free                                        │
│ [FREE badge]                                              │
├──────────────────────────────────────────────────────────┤
│ Pay Monthly  ○  Pay Yearly ●  (Save 20% with annual)    │
│                                                           │
│  ┌──────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  FREE    │  │  PRO ★ Popular   │  │  ENTERPRISE    │ │
│  │  $0/mo   │  │  ¥119/yr         │  │  Custom        │ │
│  │          │  │  or ¥20/mo       │  │                │ │
│  │[Current] │  │ [Subscribe →]    │  │ [Contact Sales]│ │
│  └──────────┘  └──────────────────┘  └────────────────┘ │
│                                                           │
│  [Quarterly ¥51]  [Semi-annual ¥90]                      │
├──────────────────────────────────────────────────────────┤
│ ℹ️ Select a plan above to proceed to checkout            │
├──────────────────────────────────────────────────────────┤
│ Order History:                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Order #123 | Alipay | ¥119 | Paid | 2026-07-15    │   │
│ └────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│ [Manage Subscription] [Cancel Subscription]               │
└──────────────────────────────────────────────────────────┘
```

---

## 5. How Different SaaS Platforms Handle Multi-Payment

| Platform | Where Payment Methods Appear | Method |
|---|---|---|
| **Linear** | Not on pricing page (deferred to checkout) | Credit card in Stripe checkout |
| **Notion** | Not on pricing page (deferred to checkout) | Credit card, PayPal in checkout |
| **Vercel** | Not on pricing page (deferred to checkout) | Credit card in Stripe checkout |
| **Stripe** | Embedded Checkout modal | 100+ methods in the modal |
| **Feishu** | Not on pricing page (order page → payment) | Alipay, WeChat, card on payment page |
| **Yuque** | Not on pricing page (deferred) | Alipay, WeChat on payment page |

**The universal pattern: Payment methods are NEVER shown as buttons on the pricing/billing page. They appear at the checkout/payment step.**

---

## 6. Edge Cases & UX Considerations

### What about "Check Payment" button?
Current CookMate has a "Check Payment" button for verifying Creem payments. This should be removed from the main billing page. Instead:
- After redirecting to Creem checkout → success URL → the billing page reloads with a success banner
- A "Pending orders" section below the cards can show unpaid/processing orders

### What about the "Quarterly" and "Semi-annual" links?
Current page shows them as text below cards but there are no actual cards for them. Either:
- Add them as smaller card options in the cards grid
- Or hide them if they're not primary offers (like Linear does with optional billing periods)

### What happens on payment success?
Show a success banner at top and update the "Current Plan" section to show Pro.

### Loading & error states
- Card CTA buttons show a spinner while redirecting
- If checkout creation fails, show error inline near the card (not below in a separate section)

---

## 7. Summary of Key Principles

1. **Plan selection IS the purchase action** — clicking a plan card's CTA should trigger the checkout flow, not just select a period
2. **Payment methods are a checkout concern** — never show them as separate buttons on the billing page
3. **Yearly/monthly toggle should be global** — above the cards (Notion-style), not inside individual cards
4. **Cards should always be enabled** — disabled/greyed out cards tell users "this isn't for you"
5. **Single checkout modal/page** — consolidate all payment methods into one checkout, not separate endpoints
6. **Chinese SaaS defaults to annual billing** — leading with annual pricing and showing monthly as secondary option is a proven pattern in CN markets