# Internee.pk AI Tutor

A personalized GenAI tutor for guiding interns through Internee.pk's learning modules.

- **Dynamic lesson planning** — generates a tailored lesson plan per module based on the learner's level and past weak areas.
- **AI Q&A** — a chat tutor scoped to whichever module the learner is on.
- **Progress & weak-area tracking** — completed lessons and quiz misses are saved to Firestore and shown on the dashboard.

## Why Groq instead of OpenAI

OpenAI's API is paid. This project uses **[Groq](https://console.groq.com)** instead — it's **free**, OpenAI-compatible in shape, and very fast (runs Llama 3.3 70B). If you'd rather use a different free option (Google **Gemini** has a free tier too), swap `lib/groq.js` and the two `groq.chat.completions.create` calls in `app/api/*/route.js` for the equivalent SDK call — the rest of the app doesn't care which model answers.

## 1. Setup

```bash
npm install
cp .env.local.example .env.local
```

## 2. Get a free Groq API key

1. Go to https://console.groq.com/keys
2. Sign up (free) and create an API key
3. Put it in `.env.local` as `GROQ_API_KEY=...`

Free tier is generous and requires no credit card.

## 3. Create a free Firebase project (Spark plan)

1. Go to https://console.firebase.google.com → **Add project**
2. In the project, go to **Build → Authentication → Sign-in method** and enable **Anonymous** sign-in (this lets the app track a learner's progress without making them create an account)
3. Go to **Build → Firestore Database → Create database** (start in test mode for development)
4. Go to **Project settings → General → Your apps → Add app (Web)**, copy the config values into `.env.local`

> **No Firebase yet?** The app still works without it — progress just falls back to the browser's `localStorage` instead of syncing to the cloud. Fill in the Firebase env vars whenever you're ready to persist progress properly.

## 4. Run it

```bash
npm run dev
```

Open http://localhost:3000

## Project structure

```
app/
  page.js                 Dashboard — module list + overall progress
  module/[id]/page.js     Lesson plan + chat + quiz for one module
  api/lesson-plan/route.js  Generates a personalized lesson plan (Groq)
  api/chat/route.js         Answers learner questions (Groq)
  api/quiz/route.js         Generates a diagnostic quiz (Groq)
lib/
  modules.js               Seed list of learning modules — edit to match real Internee.pk tracks
  firebase.js               Auth + Firestore progress read/write, with localStorage fallback
  groq.js                   Groq client + model name
components/
  ModuleCard.js, LessonPlan.js, Chat.js, Quiz.js
```

## Customizing the modules

Edit `lib/modules.js` — each module just needs an `id`, `title`, `description`, and a `topics` array. The AI prompts automatically use whatever is in there, so real Internee.pk module content can be dropped in directly.

## Deploying

Deploys cleanly to **Vercel** (recommended for Next.js): push to GitHub, import into Vercel, add the same env vars from `.env.local` in the Vercel project settings.
