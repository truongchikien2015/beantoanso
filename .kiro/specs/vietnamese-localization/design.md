# Design Document

## Overview

This design centralizes Vietnamese localization of **error messages and shared user-facing strings** in the "Bé An Toàn Số" app. Today, error translation is scattered: `AuthModal.tsx` has a private `translateAuthError` helper, API routes return a mix of raw English (`"Not found"`, `"Forbidden"`, `"Invalid JSON"`, `"Missing required fields"`) and Vietnamese strings, and many components surface raw `error.message` (e.g. `alert("Lỗi: " + error.message)` in `TopicManager.tsx`) which can leak English from Supabase.

The design introduces two cooperating modules in `src/lib/` (where business logic belongs per the project conventions):

1. **`Message_Catalog`** (`src/lib/i18n/messages.ts`) — a single, typed dictionary of Vietnamese strings keyed by stable identifiers, plus a `getMessage(key)` accessor that returns a Vietnamese fallback for unknown keys.
2. **`Error_Translation_Service`** (`src/lib/i18n/translateError.ts`) — a pure function `translateError(input)` that accepts an error from any recognized source (raw string, `Error`, Supabase error object, parsed API JSON payload, or a `fetch` rejection) and returns a Vietnamese string, using the catalog and a normalized matching strategy, falling back to a generic Vietnamese message when no mapping exists.

A thin client helper, **`fetchJson`** (`src/lib/i18n/fetchJson.ts`), wraps `fetch` so that API error responses and network failures are funneled through `translateError` consistently, eliminating per-component ad-hoc handling.

The approach is deliberately pragmatic: it is **opt-in at the consumption points** (components and the fetch helper) rather than a full app-wide i18n framework rewrite. Static JSX labels that are already Vietnamese are left as-is; the catalog focuses on *shared* labels and *all* error mappings. A **verification script** (`scripts/i18n/detect-untranslated.mjs`) statically scans the codebase for likely-English user-facing strings and reports their file locations, providing the regression guard required by Requirement 7.

### Research Notes

- **Supabase Auth error strings** are returned as plain English `message` fields on the `AuthError`/`AuthApiError` object (e.g. `Invalid login credentials`, `Email not confirmed`, `User already registered`). They are not localized by the SDK, so the client must map them. Matching is done case-insensitively on substrings because Supabase occasionally appends detail (and the codebase already relies on substring matching in `translateAuthError`). Sourced from the `@supabase/supabase-js` v2 auth error surface already used in `AuthModal.tsx`.
- **API route errors** in this codebase follow a consistent shape: `NextResponse.json({ error: "..." }, { status })`. A grep across `src/app/api/**` confirmed the recurring English literals: `"Not found"`, `"Forbidden"`, `"Unauthorized"`, `"Invalid JSON"` / `"Invalid JSON payload"`, `"Missing required field(s): ..."`, `"No fields to update"`, `"Supabase not configured"`. Many newer routes already return Vietnamese (`"Chủ đề không tìm thấy"`, `"Mật khẩu phải có ít nhất 6 ký tự"`). The translator must therefore be **idempotent on Vietnamese input** — already-Vietnamese strings pass through semantically unchanged.
- **Network failures** surface as `TypeError: Failed to fetch` (Chromium) or `NetworkError when attempting to fetch resource` (Firefox), and as `AbortError` on timeout/cancel. These are detected by name/message and mapped to a connection-problem message.
- **Test tooling** already present: `vitest` (config-less, `pnpm test` → `vitest --run`), `fast-check@^3` for property-based testing, and co-located `src/**/__tests__/*.test.ts`. No new dependencies are required.

## Architecture

```mermaid
flowchart TD
    subgraph Sources[Error Sources]
        A[App own code]
        B[Supabase Auth]
        C[API routes /api/*]
        D[Input validation]
        E[Network / fetch failure]
    end

    subgraph Lib[src/lib/i18n]
        FJ[fetchJson wrapper]
        TES[translateError\nError_Translation_Service]
        MC[messages.ts\nMessage_Catalog]
    end

    subgraph UI[Consumers]
        CMP[Components / Screens]
        ROUTES[API routes\nserver-side]
    end

    B -->|AuthError.message| TES
    C -->|{error} JSON payload| FJ
    E -->|fetch rejection| FJ
    A --> TES
    D --> TES
    FJ --> TES
    TES --> MC
    MC -->|known key| TES
    MC -->|unknown key| FB[Fallback_Message]
    TES --> CMP
    MC --> ROUTES
    MC --> CMP
```

**Flow summary:**

- Components call `fetchJson(url, options)` instead of raw `fetch`. On a non-2xx response or a transport failure, `fetchJson` throws a `LocalizedError` whose `.message` is already Vietnamese (translated via `translateError`).
- Components that catch errors from other sources (Supabase client calls, thrown `Error`s) call `translateError(err)` to obtain the Vietnamese string for display.
- Both `translateError` and components read shared labels and canonical error strings from the `Message_Catalog` via `getMessage(key)`.
- Server-side API routes import catalog constants so the strings they emit are Vietnamese at the source (replacing the English literals). The client-side translator remains the safety net for any residual non-Vietnamese payloads.

### Design Decisions and Rationale

| Decision | Rationale |
| --- | --- |
| Two modules (catalog + translator) instead of one | Separation of concerns: the catalog is data (strings), the translator is logic (matching). Lets the catalog be audited/extended independently and keeps the translator a pure, testable function. |
| Substring + normalized matching, not exact equality | Supabase and some libraries append variable detail to messages; the existing helper already matches substrings. Normalizing (lowercase, trimmed, diacritic-insensitive for Latin) makes matching robust. |
| Translate on the client as the canonical display path | Errors arrive from multiple sources; a client-side translator guarantees a single choke point even when a third-party message can't be changed at its origin. |
| Also fix API routes at the source | Defense in depth — emitting Vietnamese server-side reduces reliance on client mapping and keeps API responses self-describing for future consumers. |
| Idempotent on Vietnamese | Routes already return Vietnamese; double-translation must be a no-op (Req 3.3). |
| Static verification script over runtime checks | A pure UI runtime "is this Vietnamese?" check is unreliable; a static scan that flags English-looking literals with file/line locations is actionable in CI (Req 7.3, 7.4). |
| Pure functions, no React/Next coupling in lib | Keeps logic in `src/lib/` per steering rules and makes property-based testing trivial. |

## Components and Interfaces

### 1. `Message_Catalog` — `src/lib/i18n/messages.ts`

A frozen, typed record of Vietnamese strings. Keys are stable English identifiers (code identifiers, not user-facing). Used by the translator, components, and API routes.

```ts
/** Stable identifiers for shared, reusable user-facing strings. */
export type MessageKey =
  // Generic
  | "common.unknownError"        // Fallback_Message
  | "common.networkError"
  | "common.loading"
  | "common.saving"
  // Auth (Req 5)
  | "auth.invalidCredentials"
  | "auth.emailNotConfirmed"
  | "auth.emailAlreadyUsed"
  | "auth.passwordTooShort"
  | "auth.studentCodeOrPasswordWrong"
  // API / HTTP (Req 6)
  | "api.unauthorized"           // 401 / 403
  | "api.forbidden"
  | "api.notFound"               // 404
  | "api.invalidJson"
  | "api.missingFields"
  | "api.nothingToUpdate"
  | "api.serverNotConfigured";

/** The single source of Vietnamese strings. */
export const MESSAGES: Readonly<Record<MessageKey, string>>;

/** The generic Vietnamese Fallback_Message. */
export const FALLBACK_MESSAGE: string; // "Đã có lỗi xảy ra. Vui lòng thử lại."

/**
 * Retrieve a Vietnamese string by key.
 * Returns FALLBACK_MESSAGE for any key not present in MESSAGES
 * (never returns empty/undefined). Implements Req 4.2, 4.3.
 */
export function getMessage(key: string): string;
```

### 2. `Error_Translation_Service` — `src/lib/i18n/translateError.ts`

```ts
/** Any shape an error can arrive in across the recognized Error_Sources. */
export type ErrorInput =
  | string
  | Error
  | { message?: string; name?: string; status?: number; error?: string }
  | null
  | undefined;

/**
 * Map an Error_Message from ANY recognized Error_Source to Vietnamese.
 * - Normalizes the input to a candidate string (message/error field).
 * - Detects network failures by name/message.
 * - Matches against an ordered table of (matcher -> MessageKey) rules.
 * - If the input already looks Vietnamese, returns it unchanged (idempotent).
 * - Otherwise returns FALLBACK_MESSAGE.
 * Pure function: no I/O, no side effects. Implements Req 2, 3.
 */
export function translateError(input: ErrorInput): string;

/** Optional HTTP-status-aware variant for API responses (Req 6.3, 6.4). */
export function translateApiError(input: ErrorInput, status?: number): string;

/** True if the string contains Vietnamese-specific characters/diacritics. */
export function isVietnamese(text: string): boolean;
```

**Matching strategy (ordered, first match wins):**

1. Normalize: resolve candidate string from `error` field → `message` field → the string itself; lowercase; trim.
2. If empty → `FALLBACK_MESSAGE`.
3. If `isVietnamese(candidate)` → return the *original* (non-lowercased) candidate (idempotent pass-through, Req 3.3).
4. Network detection: `failed to fetch`, `networkerror`, `aborterror`, `timeout`, `offline` → `common.networkError`.
5. Status-aware (when provided): `401`/`403` → `api.unauthorized`; `404` → `api.notFound`.
6. Substring table (Supabase + API literals) → corresponding `MessageKey`.
7. No match → `FALLBACK_MESSAGE`.

### 3. `fetchJson` client wrapper — `src/lib/i18n/fetchJson.ts`

```ts
export class LocalizedError extends Error {
  readonly status?: number;
  readonly raw?: unknown;
  constructor(messageVi: string, status?: number, raw?: unknown);
}

/**
 * fetch + JSON parse + localized error handling.
 * - On network failure: throws LocalizedError(getMessage("common.networkError")).
 * - On non-2xx: parses {error}, throws LocalizedError(translateApiError(payload, status), status).
 * - On success: returns parsed JSON as T.
 * Implements Req 2.3, 2.4, 6.1, 6.2.
 */
export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T>;
```

### 4. Consumption pattern

**Components** (client):

```ts
// Before:  setError(translateAuthError(err.message));
// After:
import { translateError } from "@/lib/i18n/translateError";
catch (err) { setError(translateError(err)); }

// Network-aware calls:
import { fetchJson, LocalizedError } from "@/lib/i18n/fetchJson";
try {
  const data = await fetchJson<LoginResponse>("/api/auth/student/login", { ... });
} catch (err) {
  setError(err instanceof LocalizedError ? err.message : translateError(err));
}
```

- `AuthModal.tsx`'s local `translateAuthError` is removed and replaced by `translateError`. The existing Vietnamese mappings move into `MESSAGES`/the matcher table so behavior is preserved.
- `TopicManager.tsx` `alert("Lỗi: " + error.message)` becomes `alert(translateError(error))`.
- `TeacherManager.tsx`, `AdminDashboard.tsx`, `StudentImportManager.tsx`, etc. replace `err.message ?? "..."` fallbacks with `translateError(err)`.

**API routes** (server) replace English literals with catalog constants:

```ts
import { MESSAGES } from "@/lib/i18n/messages";
// Before: NextResponse.json({ error: "Not found" }, { status: 404 })
// After:
NextResponse.json({ error: MESSAGES["api.notFound"] }, { status: 404 });
```

### 5. Verification tool — `scripts/i18n/detect-untranslated.mjs`

A Node script (run via `pnpm` or CI) that statically scans `src/components/**` and `src/app/**` for likely **Untranslated_Text**:

- Extracts candidate user-facing string literals: JSX text nodes, common attributes (`placeholder`, `title`, `aria-label`, `alt`), `alert(...)`, `toast(...)`/`sonner` calls, and `{ error: "..." }` in API routes.
- Flags a candidate when it contains ASCII letters, looks like a natural-language phrase (≥ 2 words or a known English token), and contains **no** Vietnamese diacritics and is **not** a code identifier/slug/URL/className.
- Maintains an allowlist for legitimate non-translatable tokens (brand names, code identifiers, test files).
- Reports each finding as `path:line:col — "literal"` and exits non-zero when findings exist (CI gate).

```bash
node scripts/i18n/detect-untranslated.mjs        # report
node scripts/i18n/detect-untranslated.mjs --ci   # exit 1 on findings
```

## Data Models

### Message catalog entry

The catalog is a flat `Record<MessageKey, string>`. Conceptually each entry is:

| Field | Type | Notes |
| --- | --- | --- |
| `key` | `MessageKey` (string literal union) | Stable English identifier; never shown to users |
| `value` | `string` | Vietnamese_Text shown to users |

### Error-mapping rule (internal to translator)

| Field | Type | Notes |
| --- | --- | --- |
| `match` | `(normalized: string) => boolean` | Substring/predicate test against normalized candidate |
| `key` | `MessageKey` | Catalog key whose Vietnamese value is returned on match |
| `order` | implicit (array index) | First matching rule wins |

### `LocalizedError`

| Field | Type | Notes |
| --- | --- | --- |
| `message` | `string` | Vietnamese_Text (from translator/catalog) |
| `status` | `number \| undefined` | HTTP status when from an API response |
| `raw` | `unknown` | Original payload/error for logging/debugging (never displayed) |

### Canonical error-mapping table (initial)

| Source candidate (normalized substring / status) | MessageKey | Vietnamese value (example) |
| --- | --- | --- |
| `invalid login credentials` | `auth.invalidCredentials` | "Email/mã học sinh hoặc mật khẩu không đúng" |
| `email not confirmed` | `auth.emailNotConfirmed` | "Tài khoản chưa được kích hoạt..." |
| `already registered` / `email already` / `user already` | `auth.emailAlreadyUsed` | "Email đã được sử dụng" |
| `password` (length-related) | `auth.passwordTooShort` | "Mật khẩu phải có ít nhất 6 ký tự" |
| `failed to fetch` / `networkerror` / `aborterror` | `common.networkError` | "Không kết nối được máy chủ. Vui lòng thử lại." |
| status `401`/`403`, or `unauthorized`/`forbidden` | `api.unauthorized` | "Bạn không có quyền thực hiện thao tác này." |
| status `404`, or `not found` | `api.notFound` | "Không tìm thấy mục bạn yêu cầu." |
| `invalid json` | `api.invalidJson` | "Dữ liệu gửi lên không hợp lệ." |
| `missing required field` | `api.missingFields` | "Vui lòng điền đầy đủ thông tin bắt buộc." |
| `no fields to update` | `api.nothingToUpdate` | "Không có thay đổi nào để cập nhật." |
| `not configured` | `api.serverNotConfigured` | "Hệ thống chưa sẵn sàng. Vui lòng thử lại sau." |
| (no match) | `common.unknownError` | "Đã có lỗi xảy ra. Vui lòng thử lại." |
