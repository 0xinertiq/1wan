# Kumo High Court — Design Implementation Kit v1

**Status:** Design direction approved; implementation NOT started. Based on the supplied read-only audit dated 27 October 2026. This package does not assert that current code or live infrastructure has been tested.

## When to use
**Do not apply the redesign while finishing functionality.** Finish functional work first, export a backup, run tests and browser smoke checks, create a Git checkpoint and a new redesign branch. Then place this folder at `docs/kumo-redesign/` in the repository and give Claude `05_CLAUDE_CODE_MASTER_PROMPT.md`.

## Package map
- `01_DESIGN_BIBLE.md`: visual language, exact candidate tokens, responsive rules, accessibility and screen specifications.
- `02_SCREEN_AND_INTERACTION_SPECS.md`: per-module layout, ordering, no-duplication rules, onboarding and personalisation.
- `03_ASSET_BIBLE.md`: art direction, asset inventory, dimensions, layering and production checks.
- `04_TECHNICAL_GUARDRAILS.md`: audit-grounded integration, security, migration and regression rules.
- `05_CLAUDE_CODE_MASTER_PROMPT.md`: one consolidated prompt for Claude Code, phased and approval-gated.
- `tokens/kumo-tokens.css`: proposed scoped CSS tokens (do not apply blindly).
- `assets/asset-manifest.json`: artwork requirements and statuses.
- `references/final-approved-styleboard.png`: approved concept reference; not a production sprite sheet.

## Existing implementation facts (audit)
Next.js 15.5.28 App Router, React 19.1, TypeScript 5.8, Supabase, plain CSS (`dashboard.css` ~75KB), custom `PixelSprite` and `spriteDefs`, iCal server environment variables, one large `user_state` JSON record, and partial in-app alerts. No confirmed browser, live database or RLS validation. Preserve all working behavior.

## Approval boundaries
Design language and module concepts are approved. Specific HEX tokens, pixel dimensions, file naming, and code architecture here are implementation proposals that must be visually validated against the approved reference and existing site. Mockup labels and numbers are not ground truth. Do not use screenshots as functional UI or assume illustrations have transparent layers.

## What the user does now
Continue existing components. When ready, complete the preflight in `04_TECHNICAL_GUARDRAILS.md`; hand Claude the master prompt. No Google OAuth is needed for the current owner setup.
