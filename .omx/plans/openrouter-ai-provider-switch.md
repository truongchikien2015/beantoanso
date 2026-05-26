# AI Provider Switch: Grok + OpenRouter

## Summary
Add OpenRouter as a second AI provider and let the app switch between Grok/xAI and OpenRouter for both existing AI flows:
- Mission explanation
- Admin AI question generation

Keep the current `/api/grok/*` route URLs for compatibility, but refactor their internals to use a shared provider layer. The default provider comes from env, and admin UI can explicitly choose Grok or OpenRouter when generating questions.

## Key Changes

### Provider Configuration
- Add env support:
  - `XAI_API_KEY`
  - `XAI_MODEL` default `grok-4.3`
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL` default `openai/gpt-4o-mini`
  - `AI_PROVIDER` default `grok`
  - optional `OPENROUTER_SITE_URL`
  - optional `OPENROUTER_SITE_NAME`
- Update `.env.example` with placeholder-only values.
- Define provider ids as `"grok" | "openrouter"` and never expose server API keys to client code.

### Server AI Layer
- Add a server-only helper, for example `src/lib/server/aiProvider.ts`, with:
  - `getAvailableAiProviders()`
  - `resolveAiProvider(requestedProvider?)`
  - `createChatCompletion({ provider, messages, maxTokens, temperature })`
  - normalized response/error handling.
- Grok calls keep using `https://api.x.ai/v1/chat/completions`.
- OpenRouter calls use `https://openrouter.ai/api/v1/chat/completions` with `Authorization`, `Content-Type`, optional `HTTP-Referer`, and optional `X-OpenRouter-Title`.
- Normalize provider errors into friendly Vietnamese messages:
  - missing key
  - invalid key/permission
  - credits/payment required
  - empty/invalid model response

### API Routes
- Update `GET /api/grok/explain` and `GET /api/grok/generate-question` to return:
  - `{ available: boolean, providers: [{ id, label, available }], defaultProvider }`
- Update both `POST` routes to accept optional `provider`.
- Keep existing payloads valid when `provider` is omitted.
- Use the shared AI layer and preserve current validation:
  - explanation returns `{ text, imageUrl: null, videoUrl: null }`
  - question generation returns the existing structured question JSON and still validates duplicate options, age range, gender, and unsafe content.

### Client/UI
- Update `src/lib/grokApi.ts` types/helpers to be provider-neutral while preserving existing function names where possible.
- In `MissionScreen`, rename visible copy from “Grok” to “AI” unless a specific provider is shown, and use the default available provider.
- In `AdminQuestions`, add a provider selector near “AI tạo câu hỏi” when more than one provider is available:
  - “Grok”
  - “OpenRouter”
- Disable unavailable providers and show inline provider-specific failure messages.
- Generated questions must still open in `QuestionForm` as a draft before saving to Supabase.

## Acceptance Criteria
- With only `XAI_API_KEY`, current Grok explanation and admin generation still work.
- With only `OPENROUTER_API_KEY`, AI explanation and admin generation work through OpenRouter.
- With both keys, admin can switch provider before generating a question.
- With neither key, AI buttons remain hidden or disabled and manual question management still works.
- Invalid key or payment/credits errors show friendly inline messages and do not create Supabase rows.
- Existing mission, quiz, voice, share, and manual admin question flows remain unchanged.

## Test Plan
- Run `./node_modules/.bin/tsc --noEmit`.
- Run `yarn run build`.
- API checks:
  - `GET /api/grok/explain` reports provider availability correctly for Grok-only, OpenRouter-only, both, and neither.
  - `POST /api/grok/explain` works with `provider: "grok"` and `provider: "openrouter"` when configured.
  - `POST /api/grok/generate-question` returns validated structured JSON for both providers.
  - invalid payload still returns `400`.
- Manual browser checks:
  - `/mission`: ask AI explanation and confirm normal continue flow still works.
  - `/admin`: select provider, generate a draft, edit it, save to Supabase, and confirm it appears in mission topic selection.

## Assumptions
- Keep existing route paths under `/api/grok/*` to minimize client churn.
- Provider switching is needed in admin for question generation; mission explanation can use the env/default provider unless a future UI asks for student-visible provider choice.
- OpenRouter v1 uses the OpenAI-style chat completions endpoint documented at `https://openrouter.ai/docs/api-reference/chat-completion`.
- No new npm dependencies.
