<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into ZhongLens, a WXT browser extension built with React and React Router v7 (declarative/hash router mode).

## Summary of changes

- **`entrypoints/popup/main.jsx`**: Initialized PostHog with `posthog.init()` using environment variables, wrapped the app with `PostHogProvider` and `PostHogErrorBoundary` for automatic error tracking.
- **`entrypoints/popup/App.jsx`**: Added `usePostHog` hook; captures `ocr_overlay_toggled`, `crop_mode_toggled`, `cloud_ocr_toggled`, `crop_region_selection_opened`, and `onboarding_opened` events in their respective click handlers.
- **`components/login-form.jsx`**: Added `usePostHog`; on successful login calls `posthog.identify(email)` and captures `user_signed_in`.
- **`components/signup-form.jsx`**: Added `usePostHog`; on successful signup calls `posthog.identify(email)` and captures `user_signed_up` with an `email_confirmation_required` property.
- **`entrypoints/popup/Profile.jsx`**: Added `usePostHog`; captures `email_updated`, `password_updated`, `user_signed_out` (with `posthog.reset()` to clear identity), and `customer_portal_opened`.
- **`entrypoints/popup/Upgrade.jsx`**: Added `usePostHog`; captures `billing_type_changed` when toggling monthly/lifetime, and `checkout_initiated` with a `billing_type` property when Stripe checkout opens.
- **`entrypoints/popup/ForgotPassword.jsx`**: Added `usePostHog`; captures `password_reset_requested` on successful reset email send.
- **`.env`**: Added `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` environment variables.

## Events tracked

| Event | Description | File |
|---|---|---|
| `ocr_overlay_toggled` | User toggles the OCR (Capture Tab) overlay open or closed | `entrypoints/popup/App.jsx` |
| `crop_mode_toggled` | User toggles crop mode on or off | `entrypoints/popup/App.jsx` |
| `cloud_ocr_toggled` | User toggles Cloud OCR on or off | `entrypoints/popup/App.jsx` |
| `crop_region_selection_opened` | User opens the crop region selector overlay | `entrypoints/popup/App.jsx` |
| `onboarding_opened` | User clicks to open the onboarding tab | `entrypoints/popup/App.jsx` |
| `user_signed_in` | User successfully signs in with email and password | `components/login-form.jsx` |
| `user_signed_up` | User successfully creates an account | `components/signup-form.jsx` |
| `user_signed_out` | User signs out of their account | `entrypoints/popup/Profile.jsx` |
| `password_reset_requested` | User submits a password reset email request | `entrypoints/popup/ForgotPassword.jsx` |
| `email_updated` | User successfully updates their email address | `entrypoints/popup/Profile.jsx` |
| `password_updated` | User successfully updates their password | `entrypoints/popup/Profile.jsx` |
| `checkout_initiated` | User initiates the Stripe checkout flow to become a Supporter | `entrypoints/popup/Upgrade.jsx` |
| `billing_type_changed` | User switches between monthly and lifetime billing options | `entrypoints/popup/Upgrade.jsx` |
| `customer_portal_opened` | Subscribed user opens the Stripe customer portal | `entrypoints/popup/Profile.jsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/677490)
- [Sign-up to Checkout Conversion Funnel](/insights/p9dPZAwM)
- [New Signups & Logins Over Time](/insights/UtuKBu0x)
- [Checkout Initiations by Billing Type](/insights/OfAWhR6U)
- [Core Feature Usage](/insights/iaqOsW64)
- [Churn Signals](/insights/kkcYiQeO)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
