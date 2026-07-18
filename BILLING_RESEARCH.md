# CookMate Billing Page Redesign — PRO Subscriber Research

## Questions & Answers

### Q1: What should a PRO user see on the billing page?

**Answer:** A well-designed billing page for subscribed users has FOUR distinct sections:

**Section 1 — Current Plan Summary (always visible)**
- Plan name (Pro) + visual badge (orange/highlighted)
- Next renewal/expiry date (prominent — this is the most important info)
- Billing period (Monthly/Annual) + current price per period
- Payment method on file (last 4 digits of card, or "Alipay")
- A "Current" or "Active" status indicator

**Section 2 — Pricing & Plans (still visible, adapted)**
- All plan cards are shown but the current plan is marked "Current" / "Your plan"
- Free plan card: always shown with neutral styling, no upgrade CTA
- Pro plan card: shown as "Current plan" with an **"Extend" or "Renew" button** instead of "Upgrade"
- If there are higher tiers (e.g., Enterprise), show them with "Contact sales" CTAs
- The pricing toggle (monthly/annual) may be hidden for PRO users since their billing period is already known

**Section 3 — Manage Subscription**
- Cancel subscription (with confirmation flow and retention offers)
- Change payment method
- Update billing info
- Download invoices

**Section 4 — Usage / Order History**
- Recent orders/payments list
- Invoice history with download links
- Usage metrics (if applicable, e.g., API calls, storage used)

### Q2: How do real SaaS sites let users extend/renew before expiry?

**Answer:** There are THREE distinct patterns:

**Pattern A: "Extend" / "Add credits" button (Vercel, GitHub)**
- Vercel Pro users see an "Add credits" or "Upgrade usage limits" button
- This lets users pre-pay for additional usage without changing their plan
- For subscriptions, they redirect to Stripe Customer Portal where users can:
  - Update payment method
  - View upcoming invoices
  - Purchase additional seats/credits

**Pattern B: "Renew" / "Extend subscription" via checkout (middle-market SaaS)**
- A button labeled "Extend subscription" or "Renew now" opens a checkout modal
- This creates a new payment for the same plan, extending the expiry date
- Users can pre-pay for another month/year before the current period ends
- The checkout shows: "Current plan: Pro Annual — Renew for ¥119 → Expires: Dec 31, 2027"

**Pattern C: Stripe Customer Portal (many SaaS)**
- Notion, Linear, Figma all use Stripe Billing → redirect to Stripe Customer Portal
- Inside the portal: update plan, update card, view invoices, cancel
- Users can't "extend early" — they just let auto-renewal handle it
- The portal shows "Next billing date" and "Current plan"

**Key finding: Most SaaS do NOT let users manually extend early.** They rely on auto-renewal and show the next billing date. The "extend" functionality is rare and usually means buying add-ons or additional seats. For CookMate, since payment is via one-time orders (not subscription webhooks), **adding an "Extend" button is both appropriate and necessary.**

### Q3: What information is most important for a subscribed user?

**Ranked by priority:**

1. **Renewal/Expiry Date** — Always the #1 thing a subscribed user wants to know. Show it prominently with a clear label ("Next billing date" or "Subscription expires").
2. **Current Plan + Price** — What am I paying, and for what? Show plan name, period (monthly/annual), and amount.
3. **Status indicator** — "Active" vs "Cancelled (expires on...)" — vital context.
4. **Payment method on file** — "Alipay" or card ending in 1234. Users check this to confirm their payment info is current.
5. **Invoice/Order history** — Especially important for users who need receipts for expense reports.
6. **Cancel/Manage option** — Users want to know they CAN leave, even if they don't plan to.
7. **Extend/Renew option** — Useful for users who want to pre-pay or who are on non-recurring payment.

### Q4: How to visually present "already subscribed" status while still showing pricing info?

**Answer:** The universal pattern across SaaS is:

**For the PRO plan card:**
- Use the same card layout but change the CTA from "Upgrade" → "Current plan" or "Active"
- Add a green or orange "Active" / "Current" badge on the card
- The card should have a subtle outline/border color to distinguish it (green border or brand color)
- Change the CTA button from primary (call-to-action) to secondary/subtle
- Add a secondary CTA below: "Extend subscription" or "View renewal details"

**For the Free plan card:**
- Show it as a smaller/comparison card
- Grey it out or mark "Downgrade" with warning styling
- Don't make it prominent — it's a downgrade path, not an upgrade

**The NOTION pattern (best reference):**
- Shows all plan cards on the billing page
- Current plan card has a filled "Current" badge top-right
- Current plan card's button says "Your plan" (disabled/grey) instead of "Upgrade"
- Higher-tier plan cards show "Upgrade" buttons with pricing
- Below cards: "Plan details" section with seat count, billing period, next payment

**The FIGMA pattern:**
- Shows current plan in a separate "Your Plan" card at the top
- Below: "Plans" comparison with a table showing all plan features
- Current plan column is highlighted with a different background
- "Current" badge on the column header

**The GITHUB pattern:**
- Top section: "Current plan" card with plan name, status, and next billing date
- Below: "Change plan" section — horizontal cards with Free/Pro/Team/Enterprise
- Current plan card is visually distinct (different border color)
- Current plan's CTA is "Current plan" (disabled)
- Other plans show "Upgrade to..." with prices

---

## Real-World Examples — Detailed Analysis

### Example 1: GitHub (Settings > Billing > Plans)

**For FREE users:**
- See "Current plan: Free" card at top
- Below: horizontal cards for Pro ($4/mo), Team ($8/user/mo), Enterprise (contact sales)
- Each card shows features and a CTA button ("Upgrade to Pro", etc.)
- No usage breakdown for free tier (limited visibility)

**For PRO users:**
- Top card: "Current plan: Pro" with green checkmark and "Active" indicator
- Next billing date shown: "Next billing date: July 30, 2026"
- Payment method: "Visa ending in 4242" with "Update" link
- Below: "Change plan" section still visible — Pro card shows "Current plan" badge
- Team and Enterprise cards show "Upgrade to Team" etc.
- **Usage breakdown** section: Actions minutes, storage, Codespaces hours — with meters showing usage vs limit
- Invoice history: downloadable PDFs
- "Cancel plan" link at bottom (with retention flow)
- **No "Extend" button** — GitHub relies on auto-renewal via credit card

**Key takeaway for CookMate:** Show the usage of the service (e.g., "Recipes created: 43/∞" or "AI generations used this month: 12/100").

### Example 2: Vercel (Dashboard > Settings > Billing)

**For Hobby (FREE) users:**
- "Current plan: Hobby" card
- Below: "Usage" section showing bandwidth, serverless functions, etc.
- "Upgrade to Pro" button ($20/mo)
- No metered overage for Hobby

**For PRO users:**
- "Current plan: Pro" — shows plan name + "Active" status
- Next invoice: "Next invoice: $20 — August 1, 2026"
- Payment method: card on file with "Update" link
- **Usage breakdown (critical):** Bandwidth used, Functions invocations, Edge requests, Storage — each with a meter bar and monthly allowance
- "Add credits" button to pre-pay for overage
- "Manage subscription" → redirects to **Stripe Customer Portal** where users can:
  - Change billing period (monthly ↔ annual)
  - Update payment method
  - View invoices
  - Cancel
- No pricing cards shown for Pro users — just current plan summary
- **No "Extend" button** — uses auto-renewal

**Key takeaway for CookMate:** Usage meters are a powerful value-add for subscribed users. "You've used 15/100 AI generations this month" makes the subscription feel tangible.

### Example 3: Notion (Settings > Billing)

**For FREE users:**
- "Current plan: Free" card
- Below: Pricing cards (Plus $10/mo, Business $18/mo, Enterprise custom)
- Each card shows: price, per-user basis, CTA button ("Upgrade to Plus", etc.)
- Monthly/annual toggle at top

**For PRO users (Plus/Business):**
- Top section: "Current plan" with plan name, billing period, next payment date
- "Manage subscription" section with:
  - "Change plan" dropdown (upgrade to Business, downgrade to Free)
  - Payment method (credit card)
  - Invoice history (downloadable)
  - "Cancel plan" link
- Below: **Pricing comparison table** showing all plan features
- The Plus card (current plan) shows "Current plan" in prominent text
- Other plan cards show "Upgrade" buttons
- No explicit "Extend" button — auto-renewal via Stripe

**Key takeaway for CookMate:** Notion shows a FEATURE COMPARISON table below the plan cards. Subscribed users can see exactly what they're getting vs what they'd get with an upgrade.

### Example 4: Figma (Settings > Billing)

**For FREE (Starter) users:**
- Top: "Starter (Free)" card with "Current plan" badge
- Below: Professional ($15/seat/mo), Organization ($45/seat/mo), Enterprise (custom)
- Each plan shows per-seat pricing, products included (Figma Design, FigJam, Dev Mode)
- Feature comparison table below

**For PRO (Professional/Organization) users:**
- Top: "Current plan: Professional" card with plan details
  - Seat count, billing period, next invoice date, price per seat
- "Manage billing" section:
  - Update billing email
  - View payment method
  - Download invoices
  - Cancel subscription
- Below: **All plans still visible** — Professional shows "Current" badge
- Organization and Enterprise show "Upgrade" / "Contact sales" buttons
- Starter plan shows "Downgrade" as a small link
- No "Extend" button — auto-renewal

**Key takeaway for CookMate:** Figma shows the CURRENT PLAN with seat-level detail. For individual subscriptions, this maps to "Pro Annual ¥119".

### Example 5: Linear (Settings > Billing)

**For FREE users:**
- "Current plan: Free" card
- Below: Basic ($10/user/mo), Business ($16/user/mo), Enterprise (custom)
- Per-user pricing shown
- Each card has a per-plan yearly checkbox (Billed yearly)
- CTA: "Get started" / "Contact sales"

**For PRO (Basic/Business) users:**
- Top: "Current plan" card with:
  - Plan name, seats used, price per seat, next billing date
- "Change plan" dropdown: switch between Free/Basic/Business/Enterprise
- Payment method: card on file
- Invoice history
- "Cancel subscription" link
- No pricing cards shown below — just the change plan dropdown
- **No "Extend" button** — Stripe auto-renewal

**Key takeaway for CookMate:** Linear hides pricing cards for subscribed users and uses a simple dropdown for plan changes. This is at the "minimal" end of the spectrum.

---

## Universal SaaS Billing Page Patterns for Subscribed Users

### Pattern 1: The "Current Plan Hero" (Vercel, Figma, GitHub)
```
┌──────────────────────────────────────┐
│  Current Plan: Pro  ★  Active        │
│  ¥119/year · Annual · Expires Dec 31 │
│  Payment: Alipay  [Manage]           │
│  ┌────────────────────────────────┐  │
│  │ Usage: AI Generations           │  │
│  │ ████████░░░░ 15/100 this month │  │
│  └────────────────────────────────┘  │
│  [Extend Subscription] [Cancel]      │
└──────────────────────────────────────┘
```

### Pattern 2: The "Plan Comparison Below" (Notion, GitHub)
```
┌──────────────────────────────────────┐
│  Current Plan: Pro                   │
│  Expires: Dec 31, 2026 · ¥119/year  │
│  Payment: Alipay                     │
└──────────────────────────────────────┘

       [Monthly ○ Annual ● — Save 20%]

┌──────────┐  ┌────────────────┐  ┌──────────┐
│   Free   │  │  Pro (Current) │  │Enterprise│
│   ¥0     │  │  ¥119/yr       │  │  Custom  │
│[Downgrade]│  │  [Extend →]    │  │[Contact] │
└──────────┘  └────────────────┘  └──────────┘

┌─ Feature Comparison ─────────────────┐
│  Unlimited recipes         ✓ ✓ ✓    │
│  AI meal planning          — ✓ ✓    │
│  Priority support          — — ✓    │
└──────────────────────────────────────┘
```

### Pattern 3: The "Minimal Manage" (Linear, Slack)
```
┌──────────────────────────────────────┐
│  Current Plan: Pro  Annual           │
│  ¥119/year · Next bill: Dec 31, 2026│
│                                      │
│  [Change plan] → dropdown            │
│  [Payment method] → Visa *4242       │
│  [Invoices] → 2 invoices             │
│  [Cancel subscription]               │
└──────────────────────────────────────┘
```

---

## Recommended Redesign: CookMate PRO Billing Page

### Layout (2-column on desktop, stacked on mobile)

```
┌──────────────────────────────────────────────────────────┐
│ Billing & Subscription                                   │
│ ─────────────────────────────────────────────────────── │
│                                                           │
│ ┌─ Current Plan ───────────────────────────────────────┐ │
│ │  PRO · Active                             [PRO]     │ │
│ │  ¥119 · Annual                                         │ │
│ │  Expires: December 31, 2026                           │ │
│ │  Payment method: Alipay                                │ │
│ │                                                        │ │
│ │  [Extend Subscription →]   [Cancel]                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                           │
│ ┌─ Plan Details & Pricing ─────────────────────────────┐ │
│ │  [Monthly ○  ● Annual — Save 20%]  (pre-selected)   │ │
│ │                                                        │ │
│ │  ┌────────────┐  ┌──────────────────┐  ┌────────────┐│ │
│ │  │ Free       │  │  Pro ★           │  │ Enterprise ││ │
│ │  │ ¥0         │  │  ¥119/yr         │  │  Custom    ││ │
│ │  │            │  │  or ¥20/mo       │  │            ││ │
│ │  │ [Current]  │  │  [Your Plan]     │  │[Contact]   ││ │
│ │  └────────────┘  └──────────────────┘  └────────────┘│ │
│ │                                                        │ │
│ │  Pro features you get:                                 │ │
│ │  ✓ Unlimited AI recipe generation                      │ │
│ │  ✓ Weekly meal planning                                │ │
│ │  ✓ Smart grocery lists                                 │ │
│ │  ✓ Priority support                                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                           │
│ ┌─ Usage This Month ───────────────────────────────────┐ │
│ │  AI Generations: ████████░░░░░░ 15 / 100  [Unlimited]│ │
│ │  Meal Plans: ██████░░░░░░░░░░░ 6 / 30                │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                           │
│ ┌─ Manage Subscription ─────────────────────────────────┐ │
│ │  Payment method: Alipay  [Change]                     │ │
│ │  Invoice history:  [View all orders →]               │ │
│ │   • Order #CM2407 — ¥119 — Jul 15, 2026 — Paid       │ │
│ │   • Order #CM2406 — ¥119 — Jun 15, 2026 — Paid       │ │
│ │                                                        │ │
│ │  [Cancel Subscription] (with 2-step confirmation)     │ │
│ └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **PRO users see pricing cards** — but the Pro card shows "Your Plan" instead of "Upgrade". This keeps the page visually rich and reminds PRO users what they're paying for.

2. **"Extend Subscription" button** — Since CookMate uses one-time payments (not Stripe subscriptions with auto-renewal), this is the most important addition. Clicking it opens the same checkout modal for the current plan, letting users pre-pay for another period. The checkout modal should show "Renewing Pro Annual — ¥119 — New expiry: Dec 31, 2027".

3. **Usage section** — Shows real value. Users with 15/100 AI generations see their subscription is being used. Users with 0/100 see they should use it more (reduces churn!).

4. **Feature list on pricing cards** — Even for PRO users. This reinforces the value proposition at every visit.

5. **Cancel button stays visible** — But with a 2-step confirmation. This is required by payment processor best practices and user trust.

6. **Orders/invoice history** — Expandable cards showing each payment. Users need this for records.

### Handling Edge Cases

- **Expired PRO**: Show "Expired on Dec 31, 2026" in red/orange + "Reactivate Pro" button
- **Cancelled PRO**: Show "Cancelled — expires Dec 31, 2026" with orange badge + "Resubscribe" button
- **About to expire** (< 30 days): Show warning banner "Your subscription expires in 14 days → Renew now"
- **Newly subscribed**: Show success banner with "Welcome to Pro!" for first visit
- **Demo user**: Keep the demo block but redirect to registration

### Implementation Notes

1. The `extend` API call should be the same as the `upgrade` call (same checkout flow), just with a different label
2. The `billingPeriod` toggle can be pre-populated based on the user's current plan (infer from order amount)
3. Invoice history uses the existing orders API — just style it inline instead of linking to a separate page
4. Usage metrics need a new API endpoint or dashboard API extension

### What NOT to do

- ❌ Don't hide pricing info entirely — users want to see what they're paying for
- ❌ Don't show "Upgrade" CTA on the current plan — confusing
- ❌ Don't make the page a single lonely cancel button (current problem!)
- ❌ Don't redirect to external portal for everything — keep core actions (extend, view history) on the page
- ❌ Don't force PRO users to a separate "Orders" page — show history inline