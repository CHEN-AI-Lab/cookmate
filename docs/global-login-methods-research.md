# Global Login Methods Research — CookMate International Expansion

**Date:** July 2025  
**Purpose:** Determine what login/authentication methods to offer for international users of CookMate (AI recipe & meal planning SaaS)  
**Current methods:** Email, Phone, Password, Google, GitHub, WeChat, Alipay  
**Gap:** No social login options for non-China markets (no Facebook, Apple, X/Twitter, etc.)

---

## 1. Global Social Login Market Share (Q1 2024 — LoginRadius Data)

| Provider | Global Share (All Sites) | Ecommerce Share |
|----------|------------------------|-----------------|
| Facebook | 61% | 49% |
| Google | 10% | 6% |
| X (Twitter) | 8% | — |
| Apple | 5% | 3% |
| Amazon | 4% | 21% |
| PayPal | — | 16% |
| Other | 12% | 5% |

**Key trend:** Facebook's share is declining (was 68% in 2019, 61% in 2024). Google, Apple, and Amazon are gaining. 77% of users prefer social logins over traditional registration forms.

---

## 2. Regional Breakdown — Social Login & Authentication Preferences

### North America (US & Canada)

**Dominant social logins:**
1. **Google** — #1 overall, especially on Android-heavy sites
2. **Facebook** — still strong but declining
3. **Apple** — Sign in with Apple growing rapidly (privacy-focused users)
4. **Twitter/X** — moderate usage, declining
5. **Amazon** — significant for ecommerce (21% of ecommerce social logins)

**Email vs Phone:** Strong **email preference**. Phone number is used mainly for 2FA/MFA, rarely as primary identifier.

**Passwordless adoption:** High. Passkeys supported by Apple, Google, and Microsoft. Apple's passkey implementation (iCloud Keychain) is the most widely deployed. Google rolled out passkeys as default in 2024.

**Recommended for CookMate:**
- Google (must-have)
- Apple (must-have for iOS users — ~60% iPhone share in US)
- Facebook (still important, especially for older demographics)
- Email + password (standard fallback)

### Europe (EU)

**Dominant social logins:**
1. **Google** — #1 in most EU countries (60-70% of social logins in some markets)
2. **Facebook** — still strong (#2 in most countries)
3. **Apple** — growing, especially in Northern Europe, privacy-conscious markets
4. **LinkedIn** — notable in professional/work contexts
5. **Twitter/X** — moderate usage

**Region-specific:**
- **VKontakte (VK)** — dominant in Russia (est. 70%+ social login share) and significant in Ukraine, Belarus, Kazakhstan
- **Mail.ru** — used in Russia alongside VK
- **Odnoklassniki** — smaller but present in Russia/CIS

**Email vs Phone:** Strong **email preference** for primary ID. Phone used for 2FA. GDPR has made phone number collection legally risky — email is safer.

**Passwordless adoption:** Moderate but growing. EU is pushing for eIDAS 2.0 (digital identity wallets). Passkeys supported by Apple/Google. Some countries (Estonia, Finland, Netherlands) have national eID schemes.

**GDPR implications:** Avoid mandatory phone number collection. Social login data must be minimized. Apple's "Hide My Email" feature is popular here.

**Recommended for CookMate:**
- Google (must-have)
- Apple (important for iOS markets)
- Facebook (still significant)
- **VKontakte** — if targeting Russia/CIS
- Email + password (compliant fallback)

### United Kingdom

**Dominant social logins:**
1. **Google** — #1
2. **Facebook** — still #2
3. **Apple** — strong growth (especially iPhone users, ~50% smartphone share)
4. **Twitter/X** — moderate
5. **LinkedIn** — popular for professional services

**Email vs Phone:** Strong email preference. Phone used for 2FA.

**Passwordless adoption:** Above average. Apple Passkeys, Google Passkeys well adopted. "Sign in with Apple" widely used.

**Recommended for CookMate:**
- Google (must-have)
- Apple (must-have)
- Facebook (important)
- Email + password

### Japan

**Dominant social logins:**
1. **LINE** — THE dominant platform. LINE is used by 96% of smartphone users in Japan (~95M MAU). LINE Login is the #1 social login method.
2. **Google** — #2, especially on Android
3. **Apple** — growing, significant iPhone share (~65%)
4. **Twitter/X** — surprisingly popular in Japan (X/Twitter has high penetration)
5. **Facebook** — relatively weak in Japan compared to other markets
6. **Yahoo! Japan** — still has significant user base for login

**Email vs Phone:** Phone number is **more common** than in Western markets. LINE is tied to phone numbers. Many Japanese services use phone + email.

**Passwordless adoption:** Moderate. LINE already offers LINE Login (OAuth). Passkey adoption growing but slower.

**Recommended for CookMate:**
- **LINE Login** — ABSOLUTELY CRITICAL for Japan market
- Apple (important for iPhone users)
- Google (important)
- X/Twitter (unexpectedly important in Japan)
- Email + phone

### South Korea

**Dominant social logins:**
1. **KakaoTalk** — Kakao Login is the absolute #1. KakaoTalk is used by 97% of Korean smartphone users (~53M MAU). Kakao Login dominates social login.
2. **Naver** — Naver ID login is #2. Naver is the dominant search engine/portal.
3. **Google** — #3, growing but limited by Korean ecosystem
4. **Apple** — growing, especially after Korean App Store changes
5. **Facebook** — relatively weak
6. **Toss** — emerging as a login/payment method (fintech)

**Email vs Phone:** Phone number is the **primary identifier** for many services. Real-name verification systems (i-PIN, ARS) require phone numbers. Korean services heavily use phone authentication.

**Note:** South Korea has unique regulations requiring real-name verification for some services. Apple Sign-In was mandated by the Korean government for all app stores.

**Passwordless adoption:** High. Kakao already offers biometric login. Passkey adoption growing. SMS OTP is very common.

**Recommended for CookMate:**
- **Kakao Login** — ABSOLUTELY CRITICAL for Korea
- **Naver ID Login** — very important
- Apple (important)
- Google (important)
- Phone number (primary method for many users)
- Email

### Southeast Asia (Indonesia, Thailand, Vietnam, Philippines, Malaysia, Singapore)

**Indonesia:**
- **Google** — #1
- **Facebook** — #2 (still very strong)
- **Instagram** — used as a login option on some platforms
- **Phone number** — Very common. SMS OTP is the default 2FA method. Many users prefer phone over email.

**Thailand:**
- **LINE** — #1 (LINE is massive in Thailand, 54M+ users)
- **Facebook** — #2
- **Google** — #3

**Vietnam:**
- **Google** — #1
- **Facebook** — #2
- **Zalo** — Vietnamese-specific platform. Zalo Login is used by many local services.
- **Phone number** — Very common. SMS OTP is standard.

**Philippines:**
- **Facebook** — #1 (very high Facebook penetration)
- **Google** — #2
- **Phone number** — very common

**Malaysia:**
- **Google** — #1
- **Facebook** — #2
- **Phone number** — common for OTP

**Singapore:**
- **Google** — #1
- **Apple** — strong (high iPhone penetration)
- **Facebook** — still significant
- **SingPass** — government digital ID (not for social login, but for government services)
- **Email preference** — more Western-like

**Recommended for CookMate:**
- Google (must-have across all SE Asia)
- Facebook (very important for Indonesia, Philippines, Thailand)
- **LINE Login** — critical for Thailand
- **Zalo Login** — important for Vietnam
- Phone number + SMS OTP (especially for Indonesia, Vietnam, Philippines)
- Apple (Singapore)

### Latin America (Brazil, Mexico, Argentina, Colombia, etc.)

**Dominant social logins:**
1. **Facebook** — #1 in most Latin American countries (very high Facebook penetration)
2. **Google** — #2
3. **Apple** — growing but lower iPhone share
4. **Twitter/X** — moderate
5. **WhatsApp** — not a direct social login, but phone number verification via WhatsApp is extremely common

**Region-specific:**
- **Mercado Libre / Mercado Pago** — not a login provider but their payment platform is dominant
- **Phone number** — very common as primary identifier. SMS OTP is standard. WhatsApp authentication is growing.

**Email vs Phone:** Phone number is more common than in North America/Europe. Many users have multiple email addresses but one primary phone.

**Passwordless adoption:** Growing. WhatsApp OTP is effectively passwordless for many users. Passkey adoption lower due to lower iPhone/Google ecosystem penetration.

**Recommended for CookMate:**
- Google (must-have)
- Facebook (must-have for Latin America)
- Apple (good to have)
- Phone number + SMS OTP (important)
- Email + password

### Middle East (UAE, Saudi Arabia, Egypt, Israel, etc.)

**Dominant social logins:**
1. **Google** — #1 in most markets
2. **Facebook** — #2
3. **Apple** — growing in UAE, Saudi Arabia
4. **Twitter/X** — notably high usage in Saudi Arabia, UAE
5. **WhatsApp** — phone verification via WhatsApp is common

**Region-specific:**
- **Phone number** — very common as primary ID. SMS OTP is standard.
- **Apple** — high iPhone penetration in UAE (~80%+), Saudi Arabia
- **National ID / Absher (Saudi)** — government digital ID systems exist but not for social login

**Email vs Phone:** Phone number is more common than email in many use cases.

**Recommended for CookMate:**
- Google (must-have)
- Apple (must-have for UAE/GCC)
- Facebook (important)
- Phone number + SMS OTP (important)
- Email + password

### India

**Dominant social logins:**
1. **Google** — #1 (Android dominates ~95% smartphone share)
2. **Facebook** — #2
3. **WhatsApp** — phone number authentication via WhatsApp is very common
4. **Instagram** — growing as a login option
5. **Apple** — very low penetration (<5% smartphone share)
6. **Twitter/X** — moderate

**Region-specific:**
- **Phone number** — THE primary identifier for most services. Aadhaar-linked verification is common. SMS OTP is the default.
- **Email** — secondary, less commonly used as primary ID
- **UPI (BHIM, Google Pay, PhonePe)** — not login providers but payment authentication is commonly linked

**Passwordless adoption:** High in practice. OTP-based authentication is effectively passwordless for most users. Passkey adoption growing.

**Recommended for CookMate:**
- Google (must-have)
- Facebook (very important)
- **Phone number + SMS OTP** (critical — many users won't have an email)
- Apple (low priority — <5% market share)
- Email (optional, secondary)

---

## 3. Email vs Phone Number — Regional Summary

| Region | Primary ID Preference | Notes |
|--------|----------------------|-------|
| North America | Email | Phone = 2FA only |
| Europe (EU) | Email | GDPR makes phone collection risky |
| UK | Email | Phone = 2FA only |
| Japan | Both | Phone tied to LINE, email for services |
| South Korea | Phone | Real-name verification requires phone |
| SE Asia | Phone-heavy | SMS OTP standard |
| Latin America | Phone-heavy | WhatsApp authentication common |
| Middle East | Phone-heavy | SMS OTP standard |
| India | Phone-dominant | Aadhaar/phone primary, email secondary |

**Bottom line for CookMate:** Make phone number + SMS OTP available in all non-Western markets. Make email the primary path in North America/Europe/UK. Support both globally.

---

## 4. Passwordless Login Adoption — 2024-2025 Trends

### Passkeys (FIDO2/WebAuthn)
- **Major platforms supporting:** Apple (iOS 16+, macOS Ventura+), Google (Android 14+, Chrome), Microsoft (Windows 11, Edge)
- **Adoption rate:** ~20-30% of eligible users have tried passkeys (varies by platform and region)
- **Growth trajectory:** Expected to reach 50%+ adoption by 2027
- **Best for:** North America, Europe, UK (high device ecosystem support)
- **Challenges:** Cross-device sync still fragmented; no universal standard across Apple/Google/Microsoft

### Magic Links
- **Adoption:** Common in SaaS and productivity apps (Notion, Slack, Medium)
- **Best for:** Email-heavy markets (North America, Europe)
- **Limitations:** Vanity URL risks, delivery delays, no good for users who don't have email access

### OTP (One-Time Passwords)
- **SMS OTP:** Universal standard. Works on every phone. No app required.
- **Email OTP:** Common fallback when SMS isn't available
- **TOTP apps (Google Authenticator, Authy):** Standard for 2FA, growing for primary auth
- **Best for:** All markets, especially phone-heavy regions (India, SE Asia, Latin America, Middle East)

### WhatsApp OTP / App-based OTP
- **Growing trend:** Especially in Latin America, India, SE Asia
- **Advantage:** Users already have WhatsApp, no SMS costs
- **Limitation:** WhatsApp account required

### Market Sizing
- Passwordless authentication market: ~$4.2B in 2024, projected ~$18.5B by 2033 (CAGR 15.6%)
- 86% of users report being bothered by having to create new accounts
- Social logins can increase registration conversion rates by up to 50%

---

## 5. CookMate Recommended Login Strategy — By Region

### Phase 1: Minimum Viable (Add Now)
| Provider | Regions | Priority |
|----------|---------|----------|
| Google | ALL | ⭐ Critical |
| Apple | Global (especially US, EU, UK, Japan, UAE) | ⭐ Critical |
| Facebook | ALL (especially SE Asia, LatAm, India) | ⭐ Critical |
| Email + Password | ALL | ⭐ Critical |
| Phone + SMS OTP | ALL non-Western markets | ⭐ Critical |

### Phase 2: Region-Specific (Add for Expansion)
| Provider | Region | Priority |
|----------|--------|----------|
| **LINE Login** | Japan, Thailand | 🔴 High |
| **Kakao Login** | South Korea | 🔴 High |
| **Naver Login** | South Korea | 🟡 Medium |
| **VKontakte (VK)** | Russia, CIS | 🟡 Medium |
| **Zalo Login** | Vietnam | 🟡 Medium |
| **X/Twitter Login** | Japan, Saudi Arabia, UAE | 🟡 Medium |

### Phase 3: Nice-to-Have
- LinkedIn — professional markets, B2B context
- Amazon Login — ecommerce integration
- PayPal Login — checkout integration
- Passkeys (FIDO2/WebAuthn) — progressive enhancement
- Magic Links — email-heavy markets
- Apple "Hide My Email" — privacy-conscious users

---

## 6. Current Trends (2024-2025) Summary

1. **Facebook's dominance is declining** — from 68% (2019) to 61% (2024) globally. Apple and Google are the main beneficiaries.

2. **Apple Sign-In is rising fast** — privacy-focused, mandatory for apps using third-party social logins (App Store rule). Critical for iOS-heavy markets.

3. **Passkeys are the future but not yet the present** — ~20-30% adoption. Major platforms support them but cross-platform sync is fragmented.

4. **Phone number is becoming the primary ID in developing markets** — India, SE Asia, Latin America, Middle East. CookMate should support phone-first auth.

5. **Multi-region strategy is essential** — one-size-fits-all authentication doesn't work. Offer different defaults based on user's detected region/IP.

6. **Regulatory pressure is increasing** — GDPR (EU), Korea's real-name requirements, India's Aadhaar linkage. Design auth system for compliance from day one.

7. **Local platforms dominate in key markets** — LINE (Japan, Thailand), Kakao (Korea), VK (Russia), Zalo (Vietnam). Not offering these means losing 50%+ of potential users in those markets.

---

## Sources
- LoginRadius Social Login Trends Report (Q1 2024)
- Marketing Scoop: "The Rise of Social Logins: Which Platforms Do Users Prefer in 2025?" (May 2024)
- Auth0 / Okta identity research
- DataHorizon Research: Social Login Tool Market (2024-2033)
- Various regional market reports on LINE, Kakao, VK usage penetration