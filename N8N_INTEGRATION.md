# n8n Integration Guide

> Deprecated: the product no longer uses n8n. AI calls are made directly from the backend via Gemini (`aiService`). See `AI_INTEGRATION.md` for the current flow. This document remains for historical reference only.

## Overview

Ody'sai uses **n8n workflows** to power all AI-driven features. The backend communicates with n8n via HTTP webhooks, sending structured JSON requests and receiving AI-generated responses.

This document explains how to set up, configure, and use the n8n integration.

---

## Architecture

```
Frontend (React)
    ↓ HTTP/REST
Backend (Node.js BFF)
    ↓ HTTP Webhooks
n8n Workflows
    ↓ API Calls
Google Gemini (LLM)
```

The backend acts as a **BFF (Backend for Frontend)**, handling:
- Input validation
- Data transformation (frontend format ↔ n8n format)
- Response conversion
- Error handling

---

## n8n Workflows

The application uses **4 main n8n workflows**:

### 1. **plan-initialize** (Initial Itinerary Generation)
- **Webhook ID**: `388e4a39-35ec-4528-8e85-b3d87397d9f5`
- **Purpose**: Generate 2-3 initial trip itinerary packages based on group surveys
- **Input**: Room info, member surveys, trip dates
- **Output**: Multiple themed packages with day-by-day plans

### 2. **plan-refine** (Itinerary Refinement)
- **Webhook ID**: `3ace88cd-d82c-430a-a6d8-44a909a98782`
- **Purpose**: Refine an existing draft itinerary with minor improvements
- **Input**: Current draft plan, constraints, survey summary
- **Output**: 2-3 refined versions of the plan

### 3. **trip-replace-spot** (Activity Replacement)
- **Webhook ID**: `09af4612-7c3d-411e-abfe-b97e3b8651af`
- **Purpose**: Replace a single activity during the trip
- **Input**: Slot to replace, reason, context (weather, time, location)
- **Output**: 2-3 alternative activities

### 4. **trip-report** (Post-Trip Story Generation)
- **Webhook ID**: `dc483177-7150-4162-87cc-39741450a85d`
- **Purpose**: Generate a shareable emotional trip summary
- **Input**: Final plan, feedback, highlights
- **Output**: Structured story card with keywords, moments, member snapshots

---

## Setup Instructions

### 1. Install n8n

**Option A: Docker (Recommended)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option B: npm**
```bash
npm install -g n8n
n8n start
```

Access n8n at: `http://localhost:5678`

### 2. Import the Workflow

1. Open n8n at `http://localhost:5678`
2. Click **"Workflows"** in the sidebar
3. Click **"Import from File"** or **"Import from URL"**
4. Paste the workflow JSON provided by your team
5. The workflow will create 4 webhook nodes with the specified IDs

### 3. Configure Google Gemini Credentials

Each workflow node uses **Google Gemini** for LLM calls.

1. In n8n, go to **Credentials** (left sidebar)
2. Click **"New Credential"**
3. Search for **"Google PaLM API"** or **"Google Gemini"**
4. Enter your API key:
   - Get your key from: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
5. Name it (e.g., "Google Gemini(PaLM) Api account")
6. Save

The workflow is already configured to use this credential.

### 4. Activate the Workflow

1. Open the imported workflow
2. Click **"Active"** toggle in the top right
3. Verify all 4 webhooks show green status

### 5. Configure Backend Environment

In `odysai-backend/.env`:

```bash
# n8n Configuration
N8N_BASE_URL=http://localhost:5678
N8N_PLAN_INITIALIZE_PATH=/webhook/388e4a39-35ec-4528-8e85-b3d87397d9f5
N8N_PLAN_REFINE_PATH=/webhook/3ace88cd-d82c-430a-a6d8-44a909a98782
N8N_TRIP_REPLACE_SPOT_PATH=/webhook/09af4612-7c3d-411e-abfe-b97e3b8651af
N8N_TRIP_REPORT_PATH=/webhook/dc483177-7150-4162-87cc-39741450a85d

PORT=3001
```

**Note**: If your n8n instance is on a different host/port, update `N8N_BASE_URL`.

### 6. Restart Backend

```bash
cd odysai-backend
npm run dev
```

You should see:
```
🚀 Ody'sai Backend running on http://localhost:3001
📡 n8n integration enabled: http://localhost:5678
```

---

## How It Works

### Example: Plan Generation Flow

1. **User Action**: All group members complete surveys → Click "Generate AI Plans"

2. **Frontend** → **Backend**:
   ```http
   POST /api/rooms/:roomId/plans/generate
   ```

3. **Backend** prepares n8n input:
   ```typescript
   const input: PlanInitializeInput = {
     roomId: "...",
     basicInfo: {
       cities: ["Seoul"],
       startDate: "2025-01-10",
       endDate: "2025-01-12",
       themeTags: ["힐링", "맛집"]
     },
     members: [
       {
         memberId: "...",
         nickname: "Alice",
         survey: {
           emotions: ["힐링", "설렘"],
           dislikes: ["인파"],
           budgetLevel: "MID",
           instagramImportance: 7
         }
       }
     ]
   }
   ```

4. **Backend** → **n8n**:
   ```http
   POST http://localhost:5678/webhook/388e4a39-35ec-4528-8e85-b3d87397d9f5
   Content-Type: application/json

   { ...input... }
   ```

5. **n8n** workflow:
   - Receives JSON
   - Feeds it to **Google Gemini** with system prompt
   - Gemini generates 2-3 itinerary packages
   - Returns structured JSON

6. **Backend** receives n8n response:
   ```json
   {
     "packages": [
       {
         "id": "...",
         "label": "힐링 중심형",
         "description": "여유로운 일정, 자연과 휴식",
         "days": [...]
       }
     ]
   }
   ```

7. **Backend** converts to frontend format and stores

8. **Frontend** displays packages for selection

---

## Data Transformation

The backend handles format conversion between frontend types and n8n schemas.

### Frontend → n8n

Example: Time format conversion
```typescript
// Frontend uses:
{ time: "09:00", duration: 120 }

// n8n expects:
{ startTime: "09:00", endTime: "11:00" }

// Backend converts:
const endTime = addMinutes(slot.time, slot.duration);
```

### n8n → Frontend

Example: Package structure conversion
```typescript
// n8n returns:
{
  label: "힐링 중심형",
  days: [{ slots: [...] }]
}

// Frontend expects:
{
  name: "힐링 중심형",
  days: [{ day: 1, slots: [...] }]
}
```

---

## Testing the Integration

### 1. Manual Test via n8n UI

1. Open n8n workflow
2. Click on a **Webhook** node
3. Click **"Test Workflow"**
4. Use **"Listen for Test Event"**
5. Send a test request:

```bash
curl -X POST http://localhost:5678/webhook/388e4a39-35ec-4528-8e85-b3d87397d9f5 \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "test-room",
    "basicInfo": {
      "cities": ["Seoul"],
      "startDate": "2025-01-15",
      "endDate": "2025-01-17",
      "themeTags": ["힐링"]
    },
    "members": [{
      "memberId": "test-member",
      "nickname": "Test User",
      "survey": {
        "emotions": ["힐링"],
        "dislikes": ["인파"],
        "constraints": [],
        "budgetLevel": "MID",
        "instagramImportance": 5
      }
    }]
  }'
```

6. Verify n8n shows successful execution with JSON response

### 2. End-to-End Test via Frontend

1. Start all services:
   ```bash
   # Terminal 1: n8n
   n8n start

   # Terminal 2: Backend
   cd odysai-backend && npm run dev

   # Terminal 3: Frontend
   cd odysai-frontend && npm run dev
   ```

2. Open `http://localhost:3000`

3. Create a room, add members, complete surveys

4. Click "Generate AI Plans"

5. Check backend logs for:
   ```
   🚀 Ody'sai Backend running on http://localhost:3001
   📡 n8n integration enabled: http://localhost:5678
   ```

6. n8n should show workflow execution in the UI

7. Frontend should display 2-3 plan packages

---

## Troubleshooting

### Issue: "Failed to generate plans" error

**Cause**: n8n is not running or not reachable

**Solution**:
1. Check if n8n is running: `curl http://localhost:5678`
2. Verify n8n port in `.env`: `N8N_BASE_URL=http://localhost:5678`
3. Check n8n logs for errors

### Issue: n8n workflow not executing

**Cause**: Workflow is not active or webhook URLs don't match

**Solution**:
1. Open n8n UI → Workflows
2. Check workflow is **"Active"** (green toggle)
3. Click webhook node → verify URL matches `.env` paths
4. Re-save and reactivate workflow

### Issue: "Invalid JSON response from n8n"

**Cause**: Gemini returned non-JSON or incomplete response

**Solution**:
1. Check n8n execution logs (click on workflow in UI)
2. Verify Gemini API quota is not exceeded
3. Check Gemini credentials are valid
4. Try reducing input complexity (fewer members, shorter dates)

### Issue: Slow AI responses (>30 seconds)

**Cause**: Gemini API latency or complex prompts

**Solution**:
1. Consider using **Gemini 1.5 Flash** (faster than Gemini Pro)
2. In n8n, switch model to: `models/gemini-1.5-flash`
3. Reduce prompt complexity (in workflow system messages)

### Issue: TypeError: Cannot read property 'packages'

**Cause**: n8n response structure doesn't match expected schema

**Solution**:
1. Check backend logs for full n8n response
2. Verify n8n workflow's **Respond to Webhook** node outputs raw result
3. Check n8n prompt includes: `Output ONLY valid JSON`
4. Update n8nService type definitions if needed

---

## Production Considerations

### Security

1. **Never expose n8n webhooks directly to frontend**
   - Always proxy through your BFF
   - Validate all inputs in the backend

2. **Use HTTPS in production**
   ```bash
   N8N_BASE_URL=https://n8n.yourdomain.com
   ```

3. **Add webhook authentication** (n8n Enterprise feature)
   - Set header authentication in n8n webhook settings
   - Add `Authorization` header in backend calls

### Scaling

1. **n8n Self-Hosting**
   - Deploy n8n on AWS/GCP/Azure
   - Use managed PostgreSQL for n8n data
   - Configure auto-scaling for n8n workers

2. **n8n Cloud** (Alternative)
   - Use [n8n Cloud](https://n8n.io/cloud/) for managed hosting
   - Update `N8N_BASE_URL` to cloud endpoint
   - Webhooks remain the same

3. **Caching**
   - Cache identical plan requests (same room + surveys)
   - Use Redis to store recent n8n responses
   - Set TTL based on likelihood of repeat requests

### Monitoring

1. **Backend Logs**
   ```typescript
   console.log('[n8n] Calling plan-initialize for room:', roomId);
   console.error('[n8n] Failed:', error);
   ```

2. **n8n Execution Data**
   - n8n UI shows all executions
   - Set up email alerts for failed workflows
   - Export execution logs to external monitoring (Datadog, etc.)

3. **Metrics to Track**
   - n8n response times (per workflow)
   - Success/failure rates
   - Gemini API quota usage

---

## Advanced: Adding New Workflows

To add a new n8n workflow (e.g., "plan-optimize"):

1. **Create workflow in n8n**:
   - Add Webhook node
   - Add Google Gemini node with prompt
   - Add Respond to Webhook node
   - Activate workflow

2. **Update `.env`**:
   ```bash
   N8N_PLAN_OPTIMIZE_PATH=/webhook/NEW-WEBHOOK-ID
   ```

3. **Add TypeScript types** in `n8nTypes.ts`:
   ```typescript
   export interface PlanOptimizeInput { ... }
   export interface PlanOptimizeOutput { ... }
   ```

4. **Add method to `n8nService.ts`**:
   ```typescript
   async optimizePlan(input: PlanOptimizeInput): Promise<PlanOptimizeOutput> {
     const url = `${this.baseUrl}${process.env.N8N_PLAN_OPTIMIZE_PATH}`;
     const response = await fetch(url, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(input),
     });
     return response.json();
   }
   ```

5. **Add API endpoint** in `index.ts`:
   ```typescript
   app.post('/api/rooms/:roomId/plans/optimize', async (req, res) => {
     const result = await n8nService.optimizePlan(input);
     res.json(result);
   });
   ```

---

## Summary

- **4 n8n workflows** power Ody'sai AI features
- Backend acts as a **proxy and transformer** between frontend and n8n
- n8n uses **Google Gemini** for all LLM calls
- Configuration is via **environment variables** (`.env`)
- All workflows use **HTTP webhooks** for communication
- Response formats are strictly **JSON-based**

For questions, refer to:
- n8n docs: https://docs.n8n.io
- Google Gemini docs: https://ai.google.dev/docs

---

**Ready to go! Your n8n integration is complete.**
