

## Plan: Auto-redirect from editor to working login page

### Problem
When you open the Auth page inside the Lovable editor preview, login fails because the editor domain (`lovableproject.com`) is blocked by backend security rules. The current page shows a warning banner with manual links, but this is confusing and requires extra clicks.

### Solution
Replace the warning banner with an **automatic redirect**. When the Auth page detects it is running on the editor domain, it will immediately send you to the working preview URL where login works -- no manual steps needed.

### Changes

**1. `src/pages/Auth.tsx`**
- When `isEditorOrigin` is true, instead of rendering the warning Alert banner, immediately redirect to `https://id-preview--97c25c50-7c76-4f40-9037-3acf3afdfbd3.lovable.app/auth` using `window.location.href`
- Show a brief "Redirecting to login..." message with a spinner while the redirect happens
- Remove the `AuthDiagnostics` import and component from the page

**2. `src/components/AuthDiagnostics.tsx`**
- Delete this file (no longer needed)

### How it will work
1. You open `/auth` in the editor preview
2. The page instantly detects the editor domain
3. It redirects your browser to the preview URL that supports login
4. You see the login form and can sign in normally

### Technical details
- The redirect uses `useEffect` with `window.location.href` so it fires immediately on mount
- A simple centered "Redirecting to login..." card is shown during the brief redirect
- The login/signup form only renders when NOT on the editor domain (i.e., on the preview or published URL where auth works)
- No other files are affected

