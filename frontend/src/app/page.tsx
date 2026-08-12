"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

function ScannerAnimation() {
  const [score, setScore] = useState(0)
  const [scanLine, setScanLine] = useState(0)
  const [highlighted, setHighlighted] = useState<number[]>([])
  const [flagged, setFlagged] = useState<number[]>([])

  const keywords = [
    { text: "Python", match: true },
    { text: "FastAPI", match: true },
    { text: "PostgreSQL", match: true },
    { text: "React", match: true },
    { text: "Kubernetes", match: false },
    { text: "TypeScript", match: true },
    { text: "MLOps", match: false },
    { text: "Docker", match: true },
  ]

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < keywords.length) {
        setScanLine(i)
        if (keywords[i].match) {
          setHighlighted(prev => [...prev, i])
          setScore(prev => Math.min(prev + 11, 87))
        } else {
          setFlagged(prev => [...prev, i])
        }
        i++
      } else {
        i = 0
        setHighlighted([])
        setFlagged([])
        setScore(0)
        setScanLine(0)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative bg-white border border-[#e3e1da] rounded-2xl shadow-xl p-6 w-full max-w-sm">
      <div className="absolute -top-4 -right-4 bg-[#16191d] text-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg">
        <span className="font-mono text-xs text-[#6e7682] uppercase tracking-wider">ATS_SCORE</span>
        <span className="font-bold text-[#d7fb3d] text-lg">{score}%</span>
      </div>
      <div className="mb-4 pb-3 border-b border-[#e3e1da]">
        <div className="h-4 w-32 bg-[#16191d] rounded mb-2" />
        <div className="h-2.5 w-48 bg-[#e3e1da] rounded mb-1" />
        <div className="h-2.5 w-40 bg-[#e3e1da] rounded" />
      </div>
      <div className="mb-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#6e7682] mb-2">Skills</div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <span
              key={i}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${highlighted.includes(i)
                  ? "bg-[#d7fb3d] text-[#16191d]"
                  : flagged.includes(i)
                    ? "bg-[#ff6b47]/20 text-[#ff6b47] border border-[#ff6b47]/30"
                    : i === scanLine
                      ? "bg-[#f1f0eb] text-[#16191d] scale-105"
                      : "bg-[#f1f0eb] text-[#6e7682]"
                }`}
            >
              {kw.text}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-1.5 mt-4">
        {[80, 60, 72, 50, 65].map((w, i) => (
          <div key={i} className="h-2 bg-[#f1f0eb] rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="flex gap-4 mt-4 pt-3 border-t border-[#e3e1da]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[#d7fb3d]" />
          <span className="text-[10px] text-[#6e7682]">Matched</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-[#ff6b47]/30 border border-[#ff6b47]/50" />
          <span className="text-[10px] text-[#6e7682]">Missing</span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#16191d]">

      {/* Nav */}
      <nav className="border-b border-[#e3e1da] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          ResumeX
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#6e7682] hover:text-[#16191d] transition-colors px-3 py-1.5">
            Login
          </Link>
          <Link href="/login" className="text-sm bg-[#16191d] text-white px-4 py-2 rounded-lg hover:bg-[#2a2d32] transition-colors font-medium">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-[#d7fb3d]/20 border border-[#d7fb3d]/40 rounded-full px-3 py-1 mb-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#16191d]">ATS-Optimized</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-[#16191d]" style={{ fontFamily: "var(--font-display)" }}>
            Stop rewriting your resume for every job.
          </h1>
          <p className="text-lg text-[#6e7682] mb-8 leading-relaxed max-w-lg">
            Store your projects and skills once — ResumeX builds and tailors a resume for each job description automatically.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/login" className="bg-[#16191d] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2a2d32] transition-colors">
              Get Started Free
            </Link>
            <Link href="/login" className="border border-[#e3e1da] text-[#16191d] px-6 py-3 rounded-xl font-medium hover:border-[#6e7682] transition-colors">
              Login
            </Link>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <ScannerAnimation />
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[#e3e1da]">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#6e7682] mb-8">What you get</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "01", title: "Resume Builder", desc: "Create ATS-friendly resumes using professional templates with a live side-by-side preview." },
            { label: "02", title: "Resume Buddy", desc: "Store your career data once. Paste any job description and get a tailored resume assembled automatically." },
            { label: "03", title: "Resume Analyzer", desc: "Upload your resume to get an instant ATS audit, structural checks, weak verb flagging, and target job keyword matching." },
          ].map((m) => (
            <div key={m.label} className="bg-white border border-[#e3e1da] rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="text-xs font-mono font-bold mb-4 w-8 h-8 rounded-lg flex items-center justify-center bg-[#d7fb3d] text-[#16191d]">
                {m.label}
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#16191d]" style={{ fontFamily: "var(--font-display)" }}>{m.title}</h3>
              <p className="text-sm text-[#6e7682] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[#e3e1da]">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#6e7682] mb-8">How it works</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Build your knowledge base", desc: "Add your projects, skills, experience, and certifications once. ResumeX stores everything permanently." },
            { step: "2", title: "Paste a job description", desc: "Drop in any job posting. ResumeX extracts the required skills, keywords, and domain information." },
            { step: "3", title: "Get a tailored resume", desc: "ResumeX ranks your stored content by relevance and assembles the perfect resume automatically." },
          ].map((s, i) => (
            <div key={i} className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#16191d] text-white flex items-center justify-center text-sm font-bold">{s.step}</div>
              <div>
                <h3 className="font-bold text-[#16191d] mb-1" style={{ fontFamily: "var(--font-display)" }}>{s.title}</h3>
                <p className="text-sm text-[#6e7682] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[#e3e1da]">
        <div className="bg-[#16191d] rounded-2xl px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Ready to land your next job?
          </h2>
          <p className="text-[#6e7682] mb-8 max-w-md mx-auto">
            Join thousands of candidates who use ResumeX to get past the ATS and into the interview room.
          </p>
          <Link href="/login" className="inline-block bg-[#d7fb3d] text-[#16191d] px-8 py-3 rounded-xl font-bold hover:bg-[#c8f020] transition-colors">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e3e1da] px-6 py-8 max-w-6xl mx-auto flex items-center justify-between">
        <span className="font-bold text-[#16191d]" style={{ fontFamily: "var(--font-display)" }}>ResumeX</span>
        <p className="text-sm text-[#6e7682]">Built for the ATS era.</p>
      </footer>

    </div>
  )
}