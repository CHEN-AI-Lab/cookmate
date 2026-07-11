# CookMate Legal & Compliance Requirements Research

**Compiled:** 2026-07-11  
**Scope:** SaaS recipe & meal planning platform (CookMate) — Chinese user origin with international expansion  
**Data collected:** email, phone, dietary preferences, recipes, payment data (via payment processor)

---

## 1. Required Legal Pages (Minimum Viable Set)

| # | Page | Required For | Regulatory Basis |
|---|------|-------------|-----------------|
| 1 | **Privacy Policy** | All users | GDPR Art. 13-14, CCPA, PIPL Art. 17 |
| 2 | **Terms of Service / Terms of Use** | All users | Contract law, EU Digital Services Act |
| 3 | **Cookie Policy** | EU/EEA + UK users | ePrivacy Directive Art. 5(3), GDPR Recital 30 |
| 4 | **Data Processing Agreement (DPA)** | EU/EEA users if using third-party processors | GDPR Art. 28 |
| 5 | **Acceptable Use Policy** (may be part of ToS) | All users | Industry best practice |
| 6 | **Refund/Cancellation Policy** | Paid subscription users | EU Consumer Rights Directive, local laws |
| 7 | **DMCA / Copyright Policy** | US users | DMCA safe harbor (17 U.S.C. § 512) |
| 8 | **Accessibility Statement** | All users (EU recommended) | EU Web Accessibility Directive (EN 301 549), WCAG |
| 9 | **California Privacy Notice** (supplement to Privacy Policy) | California residents | CCPA/CPRA (Cal. Civ. Code §1798.100) |
| 10 | **GDPR Privacy Notice** (supplement) | EU/EEA data subjects | GDPR Art. 13-14 |

---

## 2. Privacy Policy Requirements

### 2.1 GDPR (EU/EEA Users) — Regulation (EU) 2016/679

**Required information under Art. 13 GDPR** (when collecting data directly from user):

1. **Identity & contact details** of the data controller (CookMate operator entity)
2. **Contact details of Data Protection Officer** (if applicable)
3. **Purposes & legal basis** for each processing activity (Art. 6(1))
   - Consent (Art. 6(1)(a)) — marketing cookies, email newsletters
   - Contract (Art. 6(1)(b)) — account creation, service delivery
   - Legitimate interest (Art. 6(1)(f)) — analytics, fraud prevention
4. **Legitimate interests** pursued (if relying on Art. 6(1)(f))
5. **Recipients or categories of recipients** of personal data
6. **Intention to transfer data** to third countries (e.g., US via Vercel/PostgreSQL) + safeguards (Art. 46, Standard Contractual Clauses)
7. **Retention period** or criteria to determine it
8. **Data subject rights** (Art. 15-22):
   - Right of access (Art. 15)
   - Right to rectification (Art. 16)
   - Right to erasure / "right to be forgotten" (Art. 17)
   - Right to restrict processing (Art. 18)
   - Right to data portability (Art. 20)
   - Right to object (Art. 21)
   - Right to withdraw consent at any time
   - Right to lodge complaint with supervisory authority (Art. 77)
9. **Whether providing data is a statutory/contractual requirement** and consequences of not providing it (Art. 13(2)(e))
10. **Existence of automated decision-making/profiling** (Art. 13(2)(f), Art. 22) — especially relevant for AI recipe recommendations

**Key GDPR Principles (Art. 5):**
- Lawfulness, fairness, transparency
- Purpose limitation
- Data minimization
- Accuracy
- Storage limitation (delete when no longer needed)
- Integrity and confidentiality (security)
- Accountability (demonstrate compliance)

**GDPR Fines:** Up to €20M or 4% of annual global turnover, whichever is higher (Art. 83)

**Source:** https://gdpr-info.eu/art-13-gdpr/, https://gdpr-info.eu/art-5-gdpr/

### 2.2 CCPA/CPRA (California Users) — Cal. Civ. Code §1798.100

**Requirements for CookMate (if accessible to CA residents):**

1. **Notice at Collection** — inform users at or before data collection about categories collected and purposes
2. **Right to Know** — what personal information was collected, disclosed, or sold in past 12 months
3. **Right to Delete** — request deletion of personal information (with exceptions)
4. **Right to Opt-Out of Sale/Sharing** — if data is "sold" or "shared" for cross-context behavioral advertising (broad definition — includes sharing with ad networks)
5. **Right to Correct** — inaccurate personal information
6. **Right to Limit Use of Sensitive Personal Information** — dietary preferences may qualify as "sensitive" in some contexts
7. **Non-Discrimination** — cannot deny service or charge different prices for exercising CCPA rights
8. **"Do Not Sell My Personal Information" link** — must be a clear link on homepage (if selling/sharing applies)
9. **Financial Incentive Notice** — if offering discounts for data collection
10. **Service Provider agreements** with any third parties processing data

**Applies if CookMate:**
- Has annual gross revenue > $25M, OR
- Buys/receives/sells personal info of 100,000+ CA residents/households, OR
- Derives 50%+ of revenue from selling/sharing personal info

**CCPA Fines:** $2,500 per unintentional violation, $7,500 per intentional violation (civil penalties)

**Source:** https://oag.ca.gov/privacy/ccpa

### 2.3 PIPL (China — Primary Market) — Personal Information Protection Law of the PRC

**Effective:** November 1, 2021

**Key requirements for CookMate as a China-origin platform:**

1. **Consent** — Must obtain individual consent for collecting/processing personal information (Art. 13-14). Separate consent required for sensitive personal info and cross-border transfers
2. **Purpose Limitation** — Must specify purpose, method, and scope of processing (Art. 6)
3. **Minimal Collection Principle** — Only collect data necessary for the service (Art. 6)
4. **Sensitive Personal Information** (Art. 28-32):
   - Dietary preferences, health data, biometrics, location — could apply to recipe data
   - Requires: separate consent, purpose necessity explanation, impact assessment, stricter security
5. **Cross-Border Data Transfer** (Art. 38-43):
   - If user data is transferred out of China (e.g., to Vercel/PostgreSQL in US/EU):
     - Must pass a **security assessment** by the CAC (Cyberspace Administration of China) — for operators handling data of >1M people or transferring >100K people's data
     - OR obtain **PI standard contract** certification
     - OR obtain **PI protection certification** from accredited body
   - Must inform users of: recipient's name/contact, purpose, method, type of data, and obtain **separate consent**
6. **Individual Rights** (Art. 44-50):
   - Right to know and decide
   - Right to access/copy
   - Right to portability (where conditions met)
   - Right to correct/complete
   - Right to delete
   - Right to revoke consent
   - Right to request explanation of processing rules
   - Right to deceased data handling instructions
7. **Data Protection Officer** — Required if processing personal info of >1M individuals (Art. 52)
8. **Impact Assessment** — Required before processing sensitive PI, automated decision-making, data sharing, cross-border transfer, or processing data of vulnerable groups (Art. 55-56)
9. **Data Breach Notification** — Must notify individuals and regulators within a reasonable time (Art. 57)
10. **Automated Decision-Making** (Art. 24) — Must ensure transparency and fairness. Users have right to reject decisions based solely on automated processing (relevant for AI recipe recommendations)

**PIPL Fines:** Up to RMB 50M or 5% of previous year's annual revenue; responsible persons fined up to RMB 100K-1M

**Key Distinction from GDPR:** PIPL treats cross-border transfers more restrictively (requires CAC security assessment vs SCCs under GDPR). PIPL also has specific rules for "important data" and "state secrets" categories.

**Source:** Official text at pkulaw.com; summary at https://www.twobirds.com/ (PIPL overview)

---

## 3. Terms of Service — Common Required Clauses

| Clause | Purpose | Legal Reference |
|--------|---------|-----------------|
| **Acceptance of Terms** | Defines how user agrees (clickwrap) | Contract law |
| **Account Registration** | User obligations (accurate info, security) | Best practice |
| **Subscriptions & Billing** | Pricing, payment terms, auto-renewal | EU Consumer Rights Directive 2011/83/EU |
| **Cancellation & Refund Policy** | Right of withdrawal (14-day cooling-off in EU) | EU Consumer Rights Directive Art. 9 |
| **License Grant** | What user licenses from CookMate, scope | Copyright law |
| **User Content License** | Rights CookMate needs to display user recipes | Copyright law, GDPR |
| **Acceptable Use / Prohibited Conduct** | What users cannot do | Best practice |
| **Intellectual Property Rights** | Ownership of platform + recipes | Copyright, trademark |
| **Privacy & Data Collection** | Link to Privacy Policy | GDPR Art. 13 |
| **Disclaimer of Warranties** | "As-is" service, no guarantees | UCC §2-316 (US), Consumer law |
| **Limitation of Liability** | Cap on damages (must be reasonable) | Varies by jurisdiction |
| **Indemnification** | User holds CookMate harmless for their misuse | Best practice |
| **Termination** | Grounds for account suspension/deletion | Best practice |
| **Dispute Resolution / Governing Law** | Arbitration, choice of law, venue | Contract law, EU Brussels Regulation |
| **DMCA / Copyright Policy** | Takedown procedures (US) | 17 U.S.C. § 512 |
| **Changes to Terms** | Notice period, user rights | Best practice |
| **Service Level Agreement (SLA)** | Uptime guarantees, credits (for paid tiers) | Best practice |
| **AI/ML Disclosure** | How AI is used in recipe generation/recommendations | EU AI Act (2024), PIPL Art. 24 |
| **Food Disclaimer** | Nutritional info not guaranteed, consult professionals | FDA liability, tort law |

### EU-Specific ToS Requirements
- **Right of withdrawal** (14-day cooling-off period for digital services, EU Consumer Rights Directive)
- **Pre-contractual information** — must be provided in a durable medium
- **Digital Content Directive** (EU 2019/770) — remedies for defective digital services
- **Unfair Contract Terms Directive** (93/13/EEC) — terms must be fair and transparent

### China-Specific ToS Requirements
- Must be in **Chinese language** (or bilingual with Chinese version prevailing)
- Must comply with **E-Commerce Law** (电子商务法) — Art. 33: clear ToS; Art. 17: no false/misleading info
- **Cybersecurity Law** (网络安全法) — Art. 24: real-name registration (phone number required)
- **Personal Information Protection Law** (个人信息保护法) — Art. 7: clarity and transparency

---

## 4. Cookie Consent Requirements

### GDPR + ePrivacy Directive (EU)

- **Consent required** for ALL non-essential cookies (analytics, marketing, preferences)
- **Strictly necessary cookies** — exempt from consent (must still be disclosed)
- **Consent must be:**
  - **Active** (no pre-ticked boxes, no "silent consent")
  - **Granular** (user can choose categories)
  - **Freely given** (cookie walls not allowed — can't block service for refusing cookies)
  - **Revocable** (easy to withdraw consent)
  - **Documented** (must keep records of consent)
- **Cookie banner** must have clear "Accept All" and "Reject All" buttons
- **Cookie Policy** must list: each cookie's name, provider, purpose, expiry, type
- **Consent Platform**: Recommend a CMP (Cookie Consent Management Platform) like Cookiebot, OneTrust, or Osano
- **Duration**: Consent expires after max 12 months (ePrivacy guidance)

### ePrivacy Directive (EU) Art. 5(3)
- Storage of or access to information already stored requires prior informed consent
- This covers cookies, localStorage, fingerprinting, and similar tracking

### CCPA (California)
- "Opt-out" model (not opt-in like GDPR)
- Must provide "Do Not Sell or Share My Personal Information" link
- Must honor Global Privacy Control (GPC) browser signal
- Cookie consent banners for CCPA can have a simpler "I agree to cookies" approach

### China (PIPL)
- Requires **informed consent** for all cookies processing personal information
- PIPL does not have a cookie-specific rule, but consent requirements apply to any automated collection of personal information
- Practical guidance from MIIT/CAC: cookie disclosures recommended for Chinese apps/sites

### What CookMate Needs:
1. **Cookie Consent Banner** with Accept All / Reject All / Customize
2. **Cookie Policy Page** — detailed list of all cookies used
3. **Consent Management Platform** (CMP) integration
4. **Preference Center** for users to change consent after initial choice
5. **Record of Consent** for GDPR compliance (who, when, what) — store in DB

---

## 5. Data Retention & Deletion Policies

### GDPR Requirements
- **Storage limitation principle** (Art. 5(1)(e)): Data must not be kept longer than necessary
- **Retention schedule** must be documented and communicated to users
- **Right to erasure / "right to be forgotten"** (Art. 17): Users can request deletion with 1-month response time (extendable to 3 months for complex requests)
- **Exemptions** to deletion: compliance with legal obligations, defense of legal claims, public health, archiving/research

### Recommended Retention Schedule for CookMate

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Account profile (name, email, phone) | Duration of account + 90 days after deletion | Contract performance, legal hold window |
| Dietary preferences / saved recipes | Duration of account + 90 days | Core service, user convenience |
| Payment info (handled by processor) | Not stored by CookMate — PCI DSS | Use Stripe/Paddle as processor |
| Transaction history | 7 years (tax/compliance) | Tax law, financial record-keeping |
| Cookie consent records | 2 years after last interaction | GDPR Art. 7 — demonstrate consent |
| Session/log data (IP, user agent) | 26 months max | GDPR recommended max for analytics |
| Marketing preferences/consent | Until withdrawn | Opt-in/opt-out records |
| Deleted accounts (backups) | Max 90 days after deletion | Recovery window |
| AI training data (anonymized) | Indefinite (if truly anonymized) | GDPR Recital 26 — not personal data |

### Deletion Process
- Must implement **account deletion tool** in user settings
- Must confirm identity before processing deletion request
- Must cascade delete to all third-party service providers (Vercel, PostgreSQL)
- Must inform user of exceptions (e.g., legal retention requirements)
- Must confirm deletion completion to user within timeframe

---

## 6. User Data Export (Right to Data Portability)

### GDPR Art. 20
- Right to receive personal data in **structured, commonly used, machine-readable format** (JSON, CSV, XML)
- Right to have data transmitted directly to another controller where technically feasible
- Applies only to:
  - Data processed by consent or contract (not legitimate interest)
  - Data provided **by the data subject** (not inferred/derived data)
  - Data processed by automated means

### What CookMate Must Provide:
- **Data export feature** in user settings ("Download My Data")
- Export format: **JSON** (preferred) and/or **CSV**
- Data scope: account info, recipes, dietary preferences, saved meals, shopping lists
- Excluded: AI-recommendation logs, internal analytics, inferred dietary scores
- Response time: **within 30 days** (GDPR Art. 12(3))
- Must be free of charge unless requests are manifestly unfounded/excessive (Art. 12(5))

### CCPA Right to Know & Portability
- Right to request categories and specific pieces of personal info
- Must deliver within 45 days (extendable to 90)
- Must provide at least two methods for submitting requests (e.g., web form + email)
- Must deliver in portable format (JSON/CSV)

### PIPL Art. 45
- Right to request copy of personal information
- If conditions met, right to transfer to another designated PI processor (portability provision)

---

## 7. Age Restrictions & COPPA Compliance

### COPPA (US) — Children's Online Privacy Protection Act (15 U.S.C. §§ 6501–6506)
- **Applies to:** commercial websites and online services directed at children **under 13**, or that knowingly collect data from children under 13
- If CookMate **targets the general public** (not specifically children), and does not knowingly collect data from under-13s, COPPA may not apply
- **However**: if CookMate collects any data from a child under 13 (even inadvertently), it triggers obligations:
  1. Post a privacy policy describing info collected from children
  2. Notify parents and obtain **verifiable parental consent** before collecting data
  3. Give parents right to review/delete child's data
  4. Maintain confidentiality/security of children's data
  5. Retain data only as long as necessary
- **Enforcement:** FTC — civil penalties up to $51,744 per violation

### GDPR Art. 8 — Children's Consent
- For information society services offered directly to a child:
  - **Age of digital consent: 16** (default, but member states can lower to 13)
  - Below this age: require **consent from holder of parental responsibility**
- **Reasonable efforts** to verify age
- **Practical approach:** Block sign-up for users indicating age < threshold, or require parent email

### PIPL — Children's Data
- Special protection for minors under 14 (Art. 28-31):
  - Data of minors under 14 is classified as **sensitive personal information**
  - Requires **separate consent** from parent/guardian
  - Dedicated privacy policy for children

### CookMate's Risk & Recommendation
- **Risk score: Low-Medium** — recipe/meal planning is not inherently child-directed
- **Recommendation:**
  - Add **age gate** at sign-up (minimum age 16 for GDPR, 13 for US)
  - If targeting families: implement **parental consent flow** (email verification)
  - Add clause in ToS: "Must be 16+ (or 13+ with parental consent)"
  - COPPA-safe harbor: use FTC-approved COPPA compliance program (e.g., CARU, TRUSTe)

---

## 8. Accessibility Requirements (WCAG)

### WCAG 2.2 Level AA (Current Standard)
Web Content Accessibility Guidelines — W3C Recommendation

**Four Principles (POUR):**
1. **Perceivable** — info and UI must be presentable to all senses
2. **Operable** — UI can be operated by various means (not just mouse)
3. **Understandable** — info and UI must be understandable
4. **Robust** — content can be interpreted by assistive technologies

**Key WCAG 2.2 AA Requirements (13 criteria):**

| Success Criterion | Requirement for CookMate |
|-------------------|--------------------------|
| 1.1.1 Non-text Content | Recipe images must have alt text |
| 1.2.4 Captions (Live) | Video content needs captions |
| 1.3.1 Info and Relationships | Proper headings, lists, ARIA landmarks |
| 1.3.4 Orientation | Works in portrait and landscape |
| 1.3.5 Identify Input Purpose | Autofill attributes on forms |
| 1.4.3 Contrast (Minimum) | Text: 4.5:1, large text: 3:1 |
| 1.4.4 Resize Text | 200% zoom without loss |
| 1.4.10 Reflow | No horizontal scroll at 320px width |
| 1.4.11 Non-text Contrast | UI components: 3:1 |
| 1.4.12 Text Spacing | Supports user text spacing overrides |
| 2.1.1 Keyboard | All functionality via keyboard |
| 2.2.2 Pause, Stop, Hide | Moving content can be paused |
| 2.4.3 Focus Order | Logical tab order |
| 2.4.4 Link Purpose (In Context) | Links describe their destination |
| 2.4.6 Headings and Labels | Descriptive headings |
| 2.4.7 Focus Visible | Clear focus indicator |
| 2.5.3 Label in Name | Accessible label matches visible label |
| 3.1.1 Language of Page | `lang` attribute set |
| 3.3.1 Error Identification | Form errors clearly identified |
| 3.3.2 Labels or Instructions | Input fields have labels |
| 3.3.3 Error Suggestion | Suggestions for fixing errors |
| 3.3.4 Error Prevention (Legal) | For payments — review before submit |
| 4.1.3 Status Messages | ARIA live regions for dynamic updates |

### Legal Requirements by Jurisdiction

| Jurisdiction | Law | Requirement |
|-------------|-----|-------------|
| **EU** | European Accessibility Act (EU 2019/882) + EN 301 549 | WCAG 2.1 AA required (effective June 2025 for many products) |
| **US** | ADA Title III (42 U.S.C. § 12181-12189) | WCAG 2.0/2.1 AA as de facto standard (DOJ interpretation) |
| **US** | Section 508 (29 U.S.C. § 794d) | WCAG 2.0 AA for federal/state agencies (not directly CookMate) |
| **Canada** | AODA (Ontario), ACA (federal) | WCAG 2.0 AA required for public sector, large organizations |
| **UK** | Equality Act 2010, Public Sector Bodies Accessibility Regulations | WCAG 2.2 AA for public sector |
| **China** | GB/T 37668-2019 (Information Accessibility Standard) | Similar to WCAG 2.0, applies to public services. Private sector less enforced but growing |

### Recommendation for CookMate
- Target **WCAG 2.2 Level AA** as the baseline
- This is especially important for:
  - **Recipe browsing** (alt text, keyboard navigation)
  - **Meal planning forms** (labels, error suggestions)
  - **Payment flows** (focus order, error prevention)
- Add **Accessibility Statement** page documenting conformance level
- Budget for **accessibility audit** (axe-core, WAVE, manual testing)

**Source:** https://www.w3.org/WAI/standards-guidelines/wcag/, https://www.wcag.com/legal/

---

## 9. Food/Recipe Platform Specific Requirements

### 9.1 Nutrition Labeling Claims
- If CookMate displays nutritional content (calories, macros):
  - **FDA (US):** Must comply with FDA nutrition labeling rules if making health/nutrient claims (21 CFR §101)
  - **EU:** Nutrition and health claims regulated by Regulation (EC) No 1924/2006
  - **China:** GB 28050-2011 (National Food Safety Standard for Nutrition Labeling of Prepackaged Foods)
  - **Recommendation:** Label AI-generated nutritional data as "estimates only, not verified"

### 9.2 Allergen Information
- If CookMate stores/shows allergen data:
  - **Mandatory allergen declaration (EU):** 14 allergens under EU FIC Regulation (EU) No 1169/2011
  - **FALCPA (US):** 9 major allergens under Food Allergen Labeling and Consumer Protection Act
  - **China:** GB 7718-2011 requires declaration of 8 major allergens
  - **Recommendation:** Display allergen tags but disclaim AI-generated allergen data as not verified by a professional

### 9.3 User-Generated Content Risks
- User-uploaded recipes may contain:
  - Copyrighted content (plagiarized recipes)
  - Unsafe cooking instructions
  - False health/medical claims
- **Recommendation:**
  - ToS clause: "Users warrant recipes are original and safe"
  - Disclaimer: "Recipes are user-generated — CookMate not responsible for outcomes"
  - Moderation policy for flagged content
  - DMCA takedown procedure (US)

### 9.4 Medical/Health Claim Restrictions
- Recipe platforms must avoid making unsubstantiated medical claims
- **FDA:** Disease treatment claims require pre-approval
- **EU:** Health claims must be authorized under Regulation 1924/2006
- **China:** Food safety law prohibits false/misleading health claims
- **Recommendation:** Disclaim AI recommendations as "informational only, not medical advice"

### 9.5 Dietary Preference Liability
- Users with allergies/restrictions relying on CookMate data
- **Recommendation:** Prominent disclaimer: "Always verify ingredients independently. CookMate does not guarantee allergen-free or diet-compliant results"

---

## 10. Payment & Financial Data Handling

### PCI DSS (Payment Card Industry Data Security Standard)

**Critical point for CookMate:** If using a **third-party payment processor** (Stripe, Paddle, Lemon Squeezy, Alipay, WeChat Pay) and **not storing/transmitting card data directly**, the PCI DSS compliance burden is significantly reduced — this is called **SAQ A** (Self-Assessment Questionnaire A).

| Setup | PCI DSS Scope | What CookMate Must Do |
|-------|--------------|----------------------|
| Stripe Checkout / Elements (redirect to Stripe-hosted page) | **SAQ A** (least burdensome) | Complete SAQ A annually, validate no card data touches your server |
| Custom payment form with Stripe API | **SAQ A-EP** | More requirements: access control, logging, testing |
| Store card numbers yourself | **SAQ D** (full compliance — DO NOT DO THIS) | Massive scope: 300+ requirements, on-site audits |

**Recommended approach: Stripe Checkout or Paddle Checkout (redirect model)**
- CookMate never touches raw card numbers
- PCI DSS scope: SAQ A only
- Annual self-assessment
- Network security scan (if applicable)

### Payment Data Types & Handling

| Data Type | CookMate Stores? | Compliance Requirement |
|-----------|-----------------|----------------------|
| Credit card number | **NO** — use Stripe/Paddle | PCI DSS Prohibited (unless SAQ D) |
| CVC/CVV | **NO** — never store | PCI DSS Prohibited |
| Cardholder name | YES (from Stripe customer object) | Minimal risk |
| Last 4 digits / expiry | YES (display only) | PCI DSS permitted |
| Billing address | YES (for tax/receipt) | Minimal risk, GDPR applies |
| Subscription/receipt records | YES (transaction IDs, amounts) | Tax records: 7 years |
| Alipay/WeChat Pay tokens | YES (payment provider tokens) | Follow provider's security guidelines |

### Jurisdiction-Specific Payment Rules

| Jurisdiction | Regulation | Key Requirement |
|-------------|-----------|-----------------|
| **EU** | PSD2 / Strong Customer Authentication (SCA) | 3D Secure 2 required for EU card payments |
| **China** | Payment rules under PBOC (People's Bank of China) | Alipay/WeChat Pay integration; real-name verification |
| **China** | 《非银行支付机构网络支付业务管理办法》 | Online payment institutions regulation |
| **US** | State money transmitter laws | If acting as payment aggregator (not if using Stripe) |

### Recommendation for CookMate
1. **Use Stripe** (or Paddle/Lemon Squeezy) with hosted checkout — SAQ A
2. **Never store raw card data** on your servers or PostgreSQL
3. **Implement 3D Secure** (Stripe Radar/Stripe Checkout handles this)
4. **Store payment history** (transaction IDs, amounts, dates) for 7 years for tax purposes
5. **Add to Privacy Policy:** "We do not store credit card information. Payments are processed securely by Stripe"
6. **For Chinese payments:** Integrate Alipay + WeChat Pay via Stripe's China payment methods or use a local aggregator

**Source:** https://www.pcisecuritystandards.org/

---

## 11. Summary: CookMate Compliance Action Plan

### Immediate (Before Launch)

| Action | Priority | Effort |
|--------|----------|--------|
| Draft **Privacy Policy** (multi-jurisdiction: GDPR + CCPA + PIPL) | **CRITICAL** | High |
| Draft **Terms of Service** with all required clauses | **CRITICAL** | High |
| Draft **Cookie Policy** | **CRITICAL** | Medium |
| Implement **Cookie Consent Banner** (CMP integration) | **CRITICAL** | Medium |
| Add **age gate** at registration (16+ default) | **CRITICAL** | Low |
| Add **Privacy Policy + ToS links** in signup footer | **CRITICAL** | Low |
| **PCI DSS SAQ A** complete (annual) | **CRITICAL** | Low |
| Add **data export feature** (user settings) | **HIGH** | Medium |
| Add **account deletion tool** (user settings) | **HIGH** | Medium |
| Add **"Do Not Sell My Info"** link (for US CA users) | **HIGH** | Low |
| Implement **DPA-ready processor agreements** (Vercel, etc.) | **HIGH** | Low |

### Short-Term (First 90 Days)

| Action | Priority | Effort |
|--------|----------|--------|
| WCAG 2.2 AA compliance audit & remediation | **HIGH** | High |
| Draft **Accessibility Statement** | **MEDIUM** | Low |
| Add **food/health disclaimers** to AI-generated content | **HIGH** | Low |
| Implement **cross-border data transfer mechanisms** (SCCs for EU, CAC assessment for China) | **HIGH** | High |
| Appoint **Data Protection Officer** (required for PIPL if >1M users) | **MEDIUM** | Low |
| Create **data retention policy** and automated enforcement (delete schedules) | **HIGH** | Medium |
| Complete **PIPL impact assessment** for sensitive PI and cross-border transfers | **HIGH** | Medium |

### Ongoing

| Action | Frequency |
|--------|-----------|
| Review Privacy Policy & ToS | At least annually + when laws change |
| PCI DSS SAQ A re-assessment | Annually |
| Cookie consent renewal | Per visitor (12-month max expiry) |
| Accessibility audit | Annually |
| Data deletion schedule enforcement | Monthly cron job |
| Privacy impact assessment updates | When new data processing introduced |

---

## 12. Legal Disclaimer

**This document is for informational purposes only and does not constitute legal advice.** Laws and regulations vary by jurisdiction and are subject to change. CookMate should engage qualified legal counsel in each target jurisdiction (EU, US/California, China) to review all legal documents and compliance measures before launch. Specific regulatory requirements may vary based on CookMate's exact data processing activities, revenue thresholds, and user base composition.

---
*Research compiled from: GDPR.eu, GDPR-info.eu, W3C/WAI, WCAG.com, FTC.gov, PCI Security Standards Council, FDA.gov, California OAG, PIPL official text (pkulaw.com), DLA Piper analysis, Bird & Bird analysis.*