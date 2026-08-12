"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"

interface TokenPayload {
  sub: string
  email: string
  name: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    const decoded = jwtDecode<TokenPayload>(token)
    setUserName(decoded.name)
    setUserEmail(decoded.email)
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 17) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* Navbar */}
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <span className="text-lg font-bold text-gray-900">ResumeX</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
            {userName?.charAt(0)?.toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-12">

        {/* Hero greeting */}
        <div className="mb-12">
          <p className="text-sm text-gray-400 mb-1 uppercase tracking-widest">{greeting}</p>
          <h1 className="text-4xl font-bold text-gray-900">{userName?.split(" ")[0]},</h1>
          <p className="text-xl text-gray-400 mt-1">what are we building today?</p>
        </div>

        {/* Main 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* Resume Builder */}
          <div
            onClick={() => router.push("/builder")}
            className="group relative bg-white border border-gray-200 rounded-2xl p-7 cursor-pointer hover:border-gray-900 hover:shadow-lg transition-all duration-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-3xl mb-5">📄</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Resume Builder</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Build ATS-friendly resumes with live preview, multiple templates, and PDF export.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 bg-gray-50 border rounded-full px-3 py-1">3 templates</span>
                <span className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all text-lg">→</span>
              </div>
            </div>
          </div>

          {/* Resume Buddy */}
          <div
            onClick={() => router.push("/buddy")}
            className="group relative bg-gray-900 border border-gray-900 rounded-2xl p-7 cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-bl-full" />
            <div className="relative">
              <div className="text-3xl mb-5">⚡</div>
              <h2 className="text-lg font-bold text-white mb-2">Resume Buddy</h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Store your career data once. Paste any job description and get a tailored resume in seconds.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded-full px-3 py-1">Hybrid RAG · AI</span>
                <span className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all text-lg">→</span>
              </div>
            </div>
          </div>

          {/* Resume Analyzer */}
          <div
            onClick={() => router.push("/analyzer")}
            className="group relative bg-white border border-gray-200 rounded-2xl p-7 cursor-pointer hover:border-gray-900 hover:shadow-lg transition-all duration-200 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-3xl mb-5">🔍</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Resume Analyzer</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Get an ATS score audit, identify grammatical/spelling errors, and scan missing keywords against a job description.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded-full px-3 py-1">ATS Matcher</span>
                <span className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all text-lg">→</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom strip — generate shortcut */}
        <div
          onClick={() => router.push("/buddy/generate")}
          className="group bg-white border border-gray-200 rounded-2xl px-7 py-5 flex items-center justify-between cursor-pointer hover:border-gray-900 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white text-lg">⚡</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Generate a resume now</p>
              <p className="text-xs text-gray-400 mt-0.5">Paste a job description → get a tailored resume instantly</p>
            </div>
          </div>
          <span className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all text-xl">→</span>
        </div>

      </main>
    </div>
  )
}