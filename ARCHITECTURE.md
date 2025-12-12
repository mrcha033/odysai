# Ody'sai Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React Frontend (Port 3000)                   │  │
│  │                                                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ Create   │  │  Room    │  │ Survey   │             │  │
│  │  │  Room    │  │  Lobby   │  │          │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  │                                                         │  │
│  │  ┌──────────┐  ┌──────────┐                            │  │
│  │  │   Plan   │  │   Trip   │                            │  │
│  │  │ Selection│  │  Lobby   │                            │  │
│  │  └──────────┘  └──────────┘                            │  │
│  │                                                         │  │
│  │                    ▼                                    │  │
│  │              ┌─────────┐                                │  │
│  │              │ API     │                                │  │
│  │              │ Client  │                                │  │
│  │              └─────────┘                                │  │
│  └────────────────────┬────────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP/REST
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────────────────────────────────────────────┐
│         Node.js Backend (Port 3001)                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Express API Server                     │  │
│  │                                                    │  │
│  │  POST   /api/rooms                                │  │
│  │  GET    /api/rooms/:roomId                        │  │
│  │  POST   /api/rooms/:roomId/members                │  │
│  │  POST   /api/members/:memberId/survey             │  │
│  │  POST   /api/rooms/:roomId/plans/generate  ───┐   │  │
│  │  POST   /api/trips/:tripId/replace-spot    ───┤   │  │
│  │  ...                                          │   │  │
│  └───────────────────────────────────────────────┼───┘  │
│                                                   │      │
│  ┌────────────────────────────────────────────────┼──┐  │
│  │        AI Service (Gemini)                   │  │  │
│  │                                                ▼  │  │
│  │  - generateInitialPackages()    ┌──────────────┐ │  │
│  │  - refinePackage()              │  LLM Call    │ │  │
│  │  - replaceSpot()                │ (Gemini API) │ │  │
│  │                                 └──────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         In-Memory Data Store                      │  │
│  │                                                    │  │
│  │  - rooms: Map<id, Room>                           │  │
│  │  - members: Map<id, Member>                       │  │
│  │  - planPackages: Map<roomId, PlanPackage[]>       │  │
│  │  - trips: Map<id, Trip>                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Room Creation Flow
```
User Input
    ↓
CreateRoom Component
    ↓
api.createRoom()
    ↓
POST /api/rooms
    ↓
store.createRoom()
    ↓
Return Room object
    ↓
Navigate to Room Lobby
```

### 2. Survey Flow
```
Member joins room
    ↓
Survey Component
    ↓
User selects preferences
    ↓
api.submitSurvey()
    ↓
POST /api/members/:id/survey
    ↓
store.updateMember()
    ↓
Return updated Member
    ↓
Navigate back to Lobby
```

### 3. AI Plan Generation Flow
```
All surveys completed
    ↓
User clicks "Generate"
    ↓
api.generatePlans()
    ↓
POST /api/rooms/:id/plans/generate
    ↓
aiService.generateInitialPackages()
    ↓
- Analyze surveys + constraints
- Call Gemini with structured JSON schema
- Generate 3 themed packages
- Fallback to template plans if Gemini unavailable
    ↓
store.setPlanPackages()
    ↓
Return PlanPackage[]
    ↓
Display in PlanSelection
```

### 4. Spot Replacement Flow
```
Trip in progress
    ↓
User clicks "Replace Spot"
    ↓
api.replaceSpot()
    ↓
POST /api/trips/:id/replace-spot
    ↓
aiService.replaceSpot()
    ↓
- Analyze context
- Generate 2-3 alternatives
- Match time/location
- Simulate delay (800ms)
    ↓
Return ActivitySlot[]
    ↓
Display alternatives in modal
    ↓
User selects alternative
    ↓
Update local trip state
```

## Component Hierarchy

```
App
├── CreateRoom
├── RoomLobby
│   ├── Member list
│   ├── Status badges
│   └── Action buttons
├── Survey
│   ├── Emotion selector
│   ├── Dislikes selector
│   ├── Budget selector
│   └── Constraints
├── PlanSelection
│   ├── Package cards
│   └── Day plan view
└── TripLobby
    ├── Current day view
    ├── Activity slots
    └── Replace modal
        └── Alternative slots
```

## Data Models

### Room
```typescript
{
  id: string
  city: string
  dateRange: { start: string, end: string }
  theme: string[]
  travelerCount: number
  createdAt: string
}
```

### Member
```typescript
{
  id: string
  roomId: string
  nickname: string
  surveyCompleted: boolean
  isReady: boolean
  survey?: Survey
}
```

### Survey
```typescript
{
  emotions: string[]
  dislikes: string[]
  budgetLevel: 'low' | 'medium' | 'high'
  constraints: string[]
  wakeUpTime: string
  nightlife: boolean
  instagramImportance: number
}
```

### PlanPackage
```typescript
{
  id: string
  roomId: string
  name: string
  description: string
  days: DayPlan[]
  themeEmphasis: string[]
}
```

### DayPlan
```typescript
{
  day: number
  date: string
  slots: ActivitySlot[]
}
```

### ActivitySlot
```typescript
{
  id: string
  time: string
  duration: number
  title: string
  description: string
  location: string
  category: string
  tags: string[]
}
```

## State Management

### Frontend State
- **Router state**: Current page/route
- **Component state**: Form inputs, UI state
- **LocalStorage**: memberId, roomId (session)
- **Polling**: Room status every 3 seconds

### Backend State
- **In-memory Maps**: All data stored in RAM
- **Stateless**: No session management
- **No persistence**: Data lost on restart

## Future Architecture (Production)

```
┌─────────────────────────────────────────────┐
│         React Frontend (PWA/Mobile)         │
│              + WebSocket Client             │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│   API Gateway   │    │  WebSocket      │
│   (REST API)    │    │  Server         │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │   BFF (Node.js)     │
         │   - Auth            │
         │   - Validation      │
         │   - Rate Limiting   │
         └──────────┬──────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
    ┌────▼─────┐  ┌──▼───┐  ┌──▼─────┐
    │ AI       │  │ DB   │  │ Cache  │
    │ Service  │  │(PG)  │  │(Redis) │
    └────┬─────┘  └──────┘  └────────┘
         │
    ┌────▼────────┐
    │ LLM APIs    │
    │ Places API  │
    │ Weather API │
    └─────────────┘
```

## Deployment Strategy (Future)

### Development
- Frontend: Vite dev server (port 3000)
- Backend: tsx watch (port 3001)

### Production
- Frontend: Static hosting (Vercel/Netlify)
- Backend: Container (Docker) on Cloud Run/ECS
- Database: Managed PostgreSQL
- AI: Google Gemini API (managed by Google)
- CDN: CloudFlare/CloudFront

## Security Considerations (Future)

1. **Authentication**: JWT tokens
2. **Rate Limiting**: Express rate-limit
3. **Input Validation**: Joi/Zod schemas
4. **CORS**: Configured for production domains
5. **Secrets**: Environment variables
6. **API Keys**: Stored in backend only (never shipped to clients)
7. **SQL Injection**: Parameterized queries
8. **XSS**: React auto-escaping + CSP headers

## Performance Optimizations (Future)

1. **Caching**: Redis for room/plan data
2. **Pagination**: Limit data transfer
3. **Lazy Loading**: React.lazy for routes
4. **Code Splitting**: Dynamic imports
5. **Image Optimization**: WebP + CDN
6. **Debouncing**: User input handling
7. **Memoization**: React.memo for expensive components
8. **WebSocket**: Replace polling

---

**Current Implementation**: Simplified for MVP speed
**Production Ready**: Requires items in "Future" sections
