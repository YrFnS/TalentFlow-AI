# Task 2-a: Fix Auth Pages i18n — Replace Inline Ternaries with Translation Keys

## Summary

Replaced all inline `locale === 'ar' ? ... : ...` ternaries in login and register auth pages with proper `t.auth.*` i18n translation keys. Added 46 new translation keys to both English and Arabic sections of `translations.ts`.

## Files Modified

1. **`src/lib/translations.ts`** — Added 46 new auth keys to both EN (line 106-156) and AR (line 2036-2086) sections
2. **`src/app/auth/login/content.tsx`** — Replaced 17 inline ternaries with `t.auth.*` keys
3. **`src/app/auth/register/content.tsx`** — Replaced 23 inline ternaries with `t.auth.*` keys

## New i18n Keys Added

### Validation
- `emailRequired`, `invalidEmail`, `passwordRequired`, `passwordMinLength`
- `nameRequired`, `nameTooShort`, `passwordsNoMatch`, `companyNameRequired`

### Toast Messages
- `signInSuccess`, `invalidCredentials`, `signInError`
- `accountCreated`, `registrationFailed`, `registrationError`

### Login Landing Page
- `hireSmarter`, `withAI`, `landingDesc`
- `featureAIScreening`, `featureAIScreeningDesc`
- `featureSmartPipeline`, `featureSmartPipelineDesc`
- `featureAIMatching`, `featureAIMatchingDesc`

### Placeholders & Hints
- `enterEmail`, `enterPassword`, `passwordRequirement`
- `enterCompanyName`, `enterFullName`

### Role Descriptions
- `candidateDesc`, `companyDesc`, `adminDesc`

### Register Landing Page
- `startYour`, `journeyToday`, `registerLandingDesc`
- `statCandidates`, `statCompanies`, `statJobs`

### Password
- `passwordsMatch`
- `strengthWeak`, `strengthFair`, `strengthGood`, `strengthStrong`, `strengthExcellent`

## Additional Changes

- Updated `PasswordStrength` component to accept `t` prop with `Record<string, string>` type for localized strength labels
- Removed unused `isAr` variable from register validate function
- Replaced hardcoded English strings like "or continue with email" / "or sign up with email" with existing `t.auth.orContinueWithEmail` / `t.auth.orSignUpWithEmail` keys

## Lint Result

✅ `bun run lint` — Clean with zero errors
