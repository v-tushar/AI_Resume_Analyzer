<div align="center">
  <br />
  <img src="public/readme/hero.webp" alt="Resumind – AI Resume Analyzer">
  <br />

  <div>
    <img alt="React" src="https://img.shields.io/badge/React-4c84f3?style=for-the-badge&logo=react&logoColor=white">
    <img src="https://img.shields.io/badge/-Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="TypeScript" />
    <img alt="Puter.js" src="https://img.shields.io/badge/Puter.js-181758?style=for-the-badge&logoColor=white">
    <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  </div>

  <h3 align="center">Resumind – AI-Powered Resume Analyzer</h3>

  <div align="center">
    An enhanced, production-grade AI Resume Analyzer built on top of the JavaScript Mastery tutorial, with significant custom improvements for accuracy, reliability, and user experience.
  </div>
</div>

---

## 📋 Table of Contents

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🚀 [Custom Enhancements](#custom-enhancements)
5. 🤸 [Quick Start](#quick-start)
6. 📁 [Project Structure](#project-structure)

---

## <a name="introduction">✨ Introduction</a>

**Resumind** is an AI-powered resume analyzer that matches your resume against a job description and provides a detailed ATS score, category-by-category feedback, and an AI chatbot for guided improvement — all running serverlessly in the browser via **Puter.js**.

This repository is a significantly enhanced fork of the original JavaScript Mastery tutorial project, with production-grade improvements across prompt engineering, data validation, input guardrails, data management, and code quality.

---

## <a name="tech-stack">⚙️ Tech Stack</a>

| Technology | Purpose |
|---|---|
| **[React](https://react.dev/)** | UI library for building reusable components |
| **[React Router v7](https://reactrouter.com/)** | Client-side routing with loaders & nested routes |
| **[Puter.js](https://puter.com)** | Serverless auth, cloud storage, KV store, and AI (GPT-4o) |
| **[Tailwind CSS](https://tailwindcss.com/)** | Utility-first CSS framework for rapid styling |
| **[TypeScript](https://www.typescriptlang.org/)** | Static typing for improved reliability and DX |
| **[Vite](https://vite.dev/)** | Fast build tool and dev server |
| **[Zustand](https://github.com/pmndrs/zustand)** | Minimal, hook-based global state management |
| **[Vitest](https://vitest.dev/)** | Unit testing framework for utility functions |

---

## <a name="features">🔋 Features</a>

👉 **Serverless Auth** — No backend needed. Auth handled entirely in the browser via Puter.js.

👉 **Resume Upload & Cloud Storage** — Upload PDFs and store them securely in Puter's cloud filesystem.

👉 **PDF → Image Conversion** — Multi-page PDFs are converted to images client-side to preserve layout for accurate AI Vision analysis.

👉 **AI-Powered ATS Analysis** — Resume is analyzed against a specific job description using GPT-4o Vision, generating structured JSON feedback across 5 categories.

👉 **Detailed Category Scores** — Separate scores and actionable tips for: ATS, Tone & Style, Content, Structure, and Skills.

👉 **AI Resume Chatbot** — Context-aware chatbot that uses your full analysis results as its system prompt to give implementation-specific guidance.

👉 **Data Management Page** — View and permanently wipe all stored resume files and KV data with a safety confirmation flow.

👉 **Responsive Design** — Fully responsive layout that works across all screen sizes.

---

## <a name="custom-enhancements">🚀 Custom Enhancements</a>

The following improvements were built on top of the original tutorial project:

### 🧠 1. Advanced Prompt Engineering (`constants/index.ts`)

Replaced the generic prompt with a production-grade system prompt featuring:

- **Expert Persona**: AI acts as a _"senior career coach and ATS expert with 15+ years of recruiting experience"_ for more authoritative, professional feedback.
- **Precise Scoring Rubric**: 7-band scoring anchors (0–25, 26–45, 46–60, 61–74, 75–85, 86–94, 95–100) prevent the AI from defaulting to the 70–80 range on every resume.
- **Forced Score Differentiation**: Each of the 5 categories (ATS, Tone, Content, Structure, Skills) must have a meaningfully different score — no more all-same outputs.
- **Weighted Overall Score**: `overallScore = ATS (30%) + Content (25%) + Skills (20%) + Structure (15%) + Tone (10%)`.
- **Critical Analysis Rules**:
  - **NO Hallucination**: Only reference facts visible in the resume images.
  - **Cite Specifics**: Feedback must reference actual resume content (e.g., `"Your bullet point 'Worked on backend systems' — rewrite as 'Designed RESTful APIs serving 10K+ daily requests'"`).
  - **Keyword Gap Analysis**: Identify specific missing vs. present keywords from the job description.
  - **Quantification Check**: Flag individual bullet points lacking metrics.
  - **ATS Readability**: Detect tables, text boxes, non-standard headings, and graphics that break ATS parsers.

### 🛡️ 2. Input Validation Guardrails (`constants/index.ts`, `app/routes/upload.tsx`)

- **AI-Level Guard**: If the job description is gibberish or too short (< 10 words), the AI is instructed to set all scores to `0` and return an explanatory tip rather than hallucinating a high score.
- **Client-Side Guard**: The upload form enforces a **minimum 50-character job description** before submission, with a clear error message. The `<textarea>` also has `minLength={50}` and `maxLength={5000}` HTML attributes.
- **PDF-Only Enforcement**: Both on file selection and on form submit, non-PDF files are rejected with an error.

### ✅ 3. AI Response Sanitization (`app/lib/utils.ts`)

Two new utility functions prevent corrupt AI data from reaching the UI:

- **`cleanJson(text)`**: Extracts a valid JSON object from AI responses that may include markdown code fences (` ```json `) or other wrapper text.
- **`validateFeedbackScores(feedback)`**: Clamps all score values to integers between 0 and 100. Prevents `NaN`, `null`, or out-of-range values from the AI from ever being displayed.

### 🗑️ 4. Data Management / Wipe Page (`app/routes/wipe.tsx`)

A full **Settings / Data Management** page was added:

- Lists all files currently stored in the user's Puter cloud storage.
- **Danger Zone**: Requires the user to type `DELETE` in a confirmation input before the wipe button becomes active.
- On confirmation, deletes all stored resume files (`fs.delete`) AND flushes all KV metadata (`kv.flush()`).
- Shows a success state and navigates the user home after wipe.
- Fully protected by auth guard (redirects to `/auth` if not signed in).

### 🧪 5. Unit Tests (`app/lib/utils.test.ts`)

Tests written with **Vitest** covering the core utility functions:
- `cleanJson` — various AI response formats (raw JSON, markdown fences, extra text).
- `validateFeedbackScores` — out-of-range, `NaN`, and float scores.

### 📦 6. Docker Support

A `Dockerfile` and `.dockerignore` were added for containerized deployment.

### 🔗 7. URL Memory Leak Fix (`app/routes/resume.tsx`)

Object URLs created by `URL.createObjectURL()` for resume PDFs and images are now properly revoked via `useEffect` cleanup (`URL.revokeObjectURL`), preventing memory leaks on page navigation.

### 🏷️ 8. SEO Meta Tags

All routes now export proper `meta()` functions with unique `<title>` and `<meta name="description">` tags for better SEO and browser tab clarity.

---

## <a name="quick-start">🤸 Quick Start</a>

**Prerequisites**

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) (v18+)
- [npm](https://www.npmjs.com/)

**Clone the Repository**

```bash
git clone https://github.com/v-tushar/AI_Resume_Analyzer.git
cd AI_Resume_Analyzer
```

**Install Dependencies**

```bash
npm install
```

**Run the Development Server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Run Tests**

```bash
npm run test
```

---

## <a name="project-structure">📁 Project Structure</a>

```
AI_Resume_Analyzer/
├── app/
│   ├── components/         # Reusable UI components (Navbar, ATS, Chatbot, etc.)
│   ├── features/           # Feature-specific logic (jobs, tracker)
│   ├── lib/
│   │   ├── pdf2img.ts      # Client-side PDF → Image conversion
│   │   ├── puter.ts        # Puter.js store (auth, fs, ai, kv)
│   │   ├── utils.ts        # cleanJson, validateFeedbackScores, generateUUID
│   │   └── utils.test.ts   # Vitest unit tests
│   ├── routes/
│   │   ├── auth.tsx        # Authentication page
│   │   ├── home.tsx        # Homepage with resume cards
│   │   ├── upload.tsx      # Upload + analyze form (with guardrails)
│   │   ├── resume.tsx      # Resume review + chatbot page
│   │   └── wipe.tsx        # Data management / wipe page ✨
│   └── stores/             # Zustand global stores
├── constants/
│   └── index.ts            # AI prompt & response format (enhanced) ✨
├── types/                  # Global TypeScript type definitions
├── public/                 # Static assets
├── Dockerfile              # Docker support ✨
└── vitest.config.ts        # Test configuration ✨
```

> Items marked ✨ were added or significantly modified as custom enhancements.

---

## 📄 License

This project is based on the [JavaScript Mastery](https://www.youtube.com/@javascriptmastery) tutorial and is open for personal and educational use.
