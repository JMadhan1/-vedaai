# VedaAI - AI Assessment Creator

An intelligent question paper generation system powered by AI. Create customized exam papers with a single click using advanced language models.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 14)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Pages: Dashboard, Create Assignment, View Question Paper │   │
│  │ WebSocket: Real-time status updates (Queued→Processing) │   │
│  │ Store: Zustand (Assignment & Generation State)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ HTTP + WebSocket
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Backend (Express.js + TypeScript)               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes:                                              │   │
│  │  • POST /api/assignments (create with validation)        │   │
│  │  • GET /api/assignments (list)                           │   │
│  │  • POST /api/papers/{id}/regenerate                      │   │
│  │  • GET /api/papers/{id}/download (PDF export)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Queue Processing (BullMQ):                               │   │
│  │  • Job status: pending → processing → completed/error    │   │
│  │  • WebSocket broadcasts on status change                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ LLM Service:                                             │   │
│  │  • Groq API (mixtral-8x7b-32768)                        │   │
│  │  • Strict JSON schema with validation                    │   │
│  │  • Automatic retry on failure                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PDF Generation (Puppeteer):                              │   │
│  │  • Server-side rendering with Puppeteer                 │   │
│  │  • A4 page formatting, print-friendly                    │   │
│  │  • Includes answer key                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────────────┬──────────────────────┘
           │                              │
     ┌─────▼─────┐               ┌────────▼────────┐
     │  MongoDB  │               │  Redis (Queue)  │
     │           │               │                 │
     │ • Assign- │               │ • BullMQ Jobs   │
     │   ments   │               │ • Job Metadata  │
     │ • Papers  │               │                 │
     └───────────┘               └─────────────────┘
```

## Tech Stack

**Frontend:**
- Next.js 14 (React 19)
- TypeScript
- Zustand (State Management)
- Tailwind CSS
- WebSocket (Real-time updates)

**Backend:**
- Node.js (Express.js)
- TypeScript
- BullMQ (Job Queue)
- MongoDB (Data persistence)
- Redis (Queue backend)
- Groq SDK (LLM)
- Puppeteer (PDF generation)
- express-validator (Input validation)

**Infrastructure:**
- Groq API (LLM: mixtral-8x7b-32768)
- MongoDB (Database)
- Redis (Message broker)

## Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (or connection string)
- Redis running locally (or connection string)
- Groq API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd vedaai
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**

   Create `backend/.env`:
   ```bash
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/vedaai
   REDIS_URL=redis://localhost:6379
   GROQ_API_KEY=your_groq_api_key_here
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

   Frontend `.env.local` (already configured):
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_WS_URL=ws://localhost:4000
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:4000

## How It Works

### Generation Flow

1. **User creates assignment** via `/assignments/new` form
   - Validates input on client & server
   - Optional PDF upload for reference material
   - Submits to `/api/assignments` POST

2. **Assignment enqueued** in BullMQ
   - Status: `pending`
   - Job waits in queue with unique ID

3. **Generation worker processes** when queue slot available
   - Status: `processing`
   - Worker calls Groq LLM with exact system prompt
   - LLM returns structured JSON question paper

4. **Paper saved to MongoDB**
   - GeneratedPaper document created
   - Status: `completed`
   - Stored with answer key & metadata

5. **Real-time WebSocket updates**
   - Client subscribes to assignment
   - Receives: `queued` → `processing` → `completed`
   - Auto-redirect on completion
   - Auto-reconnect on disconnect (exponential backoff)

### Paper Generation Prompt

The system uses an exact, deterministic prompt for LLM consistency:

```
System: You are an expert educator and exam paper creator.
Generate a structured question paper in valid JSON only.
No markdown, no explanation, just JSON...

User: Create a question paper for:
Subject: [subject]
Topic/Instructions: [instructions]
Question Types: [mcq, short, long]
Total Questions: [count]
Marks per Question: [marks]
Difficulty Distribution: Easy 30%, Medium 50%, Hard 20%
Reference Material: [optional PDF text]

Generate exactly [count] questions...
```

Output is validated against strict JSON schema with all required fields.

### Validation Rules

**Client-side (Real-time feedback):**
- Title: min 3 chars
- Subject: required
- Due date: must be future
- Question types: at least 1 selected
- Total questions: 1-50, integer only
- Marks: min 1, integer only

**Server-side (Request validation):**
- All client rules enforced
- express-validator middleware
- PDF file size limits
- Negative value rejection

## API Endpoints

### Assignments
```
POST   /api/assignments              Create assignment
GET    /api/assignments              List all assignments
GET    /api/assignments/:id          Get single assignment
GET    /api/assignments/:id/job-status Get generation status
```

### Papers
```
GET    /api/papers/:paperId          Get generated paper
GET    /api/papers/assignment/:id    Get paper by assignment ID
GET    /api/papers/:paperId/download Download as PDF
POST   /api/papers/:assignmentId/regenerate Regenerate paper
```

## WebSocket Events

**Client → Server:**
```json
{ "type": "subscribe", "assignmentId": "..." }
```

**Server → Client:**
```json
{ "type": "queued", "assignmentId": "...", "position": 3 }
{ "type": "processing", "assignmentId": "..." }
{ "type": "completed", "assignmentId": "...", "paperId": "..." }
{ "type": "error", "assignmentId": "...", "message": "..." }
```

## Database Schema

### Assignment
```typescript
{
  title: string
  subject: string
  dueDate: Date
  questionTypes: string[]
  totalQuestions: number
  marksPerQuestion: number
  difficulty: string
  additionalInstructions: string
  fileContent: string  // extracted PDF text
  status: 'pending' | 'processing' | 'completed' | 'error'
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}
```

### GeneratedPaper
```typescript
{
  assignmentId: ObjectId
  paperTitle: string
  subject: string
  class: string
  maxMarks: number
  duration: string
  sections: [{
    id: string
    title: string
    instruction: string
    questions: [{
      id: string
      number: number
      text: string
      difficulty: 'easy' | 'medium' | 'hard'
      marks: number
      type: 'mcq' | 'short' | 'long'
      options: string[] | null
    }]
  }]
  answerKey: [{
    questionId: string
    answer: string
  }]
  createdAt: Date
  updatedAt: Date
}
```

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

### Backend (Railway)
1. Create Railway project
2. Add MongoDB add-on
3. Add Redis add-on
4. Set environment variables
5. Deploy with `git push`

## Development

### Running Individual Services

**Backend only:**
```bash
npm run backend:dev
```

**Frontend only:**
```bash
npm run frontend:dev
```

### Building for Production

```bash
npm run build
# Backend output: backend/dist
# Frontend output: frontend/.next
```

## Troubleshooting

### Redis Connection Failed
```bash
# Windows: Download Redis from https://github.com/microsoftarchive/redis/releases
# Or use WSL2 with: wsl redis-server
# macOS: brew install redis && redis-server
```

### MongoDB Connection Failed
```bash
# Check MongoDB is running
# Default local URI: mongodb://localhost:27017/vedaai
# Set MONGODB_URI env var if using Atlas
```

### PDF Generation Timeout
```bash
# Increase Puppeteer timeout in src/services/pdfService.ts
# Check system has sufficient memory for browser launch
```

### LLM Response Not Valid JSON
```bash
# Check GROQ_API_KEY is valid
# Verify internet connection
# Check API rate limits
# Review LLM response parsing in src/services/llmService.ts
```

## License

MIT

## Contributors

Built with ❤️ for educators and students
