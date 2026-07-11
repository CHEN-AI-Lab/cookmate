# CookMate Competitor Feature Research

**Date:** 2026-07-11
**Platforms Studied:** Mealime, EatThisMuch, Paprika, Plan to Eat, Prepear, Yummly
**Goal:** Identify features CookMate is missing compared to established meal-planning SaaS platforms.

---

## 1. CookMate Current Feature Inventory

From the CookMate codebase audit (2026-05), CookMate currently has:

| Category | Features Present |
|----------|-----------------|
| **Recipe** | AI recipe generation, AI recipe generation from pantry ingredients |
| **Meal Planning** | Weekly grid (7 days × 3 meals), AI weekly plan generation (generateWeeklyPlan), diet preferences & cuisine preferences as AI prompt params |
| **Grocery/Shopping** | Grocery list with automatic categorization (10 categories), pantry management, ingredient dedup checking (inPantry), manual grocery list add |
| **User** | User settings page, demo mode, registration/login (NextAuth v5), billing page |
| **Payment** | Stripe, Alipay, Creem (WeChat Pay via PayJS) |
| **Content** | Blog list page, About page |
| **i18n** | Full bilingual (zh-CN + en), ingredient name mapping |
| **Other** | Usage limits (checkUsageLimit), risk control on ingredients (NON_FOOD, TOXIC, etc.) |

### Known Missing (from 2026-05 audit)

- ❌ Blog article individual pages (blog/[slug] → 404)
- ❌ Nutritional tracking (stub created, no implementation)
- ❌ Photo recognition of ingredients (stub created)
- ❌ Community recipe sharing (stub created)
- ❌ Recipe scaling
- ❌ Recipe search/filtering
- ❌ Privacy policy, Terms of service pages
- ❌ FAQ page
- ❌ Contact/Support page

---

## 2. Competitor Feature Matrix

### 2a. User-Related Features (Profiles, Sharing, Social)

| Feature | Mealime | EatThisMuch | Paprika | Plan to Eat | Prepear | Yummly |
|---------|---------|-------------|---------|-------------|---------|--------|
| User profiles / avatars | ✅ | ✅ | ❌ (offline-first) | ✅ | ✅ | ✅ |
| Multi-user / family accounts | ❌ (single) | ❌ (single) | ❌ (single) | ✅ (family plan) | ✅ (meal plans for family) | ❌ |
| Social sharing (recipes) | ✅ (share links) | ✅ | ✅ (export) | ✅ | ✅ | ✅ (core feature) |
| Community recipe discovery | ❌ | ❌ | ❌ | ❌ | ✅ (network) | ✅ (core feature) |
| Recipe ratings / reviews | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| User cookbooks / collections | ❌ | ✅ (collections) | ✅ (categories) | ✅ (cookbooks) | ✅ (cookbooks) | ✅ (collections) |
| Recipe notes / personal annotations | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Public profile / recipe sharing | ❌ | ❌ | ❌ | ❌ | ✅ (creator network) | ✅ |
| Affiliate/creator monetization | ❌ | ✅ (affiliate) | ❌ | ❌ | ✅ (Gold affiliate) | ❌ |

### 2b. Recipe Features (Search, Filtering, Scaling, Nutrition)

| Feature | Mealime | EatThisMuch | Paprika | Plan to Eat | Prepear | Yummly |
|---------|---------|-------------|---------|-------------|---------|--------|
| Recipe search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (core) |
| Dietary filters (keto, vegan, etc.) | ✅ (9 menus) | ✅ (6+ diets) | ❌ (manual) | ✅ | ✅ | ✅ |
| Allergy/intolerance filters | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Ingredient exclusion filters | ✅ | ✅ (quick filters) | ❌ | ✅ | ❌ | ✅ |
| Cuisine filters | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cook time filters | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Recipe scaling (servings adjustment) | ✅ | ✅ | ✅ (scale up/down) | ✅ | ❌ | ✅ |
| Nutrition info per recipe | ✅ | ✅ (calorie + macros) | ❌ | ❌ | ✅ (ingredient info) | ✅ |
| Full macro tracking (protein, fat, carbs) | ✅ | ✅ (core metric) | ❌ | ❌ | ❌ | ✅ |
| Calorie calculator / TDEE | ❌ | ✅ (calorie calc + TDEE) | ❌ | ❌ | ❌ | ❌ |
| Recipe importing from web URLs | ❌ | ❌ | ✅ (core feature) | ✅ | ✅ | ❌ |
| Manual recipe entry | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Recipe photos / image support | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recipe categorization / tags | ❌ | ✅ (collections) | ✅ | ✅ | ✅ | ✅ |
| Recipe meal-time tagging (breakfast/lunch/dinner) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

### 2c. Meal Planning Features

| Feature | Mealime | EatThisMuch | Paprika | Plan to Eat | Prepear | Yummly |
|---------|---------|-------------|---------|-------------|---------|--------|
| Weekly meal plan grid | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Monthly meal plan view | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Auto-generated meal plans | ✅ (personalized) | ✅ (core value prop) | ❌ | ❌ | ❌ | ❌ |
| Custom meal plan creation | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Meal plan templates | ✅ (menu types) | ✅ (diet-based) | ❌ | ❌ | ❌ | ❌ |
| Drag-and-drop meal planning | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Recurring meals / leftovers | ❌ | ✅ (recurring foods) | ❌ | ✅ | ❌ | ❌ |
| Meal plan notes | ❌ | ❌ | ❌ | ✅ | ✅ (add a note) | ❌ |
| Random meal generation | ❌ | ✅ (endless regen) | ❌ | ❌ | ❌ | ❌ |
| Planned vs. actual meals tracking | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Leftover / meal reuse suggestions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Date-specific meal scheduling | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Print / export meal plan | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### 2d. Grocery / Shopping Features

| Feature | Mealime | EatThisMuch | Paprika | Plan to Eat | Prepear | Yummly |
|---------|---------|-------------|---------|-------------|---------|--------|
| Auto-generated grocery list from plan | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Aisle/department sorting | ✅ | ❌ | ✅ (aisle) | ✅ | ❌ | ❌ |
| Ingredient consolidation (similar items) | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Manual grocery list editing | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pantry / on-hand inventory | ✅ | ✅ (pantry) | ✅ (pantry) | ❌ | ❌ | ❌ |
| Grocery list sharing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Walmart / Instacart / delivery ordering | ❌ | ❌ | ❌ | ❌ | ✅ (Walmart) | ❌ |
| Price estimation | ✅ | ✅ (cost-saving) | ❌ | ❌ | ❌ | ❌ |
| Staple items / recurring purchases | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Grocery list check-off | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Store-specific list organization | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2e. Admin / Management Features

| Feature | Mealime | EatThisMuch | Paprika | Plan to Eat | Prepear | Yummly |
|---------|---------|-------------|---------|-------------|---------|--------|
| Cloud sync across devices | ✅ | ✅ | ✅ (iCloud) | ✅ | ✅ | ✅ |
| Offline mode | ❌ | ❌ | ✅ (local-first) | ❌ | ❌ | ✅ |
| Cross-platform (iOS/Android/Web) | ✅ | ✅ | ✅ (all 4) | ✅ (web) | ✅ | ✅ |
| User data export | ❌ | ❌ | ✅ (recipe export) | ❌ | ❌ | ❌ |
| Data backup / restore | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Privacy policy page | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Terms of service page | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| FAQ / Help center | ✅ (support) | ❌ | ✅ (support) | ✅ (help) | ✅ (help) | ✅ |
| Contact / Support form | ✅ (contact) | ❌ | ✅ (support) | ✅ | ✅ (contact) | ✅ |
| Gift codes / subscriptions | ❌ | ✅ (gift codes) | ❌ | ❌ | ❌ | ❌ |
| Professional / client management | ❌ | ✅ (pro tier) | ❌ | ❌ | ❌ | ❌ |
| Partner API | ❌ | ✅ (partner API) | ❌ | ❌ | ❌ | ❌ |

### 2f. Content / SEO Features

| Feature | Mealime | EatThisMuch | Paprika | Plan to Eat | Prepear | Yummly |
|---------|---------|-------------|---------|-------------|---------|--------|
| Blog / recipe articles | ✅ (blog) | ✅ (blog) | ✅ (news) | ❌ | ❌ | ✅ |
| Recipe SEO (individual recipe pages) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (core) |
| Landing page / marketing site | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recipe guides / how-tos | ✅ (guides) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Press kit | ✅ | ✅ (press) | ❌ | ❌ | ❌ | ✅ |
| Browse foods / ingredient glossary | ❌ | ✅ (browse foods) | ❌ | ❌ | ❌ | ✅ |
| Calculators (calorie, TDEE) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Medical disclaimer | ✅ | ✅ | ❌ | ❌ | ✅ (medical) | ❌ |
| Do Not Sell My Info (CCPA) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DMCA policy | ❌ | ✅ (DMCA) | ❌ | ❌ | ❌ | ❌ |

---

## 3. Features CookMate Should Prioritize (Gap Analysis)

### 🔴 Critical Gaps (Launch-Blocking)

| # | Feature | Priority | Rationale |
|---|---------|----------|-----------|
| 1 | **Privacy policy page** | Critical | Legal requirement for any SaaS collecting user data. All competitors have one. |
| 2 | **Terms of service page** | Critical | Legal requirement. All competitors have one. |
| 3 | **Blog article individual pages** (blog/[slug]) | Critical | Blog list exists but all articles return 404. Renders blog useless. |
| 4 | **Recipe scaling** (servings adjustment) | Critical | Every meal-planning platform allows users to scale recipes by serving size. |

### 🟡 High Priority (Strong UX / Retention)

| # | Feature | Priority | Rationale |
|---|---------|----------|-----------|
| 5 | **Recipe search & filtering** | High | Users need to find recipes by name, ingredient, cuisine. Basic discoverability. |
| 6 | **Nutrition info display** (per recipe) | High | EatThisMuch and Mealime both show calories + macros per recipe. Users want to know what they're eating. |
| 7 | **Dietary filter UI** (keto, vegan, vegetarian, etc.) | High | Currently only passed as AI prompt params. A visible filter UI would improve onboarding. |
| 8 | **FAQ / Help page** | High | Reduces support burden. All competitors have a help/support section. |
| 9 | **Contact / Support page or form** | High | Users need a way to report issues. |
| 10 | **Meal plan templates** (classic, low-carb, etc.) | High | Mealime uses this as a core differentiator. Reduces user effort. |

### 🟢 Medium Priority (Growth / Engagement)

| # | Feature | Priority | Rationale |
|---|---------|----------|-----------|
| 11 | **Recipe collections / cookbooks** | Medium | Paprika, Plan to Eat, Prepear all offer user-organized recipe collections. |
| 12 | **Recipe importing from web URLs** | Medium | Paprika and Plan to Eat's #1 feature. Drives acquisition of users with existing recipe collections. |
| 13 | **Community recipe sharing** | Medium | Prepear's creator network drives engagement. Stub already exists. |
| 14 | **Social sharing** (share recipes to social media) | Medium | Free distribution channel. |
| 15 | **Grocery list sharing** | Medium | Mealime supports this. Enables family collaboration. |
| 16 | **Recipe notes / personal annotations** | Medium | Prepear and Plan to Eat both support adding notes to recipes/plans. |
| 17 | **Nutritional tracking (daily/weekly stats)** | Medium | Stub exists. EatThisMuch's core value prop is hitting calorie/macro targets. |

### 🔵 Lower Priority (Nice-to-Have)

| # | Feature | Priority | Rationale |
|---|---------|----------|-----------|
| 18 | **Grocery delivery integration** (Walmart, Instacart) | Low | Prepear offers Walmart integration. High implementation effort. |
| 19 | **Offline mode** | Low | Only Paprika does this well (local-first architecture). |
| 20 | **Multi-user / family accounts** | Low | Prepear and Plan to Eat offer this but it's complex to implement. |
| 21 | **Photo recognition of ingredients** | Low | Stub exists. High ML implementation cost for limited benefit. |
| 22 | **API for partners** | Low | EatThisMuch offers this. Not needed at current scale. |
| 23 | **User data export** | Low | Only Paprika offers this. GDPR compliance nice-to-have. |
| 24 | **Gift codes / subscriptions** | Low | EatThisMuch offers this. Low effort to implement though. |

---

## 4. Platform-Specific Notes

### Mealime (mealime.com)
- **Source:** mealime.com homepage + recipes page
- **Model:** Free app with personalized meal plans, 200+ customization options
- **Key differentiator:** Personalization (200+ options), 30-min recipes, grocery list auto-sorted, meal plan builder
- **Pricing:** Free (ad-supported + in-app purchases)
- **Plans offered:** Classic, Low Carb, Keto, Flexitarian, Paleo, Vegetarian, Pescatarian, Vegan
- **Notable:** Does NOT offer recipe importing, manual recipe entry, or community features

### EatThisMuch (eatthismuch.com)
- **Source:** eatthismuch.com homepage + pricing page
- **Model:** Auto-generated meal plans based on calorie targets and diet preferences
- **Key differentiator:** Calorie/nutrition-focused, \"autopilot\" meal planning, endless regeneration
- **Pricing:** Free → Premium ($) → Professional ($$)
- **Free features:** Basic meal plans, limited preferences
- **Premium features:** Unlimited regeneration, ingredient filters, recurring foods, pantry, cost-saving
- **Professional:** Client management
- **Notable:** Calorie calculator + TDEE calculator on site; Partner API available

### Paprika (paprikaapp.com)
- **Source:** paprikaapp.com homepage
- **Model:** One-time purchase recipe manager (not subscription)
- **Key differentiator:** Web recipe importing, cloud sync, offline-first, interactive timers in recipes
- **Pricing:** Paid per platform (iOS/Mac/Android/Windows sold separately)
- **Key features:** Cloud sync, web importing, smart grocery lists (aisle-sorted, consolidated), interactive recipes (timers detected in directions), monthly meal planning, pantry tracking
- **Notable:** No subscription model; no dietary filtering; no AI; no social features; no nutrition tracking

### Plan to Eat (plantoeat.com)
- **Source:** Site behind Cloudflare challenge; supplemented by general knowledge
- **Model:** Subscription-based meal planning
- **Key differentiator:** Recipe importing, meal plan calendar, grocery list
- **Notable:** Cloudflare-blocked; family plan available

### Prepear (prepear.com)
- **Source:** prepear.com homepage + transaction email page
- **Model:** Freemium with "Prepear Gold" premium tier
- **Key differentiator:** Connected cooking app — recipe saving, meal planning, Walmart grocery integration, creator/affiliate network
- **Free features:** Save recipes, organize cookbooks, discover recipes, meal planning, grocery list
- **Gold features (from pricing data — $79.99/yr):** Advanced features + creator monetization
- **Key features:** Web recipe collection, manual recipe entry, custom meal plans with notes, grocery list with Walmart ordering, ingredient info
- **Notable:** Creator/affiliate monetization (recipe interaction commissions); privacy policy + terms of use + terms of sale + medical disclaimer all present

### Yummly (yummly.com, acquired by KitchenAid → kitchenaid.com/recipes)
- **Source:** Historical knowledge (site now redirects to KitchenAid)
- **Model:** Free recipe discovery platform (originally); now integrated into KitchenAid
- **Key differentiator:** Recipe search by taste preferences, dietary restrictions, cuisine; personalized recommendations
- **Former features:** Recipe search with extensive filtering (diet, allergy, cuisine, cook time, nutrition), personalized recommendation engine, recipe collections, meal planning (added later),
- **Notable:** Acquired by Whirlpool/KitchenAid; no standalone meal-planning SaaS anymore; no grocery lists; no shopping integration

---

## 5. Summary: Cheapest "Missing" Features to Ship

These are features that all or most competitors have, which CookMate lacks, and which require minimal code changes:

| Task | Effort | Impact |
|------|--------|--------|
| Blog individual pages (blog/[slug]) | 🟢 Low | 1 page, template from existing data | 
| Privacy policy page | 🟢 Low | Static page, template from competitors |
| Terms of service page | 🟢 Low | Static page, template from competitors |
| FAQ page | 🟢 Low | Static or CMS-driven FAQ |
| Contact / Support page/form | 🟢 Low | Form + email integration |
| Recipe scaling UI | 🟢 Low | Math on servings adjustment |
| Nutrition info display (per recipe) | 🟡 Medium | Need nutrition data source |
| Recipe search/filtering | 🟡 Medium | Search bar + filter chips |
| Social sharing links | 🟢 Low | Share URLs/Links |

---

## 6. Sources

| Platform | URL(s) Visited | Accessible? |
|----------|---------------|-------------|
| Mealime | https://www.mealime.com, /recipes | ✅ Yes |
| EatThisMuch | https://www.eatthismuch.com, /pricing | ✅ Yes |
| Paprika | https://www.paprikaapp.com | ✅ Yes (no subpages) |
| Plan to Eat | https://www.plantoeat.com | ❌ Cloudflare blocked |
| Prepear | https://www.prepear.com | ✅ Yes (partial) |
| Yummly | https://www.yummly.com | ❌ Redirects to KitchenAid |
| CookMate audits | skill: cookmate-project → references/feature-audit-2026-05.md and marketing-audit-2026-05.md | ✅ Yes |

**Note:** Plan to Eat and Yummly were blocked by Cloudflare/redirects. Feature data for those platforms was supplemented by general domain knowledge of well-known meal planning SaaS applications.