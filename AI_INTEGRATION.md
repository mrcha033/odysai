# AI Integration (Gemini, No n8n)

This project now calls Google Gemini **directly from the backend**. n8n is no longer required or used at runtime.

## Setup

1. Install dependencies (already in `package.json`):
   - `@google/generative-ai`
2. Configure backend environment (`odysai-backend/.env`):
   ```bash
   GEMINI_API_KEY=your_google_gemini_api_key
   GEMINI_MODEL=gemini-1.5-flash-latest # optional override
   PORT=3001
   ```
3. Start services:
   ```bash
   cd odysai-backend && npm run dev
   cd ../odysai-frontend && npm run dev
   ```

## What Runs Where

- `odysai-backend/src/aiService.ts` and `api/_lib/aiService.ts`
  - Calls Gemini with `responseMimeType: application/json` + schema
  - Generates 3 itinerary packages per request
  - Suggests 2–3 replacement activities for a slot
  - Falls back to deterministic templates if Gemini is unreachable or `GEMINI_API_KEY` is missing

## Flows

### Plan Generation
1. Frontend → `POST /api/rooms/:roomId/plans/generate`
2. Backend gathers room + surveys → `aiService.generateInitialPackages`
3. Gemini returns JSON (packages/days/slots) → normalized to internal `PlanPackage`
4. Plans cached in memory (or KV in serverless)

### Spot Replacement
1. Frontend → `POST /api/trips/:tripId/replace-spot`
2. Backend sends slot, reason, day context, group dislikes/constraints to `aiService.replaceSpot`
3. Gemini returns 2–3 alternatives → normalized to `ActivitySlot[]`
4. Response shown in Trip Lobby modal

## Error Handling & Fallbacks
- If Gemini returns an error or `GEMINI_API_KEY` is absent, `aiService` returns template itineraries/alternatives.
- Logs include `[ai]` prefixes when falling back.

## Security Notes
- Keep `GEMINI_API_KEY` **only** in backend/serverless env vars.
- The frontend never sees the key; all AI calls are server-side.

## Quick Test (curl)

```bash
# Generate plans (assumes room + surveys already created)
curl -X POST http://localhost:3001/api/rooms/<roomId>/plans/generate

# Replace a spot
curl -X POST http://localhost:3001/api/trips/<tripId>/replace-spot \
  -H "Content-Type: application/json" \
  -d '{"slotId":"<slotId>","reason":"WEATHER","day":1}'
```

