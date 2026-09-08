# Optional Cloudflare frontend deployment

Current production: GitHub Pages frontend, AWS solver and authentication APIs. This change prepares an alternative deployment target; it does not move DNS, create paid resources, or transfer the Python OR-Tools solver.

Reference: https://developers.cloudflare.com/workers/static-assets/

## Build and validate

```bash
npm ci
npm test
npm run build
npx wrangler@4.129.1 deploy --dry-run
```

For a real build, supply the existing `VITE_GOOGLE_CLIENT_ID` configuration through the build environment. Vite values are compiled into the public bundle: never put secrets into a `VITE_*` variable. `.env.production` supplies the existing API URLs.

`wrangler.jsonc` serves `dist` and falls back to the SPA entrypoint for `/about`, `/demo`, `/pricing`, `/terms` and `/privacy`. `public/404.html` and `public/CNAME` remain for GitHub Pages compatibility. A static-assets-only deployment requires no Worker script and does not run the solver.

## Cutover gate

Before deployment to an owned Cloudflare account, verify the account/target and applicable plan. Build with the intended OAuth client configuration. Once authorized to deploy, run `npx wrangler@4.129.1 deploy` with account credentials supplied outside Git. Never commit credentials.

Before custom-domain cutover:

- Verify all public routes on the new origin and confirm unknown asset paths do not mask broken bundles.
- Add the intended origin to the Google OAuth configuration and both AWS API CORS allowlists; test login, token refresh, free-count handling, feasibility and generation with a test account.
- Confirm copy/import and persisted schedules. Browser storage is origin-scoped: moving to a different hostname will not carry existing local rosters or login tokens. Provide a tested export/import migration before asking existing users to move.
- Use the verified company website/email pair for company fields and identify the separate product URL. The company site rootproto.com matches the configured business email domain; verify mailbox access and the company/product relationship instead of assuming a product-domain migration is mandatory.
- Update the business hosting description and review relevant provider disclosures after actual cutover.
- Preserve the previous deployment and DNS values for rollback. Switch custom-domain routing only after acceptance checks pass.

No automatic Cloudflare deployment workflow is introduced. Merging this branch uses the existing GitHub Pages workflow; Cloudflare cutover is a separate operation.
