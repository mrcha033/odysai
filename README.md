# Ody'sai - AI-Assisted Group Trip Planning

> AI와 함께 그려가는 여행

Ody'sai is a web-first, AI-assisted group trip planning application that reduces friction in group travel planning by allowing travelers to submit their preferences, emotions, and constraints. An AI agent then generates consensus-friendly itinerary packages that groups can refine and adjust.

## Features

- **Room-based Planning**: Create trip rooms and invite friends via shareable links
- **Smart Surveys**: Fun, emotional surveys to capture each traveler's preferences
- **AI Itinerary Generation**: Get 3 themed itinerary packages based on group preferences
- **Interactive Planning**: View and select plans with detailed day-by-day breakdowns
- **Ready Status**: Track when all members approve the plan
- **Trip Execution**: Manage your trip in real-time with the trip lobby
- **Spot Replacement**: Replace activities on-the-fly with AI-suggested alternatives

## Tech Stack

### Frontend
- **React** (TypeScript)
- **Vite** (Build tool)
- **React Router** (Navigation)
- Vanilla CSS (Styling)

### Backend
- **Node.js** with **Express** (TypeScript)
- **n8n** workflows for AI orchestration
- **Google Gemini** (via n8n) for LLM features
- In-memory data store (for MVP)

## Project Structure

```
odysai/
├── odysai-backend/          # Backend BFF service
│   ├── src/
│   │   ├── index.ts         # Express server & API routes
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── store.ts         # In-memory data store
│   │   ├── n8nService.ts    # n8n webhook integration
│   │   └── n8nTypes.ts      # n8n workflow schemas
│   ├── .env                 # Environment configuration
│   ├── package.json
│   └── tsconfig.json
│
└── odysai-frontend/         # React frontend
    ├── src/
    │   ├── pages/           # Page components
    │   │   ├── CreateRoom.tsx
    │   │   ├── RoomLobby.tsx
    │   │   ├── Survey.tsx
    │   │   ├── PlanSelection.tsx
    │   │   └── TripLobby.tsx
    │   ├── App.tsx          # Main app with routing
    │   ├── App.css          # Global styles
    │   ├── api.ts           # API client
    │   ├── types.ts         # TypeScript interfaces
    │   └── main.tsx         # Entry point
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- **n8n** (for AI features)
- **Google Gemini API Key** (for LLM calls)

### Installation

1. **Install n8n** (if not already installed):

```bash
# Option 1: Docker (Recommended)
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n

# Option 2: npm
npm install -g n8n
n8n start
```

Access n8n at `http://localhost:5678`

2. **Import n8n workflow**:
   - Open n8n UI → Workflows → Import from File
   - Import the workflow JSON (see **N8N_INTEGRATION.md** for details)
   - Configure Google Gemini credentials
   - Activate the workflow

3. **Install backend dependencies:**

```bash
cd odysai-backend
npm install
```

4. **Configure environment** (odysai-backend/.env):

```bash
N8N_BASE_URL=http://localhost:5678
N8N_PLAN_INITIALIZE_PATH=/webhook/388e4a39-35ec-4528-8e85-b3d87397d9f5
N8N_PLAN_REFINE_PATH=/webhook/3ace88cd-d82c-430a-a6d8-44a909a98782
N8N_TRIP_REPLACE_SPOT_PATH=/webhook/09af4612-7c3d-411e-abfe-b97e3b8651af
N8N_TRIP_REPORT_PATH=/webhook/dc483177-7150-4162-87cc-39741450a85d
PORT=3001
```

5. **Install frontend dependencies:**

```bash
cd odysai-frontend
npm install
```

### Running the Application

You need to run **three services**:

**Terminal 1 - n8n:**

```bash
n8n start  # or use Docker
```

**Terminal 2 - Backend:**

```bash
cd odysai-backend
npm run dev
```

The backend will start on `http://localhost:3001`

**Terminal 3 - Frontend:**

```bash
cd odysai-frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

Open your browser to `http://localhost:3000` to use the application.

**📖 For detailed n8n setup, see [N8N_INTEGRATION.md](./N8N_INTEGRATION.md)**

## User Flow

1. **Create a Room**
   - Enter trip destination, dates, and your nickname
   - Get a shareable room link

2. **Invite Friends**
   - Share the room link with your travel group
   - Each member joins and enters their nickname

3. **Complete Surveys**
   - Each member fills out their travel preferences:
     - Desired emotions (힐링, 설렘, 모험, etc.)
     - Dislikes (crowds, long walks, etc.)
     - Budget level
     - Constraints and preferences

4. **Generate AI Plans**
   - Once all surveys are complete, generate AI itinerary packages
   - AI creates 3 themed packages (힐링 중심형, 밸런스형, 모험 중심형)

5. **Review & Select**
   - Browse the AI-generated plans
   - Select your preferred package

6. **Ready Up**
   - Each member marks themselves as READY
   - When all are ready, trip can start

7. **Trip Execution**
   - View daily itinerary in the trip lobby
   - Replace spots on-the-fly if needed (weather, mood, etc.)
   - Get AI-suggested alternatives

## API Endpoints

### Rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:roomId` - Get room status

### Members
- `POST /api/rooms/:roomId/members` - Join a room
- `POST /api/members/:memberId/survey` - Submit survey
- `POST /api/members/:memberId/ready` - Toggle ready status

### Plans
- `POST /api/rooms/:roomId/plans/generate` - Generate AI plans
- `GET /api/rooms/:roomId/plans` - Get plan packages
- `POST /api/rooms/:roomId/plans/select` - Select a plan

### Trips
- `POST /api/rooms/:roomId/trips/start` - Start the trip
- `POST /api/trips/:tripId/replace-spot` - Replace an activity

## MVP Scope

This is an MVP implementation focusing on core features:

**Included:**
- ✅ Room creation and invites
- ✅ Member surveys
- ✅ AI plan generation (mocked)
- ✅ Plan selection
- ✅ Ready status tracking
- ✅ Trip lobby
- ✅ Spot replacement

**Not Included (Future):**
- ❌ Real-time chat
- ❌ Payment & booking integration
- ❌ Live GPS tracking
- ❌ Post-trip story reports
- ❌ User authentication
- ❌ Persistent database
- ❌ Real n8n integration
- ❌ Drag-and-drop editor

## Future Enhancements

1. **n8n Integration**: Replace mock AI service with real n8n workflows
2. **Database**: Add PostgreSQL/MongoDB for persistence
3. **Authentication**: Add user accounts and session management
4. **Real-time Sync**: WebSocket for live updates
5. **Drag & Drop Editor**: Visual itinerary customization
6. **Trip Reports**: Post-trip emotional story generation
7. **Mobile App**: PWA or native apps

## Development Notes

- Backend uses in-memory storage (data resets on server restart)
- AI responses are mocked with realistic delays
- No authentication required for MVP (uses localStorage for session)
- Polling used for updates (not WebSocket)

## Contributing

This is an MVP/prototype. For production deployment, consider:

1. Adding proper error handling
2. Implementing authentication
3. Using a real database
4. Adding input validation
5. Implementing rate limiting
6. Setting up proper logging
7. Adding tests

## License

MIT License - feel free to use this as a starting point for your own projects!

## Contact

For questions or feedback about this implementation, please refer to the PRD document.

---

Built with ❤️ for better group travel planning
