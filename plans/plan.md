# Randomize Questions & Grok AI Integration

Provide a brief description of the problem, any background context, and what the change accomplishes.
Currently, questions (missions) are hardcoded in the frontend. This plan updates the map to fetch topics from Supabase dynamically and randomizes the question presented to the user each time they play. Additionally, it plans the UI and logic for integrating "Grok AI" to generate explanatory images or videos for the answers.

## User Review Required

> [!WARNING]
> This plan proposes modifying the `JourneyMap` and `MissionScreen` components to decouple them from the hardcoded `gameData.ts` and connect them directly to your Supabase tables.

## Open Questions

> [!IMPORTANT]
>
> 1. **Grok API Key:** Do you have an xAI (Grok) API key you'd like to use for this, or should I create a simulated/mock UI for the AI generation first?
> 2. **Video Generation:** Grok doesn't natively generate videos via its API yet. Do you want to use a different API for video (like Luma/Runway), or should we just mock the video generation with a placeholder?
> 3. **Topics Map:** Currently `JourneyMap.tsx` has hardcoded coordinates for exactly 5 missions. Since we have 7 topics in the DB, do you want me to update the map path to dynamically place 7 stops, or adjust the CSS/layout to handle a variable number of topics?

## Proposed Changes

### Database Integration

#### [MODIFY] [JourneyMap.tsx](file:///Applications/work/Websiteantoanso/src/app/components/JourneyMap.tsx)

- Add `useEffect` to fetch all active `topics` from Supabase.
- Update the UI to map over the dynamic topics instead of the static `missions` array.

#### [MODIFY] [App.tsx](file:///Applications/work/Websiteantoanso/src/app/App.tsx)

- When a user selects a topic on the map, fetch all questions for that `topic_id`.
- Select a random question from the fetched list.
- Pass the selected question down to `MissionScreen`.

#### [MODIFY] [MissionScreen.tsx](file:///Applications/work/Websiteantoanso/src/app/components/MissionScreen.tsx)

- Update props to accept a dynamic question format from the database rather than the static `Mission` interface.
- Map `option_a`, `option_b`, `option_c` to the clickable buttons, and determine correctness using `correct_option`.

---

### Grok AI Integration

#### [MODIFY] [MissionScreen.tsx](file:///Applications/work/Websiteantoanso/src/app/components/MissionScreen.tsx)

- Add an "Ask Grok AI" (Hỏi AI Grok) button that appears after the user answers the question.
- Create a loading state and an expandable feedback section to display the AI's response (image/video player and explanation text).

#### [NEW] [grokApi.ts](file:///Applications/work/Websiteantoanso/src/app/lib/grokApi.ts)

- Create a utility file to manage the API calls to the AI service (or simulate the delay and return mock data if an API key isn't provided).

## Verification Plan

### Automated Tests

- N/A

### Manual Verification

- Start the game and verify the map displays all topics from the database.
- Click a topic multiple times across different playthroughs and confirm the question changes randomly.
- Answer a question and click the "Ask Grok AI" button to verify the loading state and display of the explanatory image/video.
