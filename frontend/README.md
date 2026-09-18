# ResumeBuddy Frontend

This is the Next.js frontend application for **ResumeBuddy**, an AI-powered resume builder, RAG generator, and ATS analyzer.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom UI components and `@dnd-kit` for drag-and-drop section reordering
- **PDF Compilation**: `react-to-print` for fit-to-page print-to-PDF rendering

## Project Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── dashboard/page.tsx     # Main dashboard hub
│   │   ├── builder/               # Resume Builder routes
│   │   │   ├── page.tsx           # Resume list view
│   │   │   └── [id]/page.tsx      # Drag-and-drop resume editor
│   │   ├── buddy/                 # Knowledge Base & Generator routes
│   │   │   ├── page.tsx           # Knowledge Base manager
│   │   │   └── generate/page.tsx  # Tailored resume generator
│   │   ├── analyzer/page.tsx      # ATS Resume Analyzer dashboard
│   │   ├── login/page.tsx         # User authentication
│   │   └── register/page.tsx      # Account registration
│   ├── components/
│   │   ├── AppNav.tsx             # Main navigation bar
│   │   ├── ResumePreview.tsx      # Resume renderer
│   │   └── resume-templates/     # Resume templates (Classic, Modern, Minimal)
│   └── lib/
│       └── api.ts                 # FastAPI client utilities
```

## Getting Started

First, install dependencies:

```bash
npm install
```

Set up environment variables in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.
