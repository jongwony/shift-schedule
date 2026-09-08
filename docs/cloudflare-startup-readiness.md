# Cloudflare startup readiness — 2026-09-08

## Assessment

Shift Schedule is an existing technology-product beta, not an application-ready certification. This change makes the product inspectable and its commercial status accurate. Acceptance remains Cloudflare's decision. No application has been submitted, no production migration has occurred, and no traction or revenue is claimed.

Official source checked: https://www.cloudflare.com/startups/

The page lists a bootstrapped/self-funded Tier 3 ($10,000 credits, under $1M raised). It also lists a general “funded within the last 12 months” qualification. Do not silently interpret that inconsistency: describe actual funding status and ask the program how it applies to a self-funded business. Tier 2/1 require affiliated-partner funding; adding product features does not satisfy those funding criteria.

## Evidence and remaining gates

| Official qualification | Repository evidence | Remaining action |
| --- | --- | --- |
| Actively developing a technology product | React editor, constraint checks, solver API integration, tests, new interactive `/demo` | Verify production automatic generation using an authorized account |
| Publicly accessible website | Existing custom domain; new `/about`, `/demo`, pricing and contact links | Merge/deploy and verify public routes before listing new URLs as live |
| Public social presence | https://github.com/jongwony/shift-schedule | Keep product README and actual release evidence public |
| For-profit business, domain-matching business email | Business config identifies 루트프로토 and `choi@rootproto.com`; https://rootproto.com is publicly accessible and matches the email domain; the product has a different hostname | Use the real company website and business email in company fields and the product URL in product/demo fields. Verify mailbox access and the company/product relationship. A different product hostname alone does not establish ineligibility |
| Incorporated within 10 years | Business identity in configuration, not verified formation evidence | Founder supplies registration date and confirms how sole-proprietor registration meets “incorporated” wording |
| Funding stage/recency | Not evidenced in this repository | Founder supplies actual funding facts; clarify bootstrapped applicability |
| No prior program approval | Unknown | Verify at the business level, including applications through other products |

Program terms additionally require an account and valid payment method and exclude existing enterprise customers. Verify these privately in the account. Current source lists service agencies/consultancies as excluded: explain the separately offered software product honestly; do not reclassify mentoring services as SaaS revenue.

## Concrete changes

- `/about`: problem, intended users, workflow, free/pending paid capabilities, operator and contact, public development evidence.
- `/demo`: fictional 8-person/28-day roster, real local constraint evaluation, editable shifts, reproducible N→D conflict, reset. It does not represent an optimized schedule or customer data.
- Pricing and limit dialog: paid checkout visibly unavailable while implementation is pending; existing free generation remains intact.
- `wrangler.jsonc`: opt-in Workers Static Assets target with SPA routing. Existing GitHub Pages production pipeline remains the current deployment route.

## Application draft — factual product section

Shift Schedule is a web-based shift-planning product developed by Rootproto for teams operating day, evening and night shifts. Managers configure staffing and rest requirements, edit a 28-day roster and inspect required-rule violations separately from preference warnings. Authenticated users can request optimization through an existing backend integration. The public demo evaluates synthetic schedules in the browser and lets reviewers reproduce a scheduling conflict without login. Our current monetization design combines free usage with a planned day pass; paid checkout is not yet available. Customer adoption, revenue and measured time savings are not asserted at this stage.

Cloudflare plan: begin with delivery of the React application using Workers Static Assets. Keep the existing AWS optimization service until a separately benchmarked migration is justified. Evaluate an authenticated Worker API boundary and abuse controls as usage grows. Shared team storage in D1 would be a later feature requiring tenant isolation, authorization and retention design, not a capability we currently claim to ship. Credit use should follow measured demand; we do not need to exhaust the award or add AI to qualify.

Founder must supply before submission: business formation date/type, funding amount/date/source, prior-program history, verified website/email pair, Cloudflare account status, and any real customer evidence.

## Validation milestones (targets, not achieved traction)

1. Recruit three volunteer shift managers through founder-led outreach. No outreach has been sent by this change.
2. Each manager completes one anonymized 28-day planning session; record completion time, unresolved required violations and manual edits after generation, with consent.
3. Compare with the same manager's prior workflow; report sample size and median, not unsupported percentage savings.
4. Record repeat usage in a second planning period and willingness to pay the proposed day-pass price.
5. Use measured request volume, solve latency/failure rate and storage needs to estimate Cloudflare usage. Static hosting alone does not establish a need for $10k spend.

These milestones strengthen the application narrative; they are not presented as published selection rules.

## Engineering verification for this change

Final Luna verification after the second review pass:

- `npm test -- --reporter=verbose`: 69 tests passed.
- `npm run lint`: passed; both pre-existing lint findings were resolved.
- `npm run build`: passed, including TypeScript checks.
- `npx wrangler@4.129.1 deploy --dry-run`: passed.
- `git diff --check`: passed.
- Demo tests cover actual rule recalculation, reset, no API requests and preservation of persisted rosters. An entrypoint test covers `/demo/` and verifies that stored-token/authentication functions are not called.
- No account deployment, browser QA, authenticated production-backend test or customer validation was performed.

## Independent evaluation and convergence rule

This is an evidence gate, not an invented acceptance score. Published eligibility and our engineering readiness checks are separate. Iteration ends when no concrete product/code gap remains within the authorized scope; unresolved founder/account facts stay explicitly unverified rather than being converted to a pass.

### Pass 1 — initial implementation reviewed

- Product visibility: `/about` explains the customer, workflow and status; `/demo` exposes real evaluation without requiring an account. Local implementation is evidenced; new routes are not yet production evidence.
- Commercial accuracy: unavailable checkout is labelled as pending. Do not claim paying customers or sales.
- Platform relevance: a validated static-assets deployment configuration and staged architecture plan exist. This is preparation, not actual Cloudflare usage.
- Reviewer access: public GitHub development evidence exists. A company homepage at https://rootproto.com was fetched successfully on 2026-09-08. That page is company/founder oriented and does not yet list Shift Schedule. The product page should identify its operator and link to the company.
- Corrected assessment: company website rootproto.com matches the configured business email domain. Our earlier suggestion that the product hostname must change was too strong; the official page does not explicitly demand that every product share the business mailbox hostname. Mailbox ownership/deliverability and the applicant/product relationship remain to be verified.
- Production homepage reachability: a read-only HTTPS HEAD request to https://shift-schedule.connects.im returned HTTP 200 with GitHub Pages headers on 2026-09-08. The web-fetch tool could not open it; the direct HTTP check establishes response availability only, not browser execution or backend functionality. Do not call the new demo publicly verified until the PR is deployed and checked.

### Non-code facts needed for final eligibility

Founder confirmation is still needed for registration date and business form, applicable funding facts, first-time participation, usable business mailbox and account eligibility. The official no-minimum-funding Tier 3 wording supports a self-funded application route, but the general funding-recency wording should not be silently resolved into an invented fact. There is no published guarantee that a demo, an AI feature, or a particular test count earns admission.

### Pass 2 — Luna fixes and independent re-evaluation

| Review finding | Correction | Final engineering assessment |
| --- | --- | --- |
| Global authentication initialization could run on public demo pages | Public routes mount without AuthProvider; entrypoint regression checks zero auth-session calls | Resolved in code and test |
| Trailing-slash public URLs could render the editor instead | Shared route normalization for routing and provider selection | Resolved; `/demo/` covered by entrypoint test |
| Terms still implied a paid product was already offered | Pending-release notice and planned-product labels aligned with pricing | Current commercial status explicit |
| Company/product relationship was not linked from the new introduction | Added Rootproto company website link next to operator information | Product-to-company relationship visible after deployment |
| Existing lint failures weakened repeatable engineering checks | Separated auth context/hook/provider and fixed response const declaration | Full lint now passes |

Independent review found no additional concrete code/product defect in this bounded readiness change after those corrections. This is convergence of the implemented product-evidence work, **not** a claim that every Cloudflare eligibility fact is verified or that acceptance is guaranteed. The final code is reviewable in a PR; new public-route evidence still requires merge/deployment. The remaining eligibility items above require truthful founder/account facts, not more speculative features.
