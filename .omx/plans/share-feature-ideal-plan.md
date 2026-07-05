# Ideal Share Feature Plan

## Requirements Summary

The current share button in `src/components/ResultScreen.tsx` generates a PNG from the result card with `html-to-image` and then either uses Web Share or downloads the file. This cannot reliably post the image to Facebook web because Facebook sharer accepts a public URL, not a local `data:` image or downloaded file.

The ideal feature should split sharing into clear user actions:

- Share to Facebook using a public result URL with Open Graph metadata.
- Download the generated achievement image for manual upload anywhere.
- Use native device share when the browser supports sharing files.

## Recommended UX

Replace the single `Chia sẻ / Tải ảnh` button with a share sheet/modal:

1. `Chia sẻ Facebook`
   - Primary action.
   - Opens Facebook sharer with a public result URL.
   - Copy should say Facebook shares the achievement page; image preview comes from Open Graph.

2. `Tải ảnh thành tích`
   - Always works.
   - Downloads the generated PNG.
   - Useful for Facebook manual upload, Zalo, Messenger, classroom groups.

3. `Chia sẻ bằng thiết bị`
   - Only shown when `navigator.share` and `navigator.canShare({ files })` support the generated file.
   - Best for mobile.

## Implementation Steps

1. Create a persistent share target.
   - Add a route such as `src/app/share/result/[id]/page.tsx`.
   - It should render a lightweight public achievement page from a result id or share token.
   - Use existing result data already passed through `src/app/result/page.tsx`.

2. Add Open Graph metadata for Facebook.
   - Implement `generateMetadata` in the share route.
   - Include `title`, `description`, and `openGraph.images`.
   - The image must be publicly reachable over HTTPS after deployment.

3. Generate a public share image.
   - Best option: create an API route that renders a share card image and stores it in Supabase Storage.
   - Good fallback: use a static OG image template and encode achievement text in metadata.
   - Avoid trying to send a `File`, `Blob`, or `data:` URL to Facebook sharer.

4. Refactor `ResultScreen` share UI.
   - Keep `html-to-image` for `Tải ảnh`.
   - Add a `ShareSheet` component or inline modal near `ResultScreen`.
   - Facebook action should open:
     `https://www.facebook.com/sharer/sharer.php?u=<public-share-url>`
   - Native share action should use Web Share when supported.

5. Add localhost-safe behavior.
   - On localhost, disable or explain Facebook preview sharing because Facebook cannot crawl `localhost`.
   - Still allow image download and native share.

## Acceptance Criteria

- On production HTTPS, clicking `Chia sẻ Facebook` opens Facebook sharer with a non-local public URL.
- Facebook preview shows the app title, score/danh hiệu copy, and an achievement image.
- On localhost, the user is not misled: Facebook action explains deployment/public URL requirement or falls back to download.
- `Tải ảnh thành tích` downloads a PNG every time.
- Mobile browsers with file Web Share support show a native share option.
- Desktop browsers without file share support do not silently fail.
- No popup is opened after an async delay unless a placeholder window was opened synchronously from the click.

## Risks And Mitigations

- Risk: Facebook does not allow direct personal-profile image upload from browser JavaScript.
  - Mitigation: Share a public OG URL and separately support image download.

- Risk: Facebook crawler cannot access auth-protected or localhost pages.
  - Mitigation: Make `/share/result/[id]` public and deployment-only for Facebook.

- Risk: Generated share images expire or are private.
  - Mitigation: Store images in public Supabase Storage or generate stable OG images from public routes.

- Risk: Popup blockers block Facebook.
  - Mitigation: Open the tab synchronously on button click, then set its URL after async preparation.

## Verification Steps

- Run `./node_modules/.bin/tsc --noEmit`.
- Run `yarn run build`.
- Test localhost:
  - Download PNG works.
  - Facebook action does not promise a working localhost preview.
- Test production:
  - Open `/share/result/[id]` unauthenticated.
  - Use Facebook Sharing Debugger on the public URL.
  - Verify OG title, description, image, and canonical URL.

## ADR

### Decision

Use public share pages with Open Graph metadata for Facebook, and keep PNG download/native share as separate actions.

### Drivers

- Facebook web sharer requires a public URL.
- The current result card image is browser-local.
- Users need a reliable fallback across desktop and mobile.

### Alternatives Considered

- Directly upload generated PNG to Facebook from the browser.
  - Rejected: Facebook does not support this for normal personal-profile sharing through sharer URLs.

- Keep one combined `Chia sẻ / Tải ảnh` button.
  - Rejected: It hides platform constraints and makes failures look random.

- Use only Web Share API.
  - Rejected: Desktop/browser support for file sharing is inconsistent.

### Consequences

- Requires one public share route and a public OG image strategy.
- Facebook sharing becomes reliable after deployment, not on localhost.
- UI becomes clearer because sharing and downloading are separate actions.

### Follow-ups

- Decide whether share images are generated on demand or from a reusable template.
- Add copy for unsupported Facebook sharing on localhost.
- Consider adding Zalo/Messenger copy-link actions later.
