# MindVault

MindVault is an AI-powered second-brain application for saving notes, links, YouTube videos, and Twitter/X posts. It extracts useful content, generates AI summaries and tags, supports semantic search, and answers questions from your saved knowledge with grounded sources.

## Features

- Secure account creation and sign-in with JWT and bcrypt.
- Save notes, links, YouTube URLs, and Twitter/X URLs.
- Background content ingestion using webpage extraction, YouTube transcripts, and Twitter oEmbed.
- Groq-powered summaries and automatic topic tags.
- Clear processing states: completed, fallback, pending, and failed.
- Gemini-powered 768-dimensional embeddings for semantic search.
- Hybrid search: keyword matches plus meaning-based matches.
- **Ask My Brain** RAG chat, with answers based on retrieved saved items and clickable sources.
- Shareable public brain links.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, TypeScript, Tailwind CSS, Axios |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Summary and chat | Groq (`llama-3.3-70b-versatile`) |
| Embeddings | Gemini (`gemini-embedding-2`, 768 dimensions) |

## Project structure

```text
building-second-brain/
├── second-brain/                 # Express API
│   └── src/
│       ├── models/               # MongoDB schemas
│       ├── routes/               # auth, items, brain, chat
│       ├── services/             # ingest, AI, embedding, search processing
│       └── middleware/           # JWT protection
└── brainly-main-frontend/        # React/Vite application
    └── src/
        ├── components/
        ├── pages/
        └── api/
```

## Setup

### 1. Configure the backend

Copy `second-brain/.env.example` to `second-brain/.env` and provide real values:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret
GROQ_API_KEY=gsk_your_groq_key
GEMINI_API_KEY=your_gemini_key
CLIENT_ORIGIN=http://localhost:5173
PORT=3000
```

Never commit `.env`. Rotate any key that was ever shared or committed.

### 2. Start the backend

```powershell
cd second-brain
npm install
npm.cmd run build
npm.cmd run start
```

The health endpoint is available at `http://localhost:3000`. It reports whether Groq and Gemini are configured without exposing secrets.

### 3. Start the frontend

```powershell
cd brainly-main-frontend
npm install
npm.cmd run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## How AI processing works

1. A user saves an item; the API returns immediately.
2. A background task extracts available text.
3. Groq generates a summary and tags.
4. Gemini generates one embedding for the completed item.
5. The item is updated in MongoDB and the UI refreshes automatically.

The app never silently presents a fallback preview as a Groq result. Each card/details panel shows the processing state. Existing items without embeddings can be processed using **Generate embeddings**.

## Search and Ask My Brain

Typing in dashboard search uses hybrid retrieval: MongoDB text search handles exact matches and cosine similarity over Gemini embeddings handles semantic matches. Results are restricted to the authenticated user.

Ask My Brain retrieves the most relevant items, builds a limited context block, and asks Groq to answer only from that context. The response includes source chips that open the corresponding saved item.

## Verification

```powershell
cd second-brain
npm.cmd run build

cd ../brainly-main-frontend
npm.cmd run build
```
