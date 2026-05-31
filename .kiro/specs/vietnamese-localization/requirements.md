# Requirements Document

## Introduction

This feature ensures that **all user-facing text** in the "Bé An Toàn Số" application is displayed in Vietnamese, in line with the product's Vietnamese-first principle. The scope covers static UI labels (buttons, headings, placeholders, menu items), dynamic status messages, and — critically — **all error messages**, including those that originate outside the app's own code: Supabase Auth errors, API route error responses, validation errors, and network/transport failures.

Today, several error strings surface to users in English. Examples observed in the codebase:
- Supabase Auth returns strings like `Invalid login credentials` and `Email not confirmed`, currently translated only inside `AuthModal.tsx` via a local `translateAuthError` helper.
- API routes under `src/app/api/` return raw English error strings such as `"Not found"`, `"Forbidden"`, `"Unauthorized"`, `"Invalid JSON"`, and `"Missing required fields"`.
- Several components surface raw `error.message` from Supabase (e.g. `alert("Lỗi: " + error.message)` in `TopicManager.tsx`), which may contain English.

The goal is to systematically guarantee that every label, button, message, and error a user can see is rendered in Vietnamese, and to establish a single, reusable mechanism so that future error sources are translated consistently rather than handled ad hoc per component.

This requirements document describes **what** the system must guarantee. Implementation choices (e.g. a centralized message catalog, an error-mapping module, lint rules) are deferred to the design phase.

## Glossary

- **App**: The "Bé An Toàn Số" web application (Next.js + TypeScript + Supabase) in its entirety, including all screens, components, and API routes.
- **User_Facing_Text**: Any text rendered to and readable by a human user of the App, including labels, headings, button captions, input placeholders, menu items, status messages, toasts, alerts, confirmation prompts, empty-state text, and error messages. Excludes code identifiers, log output written only to the developer console, HTML attributes not shown to users, and machine-readable values such as slugs or enum keys.
- **Vietnamese_Text**: Text written in the Vietnamese language (locale `vi`), using correct Vietnamese vocabulary and diacritics.
- **Error_Message**: A specific category of User_Facing_Text that informs the user that an operation failed or that an undesired condition occurred.
- **Error_Source**: The origin of an Error_Message. Recognized Error_Sources are: (a) the App's own client/server code, (b) Supabase Auth, (c) the App's API routes under `src/app/api/`, (d) input validation logic, and (e) network or transport failures (for example, a failed `fetch`).
- **Supabase_Auth_Error**: An Error_Message returned by the Supabase authentication service, such as `Invalid login credentials` or `Email not confirmed`.
- **API_Error_Response**: A JSON error payload (typically `{ "error": "..." }`) returned by an App API route with a non-2xx HTTP status.
- **Network_Failure**: A condition in which a client request cannot reach the server or no response is received (for example, `Failed to fetch`, `NetworkError`, timeout, or offline).
- **Message_Catalog**: A single, centralized source of Vietnamese strings and error mappings used by the App to render User_Facing_Text (the concrete mechanism is defined in design).
- **Error_Translation_Service**: The App component responsible for mapping any Error_Message from any Error_Source to a Vietnamese_Text equivalent (the concrete mechanism is defined in design).
- **Untranslated_Text**: User_Facing_Text that is not Vietnamese_Text when shown to the user.
- **Fallback_Message**: A generic Vietnamese_Text Error_Message used when no specific mapping exists for a given Error_Message.

## Requirements

### Requirement 1: Vietnamese user-facing text across the App

**User Story:** As a Vietnamese-speaking user (student, teacher, or admin), I want every label and message in the App to be in Vietnamese, so that I can understand and use the App without encountering foreign-language text.

#### Acceptance Criteria

1. THE App SHALL render all User_Facing_Text as Vietnamese_Text.
2. WHERE a screen contains buttons, headings, input placeholders, or menu items, THE App SHALL display each such element as Vietnamese_Text.
3. WHILE the App is displaying a loading, empty, or success state, THE App SHALL present the associated status text as Vietnamese_Text.
4. THE App SHALL exclude code identifiers, developer console logs, and non-displayed HTML attributes from the User_Facing_Text translation scope.

### Requirement 2: Vietnamese error messages from all sources

**User Story:** As a user, I want every error I see to be explained in Vietnamese, so that I understand what went wrong regardless of which part of the system produced the error.

#### Acceptance Criteria

1. WHEN an Error_Message is displayed to the user, THE App SHALL display the Error_Message as Vietnamese_Text.
2. WHEN a Supabase_Auth_Error occurs, THE Error_Translation_Service SHALL map the Supabase_Auth_Error to a Vietnamese_Text equivalent before the App displays the Error_Message.
3. WHEN an API_Error_Response is received by the client, THE App SHALL display a Vietnamese_Text Error_Message to the user.
4. IF a Network_Failure occurs during a client request, THEN THE App SHALL display a Vietnamese_Text Error_Message that indicates a connection problem.
5. IF an Error_Message has no specific Vietnamese mapping in the Message_Catalog, THEN THE Error_Translation_Service SHALL return the Fallback_Message.
6. THE Fallback_Message SHALL be Vietnamese_Text.

### Requirement 3: Centralized error translation

**User Story:** As a developer, I want a single mechanism that translates errors from any source, so that error localization is consistent across the App and new error sources are handled without duplicating translation logic in each component.

#### Acceptance Criteria

1. THE App SHALL provide a single Error_Translation_Service that maps Error_Messages from every Error_Source to Vietnamese_Text.
2. WHEN any component or screen displays an Error_Message, THE component SHALL obtain the displayed text from the Error_Translation_Service.
3. WHEN the Error_Translation_Service receives an input that is already Vietnamese_Text, THE Error_Translation_Service SHALL return equivalent Vietnamese_Text.
4. THE Error_Translation_Service SHALL accept an Error_Message originating from any recognized Error_Source as input.

### Requirement 4: Centralized message catalog

**User Story:** As a developer, I want Vietnamese strings stored in one place, so that text is reused consistently and the App can be audited for completeness.

#### Acceptance Criteria

1. THE App SHALL store User_Facing_Text strings used for shared labels and error mappings in a single Message_Catalog.
2. WHEN the App needs a known Vietnamese label or Error_Message, THE App SHALL retrieve the string from the Message_Catalog.
3. WHERE a string is requested from the Message_Catalog by a key that does not exist, THE Message_Catalog SHALL return the Fallback_Message rather than an empty value.

### Requirement 5: Authentication flow localization

**User Story:** As a user signing in or registering, I want all authentication prompts and failures shown in Vietnamese, so that I can recover from sign-in problems without confusion.

#### Acceptance Criteria

1. WHEN authentication fails with a Supabase_Auth_Error of `Invalid login credentials`, THE App SHALL display a Vietnamese_Text Error_Message indicating that the email/student code or password is incorrect.
2. WHEN authentication fails with a Supabase_Auth_Error of `Email not confirmed`, THE App SHALL display a Vietnamese_Text Error_Message indicating that the account is not yet activated.
3. WHEN registration fails because the email is already in use, THE App SHALL display a Vietnamese_Text Error_Message indicating that the email is already registered.
4. THE App SHALL display all labels, placeholders, and button captions in the authentication interface as Vietnamese_Text.
5. WHEN authentication succeeds in the student, teacher, or admin login flow, THE App SHALL display any status text as Vietnamese_Text.

### Requirement 6: API route error localization

**User Story:** As a user performing teacher or admin actions, I want server-side errors shown in Vietnamese, so that failed operations are understandable.

#### Acceptance Criteria

1. WHEN an App API route returns an API_Error_Response, THE App SHALL ensure the Error_Message shown to the user is Vietnamese_Text.
2. WHEN a client receives an API_Error_Response that contains a non-Vietnamese message, THE Error_Translation_Service SHALL map the message to Vietnamese_Text before display.
3. WHERE an API_Error_Response corresponds to an HTTP status of 401 or 403, THE App SHALL display a Vietnamese_Text Error_Message indicating that the user is not authorized.
4. WHERE an API_Error_Response corresponds to an HTTP status of 404, THE App SHALL display a Vietnamese_Text Error_Message indicating that the requested item was not found.

### Requirement 7: Completeness and prevention of regressions

**User Story:** As a product owner, I want assurance that no user-facing text is left untranslated and that future changes do not reintroduce foreign-language text, so that the Vietnamese-first principle is maintained over time.

#### Acceptance Criteria

1. THE App SHALL present zero instances of Untranslated_Text across all user-facing screens and messages enumerated in the design scope.
2. WHEN a user navigates any student, teacher, or admin screen, THE App SHALL display the screen's User_Facing_Text as Vietnamese_Text.
3. THE feature SHALL provide a verification method that identifies User_Facing_Text that is not Vietnamese_Text.
4. WHEN the verification method detects Untranslated_Text, THE verification method SHALL report the location of the Untranslated_Text.
