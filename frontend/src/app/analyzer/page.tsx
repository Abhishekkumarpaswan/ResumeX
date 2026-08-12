"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppNav from "@/components/AppNav"
import { Button } from "@/components/ui/button"
import { API_URL, authenticatedFetch } from "@/lib/api"
import {
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Copy,
  ArrowLeft,
  Sparkles,
  Info,
  Check,
  ChevronRight
} from "lucide-react"

// Types matching backend response
interface EssentialSection {
  section: string
  exists: boolean
  details: string
}

interface ContactChecklist {
  has_email: boolean
  has_phone: boolean
  has_linkedin: boolean
  has_github: boolean
}

interface GrammarError {
  type: string
  error: string
  suggestion: string
  context: string
}

interface AnalysisMetrics {
  word_count: number
  estimated_read_time_minutes: number
  action_verbs_count: number
  readability_score: string
  quantification_rate: number
}

interface KeywordTip {
  keyword: string
  section: string
  tip: string
}

interface AnalysisReport {
  ats_score: number
  structure_score: number
  language_score: number
  impact_score: number
  contact_score: number
  keyword_score: number
  essential_sections: EssentialSection[]
  contact_checklist: ContactChecklist
  suggestions: string[]
  mistakes: string[]
  grammar_spelling_errors: GrammarError[]
  metrics: AnalysisMetrics
  matched_keywords: string[]
  missing_keywords: string[]
  missing_keywords_with_tips?: KeywordTip[]
  plain_text: string
}

const ACTION_VERB_BANK = {
  Leadership: ["Spearheaded", "Orchestrated", "Directed", "Chaired", "Guided", "Advocated"],
  "Creation & Engineering": ["Engineered", "Architected", "Pioneered", "Designed", "Formulated", "Authored"],
  "Optimization & Performance": ["Optimized", "Streamlined", "Automated", "Maximized", "Accelerated", "Enhanced"],
  "Problem Solving": ["Resolved", "Overhauled", "Debugging", "Diagnosed", "Corrected", "Reformed"]
}

export default function AnalyzerPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  
  // Input states
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  
  // App states
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState("Preparing...")
  const [errorMsg, setErrorMsg] = useState("")
  const [report, setReport] = useState<AnalysisReport | null>(null)
  
  // UI states
  const [activeTab, setActiveTab] = useState<"report" | "match" | "grammar" | "style" | "text">("report")
  const [copiedVerb, setCopiedVerb] = useState("")
  const [copiedText, setCopiedText] = useState(false)
  const [activeVerbCategory, setActiveVerbCategory] = useState<keyof typeof ACTION_VERB_BANK>("Leadership")

  // Interactive Checklist State
  const [checkedKeywords, setCheckedKeywords] = useState<Record<string, boolean>>({})
  const toggleKeyword = (kw: string) => {
    setCheckedKeywords(prev => ({ ...prev, [kw]: !prev[kw] }))
  }

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (!t) {
      router.push("/login")
      return
    }
    setToken(t)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setErrorMsg("")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0]
      const ext = dropped.name.split(".").pop()?.toLowerCase()
      if (ext === "pdf" || ext === "docx") {
        setFile(dropped)
        setErrorMsg("")
      } else {
        setErrorMsg("Unsupported file type. Please drop a PDF or DOCX file.")
      }
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      setErrorMsg("Please upload a resume file first.")
      return
    }

    setLoading(true)
    setErrorMsg("")
    setReport(null)

    // Simulate phases for feedback
    const phases = [
      "Uploading document...",
      "Extracting text structures...",
      "Analyzing spelling and grammar errors...",
      "Scanning weak vocabulary and passive voice...",
      "Calculating ATS parameters & scoring..."
    ]

    let phaseIndex = 0
    setLoadingPhase(phases[0])
    const interval = setInterval(() => {
      if (phaseIndex < phases.length - 1) {
        phaseIndex++
        setLoadingPhase(phases[phaseIndex])
      }
    }, 1800)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (jobDescription.trim()) {
        formData.append("job_description", jobDescription.trim())
      }

      const res = await fetch(`${API_URL}/resumes/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      clearInterval(interval)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Failed to analyze resume.")
      }

      const data = (await res.json()) as AnalysisReport
      setReport(data)
      // Default to "report" tab, but switch to "match" if JD was provided
      if (jobDescription.trim()) {
        setActiveTab("match")
      } else {
        setActiveTab("report")
      }
    } catch (err: any) {
      clearInterval(interval)
      setErrorMsg(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: "verb" | "raw") => {
    navigator.clipboard.writeText(text)
    if (type === "verb") {
      setCopiedVerb(text)
      setTimeout(() => setCopiedVerb(""), 1500)
    } else {
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500"
    if (score >= 50) return "text-amber-500 stroke-amber-500"
    return "text-red-500 stroke-red-500"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-100"
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-100"
    return "bg-red-50 text-red-700 border-red-100"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 65) return "Good"
    if (score >= 50) return "Needs Review"
    return "Poor Score"
  }

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#16191d] flex flex-col font-sans">
      <AppNav />

      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white border border-[#e3e1da] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#16191d]">
              <div className="h-full bg-[#d7fb3d] animate-pulse" style={{ width: "100%" }} />
            </div>
            
            <div className="w-16 h-16 border-4 border-[#e3e1da] border-t-[#16191d] rounded-full animate-spin mx-auto mb-6" />
            <h3 className="font-bold text-lg text-[#16191d] mb-2">Analyzing Resume</h3>
            <p className="text-sm text-[#6e7682] animate-pulse">{loadingPhase}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 flex flex-col">
        {/* Header section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Resume Analyzer
            </h1>
            <p className="text-sm text-[#6e7682] mt-1">
              Audit formatting, score keywords match, and check spelling issues.
            </p>
          </div>
          {report && (
            <Button
              onClick={() => {
                setReport(null)
                setFile(null)
                setJobDescription("")
              }}
              variant="outline"
              className="flex items-center gap-2 border-[#e3e1da] hover:border-[#16191d]"
            >
              <ArrowLeft className="w-4 h-4" /> New Audit
            </Button>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Input Phase: Upload Form */}
        {!report && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
            {/* Upload Zone */}
            <div className="flex flex-col">
              <label className="text-sm font-bold uppercase tracking-wider text-[#6e7682] mb-3">
                1. Upload Resume
              </label>
              
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`flex-1 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                  file
                    ? "border-[#16191d] bg-white"
                    : "border-[#e3e1da] bg-white hover:border-[#6e7682]"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#fafaf7] flex items-center justify-center text-[#6e7682] mb-4 border border-[#e3e1da]">
                  <Upload className="w-6 h-6" />
                </div>
                
                {file ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-[#16191d]">{file.name}</p>
                    <p className="text-xs text-[#6e7682]">{(file.size / 1024).toFixed(1)} KB · PDF/DOCX</p>
                    <button
                      onClick={() => setFile(null)}
                      className="text-xs text-red-500 font-semibold underline mt-2 inline-block hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-sm text-[#16191d]">
                      Drag and drop your resume file here
                    </p>
                    <p className="text-xs text-[#6e7682] mt-1 mb-4">
                      Supports PDF and Word Document (.docx)
                    </p>
                    <label className="bg-[#16191d] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#2a2d32] cursor-pointer transition-colors">
                      Browse Files
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description Input */}
            <div className="flex flex-col">
              <label className="text-sm font-bold uppercase tracking-wider text-[#6e7682] mb-3 flex items-center justify-between">
                <span>2. Paste Job Description (Optional)</span>
                <span className="text-[10px] bg-[#d7fb3d]/30 text-[#16191d] font-semibold px-2 py-0.5 rounded-full border border-[#d7fb3d]/40">
                  RELEVANCE SCANNER
                </span>
              </label>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here. ResumeX will analyze keyword matches, calculate relevance score, and flag missing keywords..."
                className="flex-1 w-full min-h-[250px] border border-[#e3e1da] rounded-2xl p-5 outline-none focus:border-[#16191d] bg-white resize-none text-sm placeholder-[#6e7682] leading-relaxed transition-colors"
              />
            </div>

            {/* Bottom Button */}
            <div className="lg:col-span-2 pt-4">
              <button
                onClick={handleAnalyze}
                disabled={!file}
                className="w-full bg-[#16191d] text-white rounded-xl py-4 hover:opacity-90 transition-opacity font-bold text-sm tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-[#d7fb3d]" /> Analyze Resume
              </button>
            </div>
          </div>
        )}

        {/* Results Page */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
            {/* Left Column: Summary Dashboard */}
            <div className="lg:col-span-4 space-y-6">
              {/* Score Gauge */}
              <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                <div className="relative w-36 h-36 mb-4">
                  {/* Gauge Ring */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-[#f1f0eb]"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={getScoreColor(report.ats_score)}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * report.ats_score) / 100}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 1s ease-out" }}
                    />
                  </svg>
                  {/* Inside Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-[#16191d]">{report.ats_score}</span>
                    <span className="text-[10px] text-[#6e7682] uppercase tracking-wider font-bold">ATS Score</span>
                  </div>
                </div>
                <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${getScoreBg(report.ats_score)}`}>
                  {getScoreLabel(report.ats_score)}
                </div>

                {/* Score Breakdowns */}
                <div className="w-full mt-6 space-y-3 pt-6 border-t border-[#e3e1da]">
                  <div className="text-[10px] font-bold text-[#6e7682] uppercase tracking-wider text-left mb-2">
                    Score Breakdown
                  </div>
                  {[
                    { label: "Structure", score: report.structure_score, color: "bg-blue-500" },
                    { label: "Language Quality", score: report.language_score, color: "bg-purple-500" },
                    { label: "Impact & Quantification", score: report.impact_score, color: "bg-indigo-500" },
                    { label: "Contact Quality", score: report.contact_score, color: "bg-emerald-500" },
                    { label: "Keyword Match", score: report.keyword_score, color: "bg-pink-500", hide: !jobDescription.trim() }
                  ]
                    .filter(item => !item.hide)
                    .map((item) => (
                      <div key={item.label} className="space-y-1 text-left">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-[#6e7682]">{item.label}</span>
                          <span className="text-[#16191d]">{item.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#f1f0eb] rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Contact Integrity checklist */}
              <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-[#6e7682] uppercase tracking-wider mb-4">
                  Contact Integrity Checklist
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Email Address", val: report.contact_checklist.has_email, details: "Needed for basic applications" },
                    { label: "Phone Number", val: report.contact_checklist.has_phone, details: "Needed for interviews setup" },
                    { label: "LinkedIn Profile", val: report.contact_checklist.has_linkedin, details: " recruiters check LinkedIn" },
                    { label: "GitHub Profile", val: report.contact_checklist.has_github, details: "Important for developers" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between border-b border-[#fafaf7] pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold text-[#16191d]">{item.label}</p>
                        <p className="text-[10px] text-[#6e7682]">{item.details}</p>
                      </div>
                      <div>
                        {item.val ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 fill-amber-50" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Tabs and Reports */}
            <div className="lg:col-span-8 flex flex-col space-y-6">
              {/* Tabs Navigation */}
              <div className="bg-white border border-[#e3e1da] rounded-2xl p-1.5 flex gap-1 shadow-sm overflow-x-auto shrink-0 scrollbar-none">
                {[
                  { id: "report", label: "ATS Report" },
                  { id: "match", label: "Job Match", hide: !jobDescription.trim() },
                  { id: "grammar", label: `Grammar & Typos (${report.grammar_spelling_errors.length})` },
                  { id: "style", label: "Style & Verbs" },
                  { id: "text", label: "ATS Plain Text" }
                ]
                  .filter(tab => !tab.hide)
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-[#16191d] text-white"
                          : "text-[#6e7682] hover:text-[#16191d] hover:bg-[#f1f0eb]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>

              {/* Tab: ATS Report */}
              {activeTab === "report" && (
                <div className="space-y-6">
                  {/* Essential Sections Checklist */}
                  <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#16191d] mb-4">Essential Resume Sections</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {report.essential_sections.map((sect, idx) => (
                        <div
                          key={idx}
                          className={`p-3 border rounded-xl flex items-start gap-3 ${
                            sect.exists
                              ? "bg-emerald-50/30 border-emerald-100"
                              : "bg-red-50/30 border-red-100"
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {sect.exists ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 fill-red-50" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#16191d]">{sect.section}</p>
                            <p className="text-[10px] text-[#6e7682] leading-normal mt-0.5">{sect.details}</p>
                            {!sect.exists && (
                              <button
                                onClick={() => {
                                  if (sect.section === "Projects") router.push("/builder")
                                  else router.push("/dashboard")
                                }}
                                className="text-[10px] text-[#16191d] font-bold hover:underline flex items-center mt-2"
                              >
                                {sect.section === "Projects" ? "⚡ Add Projects in Builder" : "⚡ Update Details"}
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions List */}
                  <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#16191d] mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Key Suggestions for Improvement
                    </h3>
                    <ul className="space-y-3">
                      {report.suggestions.map((sug, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#fafaf7] border border-[#e3e1da] text-[#16191d] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-[#6e7682] leading-relaxed">{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab: Job Match */}
              {activeTab === "match" && (
                <div className="space-y-6">
                  {/* Job Match Score Info */}
                  <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 text-2xl font-bold shrink-0">
                        {report.keyword_score}%
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#16191d]">Job Relevance Match</h3>
                        <p className="text-xs text-[#6e7682] mt-1 leading-relaxed">
                          Your resume overlaps with {report.keyword_score}% of key skills and terminology extracted from the target job description. Add missing keywords to increase relevance.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Keyword Lists */}
                  <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm">
                    <div className="space-y-6">
                      {/* Matched */}
                      <div>
                        <h4 className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Matched Keywords ({report.matched_keywords.length})
                        </h4>
                        {report.matched_keywords.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {report.matched_keywords.map((kw, idx) => (
                              <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-1 text-xs font-medium">
                                {kw}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#6e7682]">No direct keyword matches found. Ensure your technical skills are listed explicitly.</p>
                        )}
                      </div>

                      {/* Missing */}
                      <div className="pt-4 border-t border-[#f1f0eb]">
                        <h4 className="text-xs font-bold text-red-600 mb-3 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> Missing Keywords Checklist ({report.missing_keywords.length})
                        </h4>
                        {report.missing_keywords.length > 0 ? (
                          <div className="space-y-3 mt-4">
                            {report.missing_keywords_with_tips && report.missing_keywords_with_tips.length > 0 ? (
                              report.missing_keywords_with_tips.map((item, idx) => {
                                const isChecked = !!checkedKeywords[item.keyword];
                                return (
                                  <div 
                                    key={idx} 
                                    className={`border rounded-xl p-4 transition-all duration-200 ${
                                      isChecked 
                                        ? "bg-slate-50 border-slate-200 opacity-60" 
                                        : "bg-white border-[#e3e1da] shadow-sm hover:border-[#16191d]"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <input 
                                        type="checkbox" 
                                        id={`kw-${idx}`}
                                        checked={isChecked}
                                        onChange={() => toggleKeyword(item.keyword)}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <label 
                                            htmlFor={`kw-${idx}`}
                                            className={`text-sm font-semibold cursor-pointer ${
                                              isChecked ? "line-through text-[#6e7682]" : "text-[#16191d]"
                                            }`}
                                          >
                                            {item.keyword}
                                          </label>
                                          <span className="bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-2 py-0.5 text-[10px] font-bold">
                                            {item.section}
                                          </span>
                                        </div>
                                        <p className={`text-xs mt-1.5 leading-relaxed ${isChecked ? "text-[#989790]" : "text-[#6e7682]"}`}>
                                          {item.tip}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {report.missing_keywords.map((kw, idx) => (
                                  <span key={idx} className="bg-[#f1f0eb] text-[#6e7682] border border-[#e3e1da] rounded-full px-2.5 py-1 text-xs font-medium">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-600 font-medium">Excellent! All key skills from the job description are matched in your resume.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Grammar & Typos */}
              {activeTab === "grammar" && (
                <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-[#16191d] mb-4">Grammar & Spelling Audit</h3>
                  {report.grammar_spelling_errors.length > 0 ? (
                    <div className="space-y-4">
                      {report.grammar_spelling_errors.map((err, idx) => (
                        <div key={idx} className="p-4 border border-[#e3e1da] rounded-xl space-y-2 bg-[#fafaf7]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-red-600 uppercase bg-red-50 border border-red-100 rounded px-2 py-0.5">
                              {err.type} error
                            </span>
                            <span className="text-xs text-[#6e7682]">
                              Replace: <span className="font-bold text-red-600 line-through">{err.error}</span> →{" "}
                              <span className="font-bold text-emerald-600">{err.suggestion}</span>
                            </span>
                          </div>
                          
                          <div className="text-xs text-[#6e7682] italic leading-relaxed">
                            Context: <span dangerouslySetInnerHTML={{
                              __html: err.context.replace(new RegExp(`(${err.error})`, 'gi'), `<strong class="text-[#16191d] bg-[#d7fb3d]/30 px-1 rounded">$1</strong>`)
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-[#16191d] text-sm">No Typos Found</h4>
                      <p className="text-xs text-[#6e7682] mt-1">Spelling and grammar formatting checks passed successfully.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Style & Verbs */}
              {activeTab === "style" && (
                <div className="space-y-6">
                  {/* Quantification & Action Words metrics */}
                  <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#6e7682] uppercase tracking-wider">Quantified Bullets</p>
                      <p className="text-2xl font-bold text-[#16191d]">{report.metrics.quantification_rate}%</p>
                      <p className="text-[10px] text-[#6e7682]">Bullets containing metrics</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#6e7682] uppercase tracking-wider">Word Count</p>
                      <p className="text-2xl font-bold text-[#16191d]">{report.metrics.word_count}</p>
                      <p className="text-[10px] text-[#6e7682]">Target: 350-800 words</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[#6e7682] uppercase tracking-wider">Action Verbs Found</p>
                      <p className="text-2xl font-bold text-[#16191d]">{report.metrics.action_verbs_count}</p>
                      <p className="text-[10px] text-[#6e7682]">Strong active terms</p>
                    </div>
                  </div>

                  {/* Passive Mistakes */}
                  <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#16191d] mb-4">Passive Language & Weak Phrases</h3>
                    {report.mistakes.length > 0 ? (
                      <ul className="space-y-3">
                        {report.mistakes.map((mis, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs text-[#6e7682] leading-relaxed">
                            <span className="shrink-0 mt-0.5 text-amber-500">⚠</span>
                            <span>{mis}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Strong active wording detected throughout the document.
                      </p>
                    )}
                  </div>

                  {/* Action Verbs Word Bank */}
                  <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#16191d]">Action Verb Word Bank</h3>
                      <span className="text-[10px] text-[#6e7682]">Click tags to copy</span>
                    </div>
                    <p className="text-xs text-[#6e7682] mb-4 leading-relaxed">
                      Replace passive descriptions with these industry-accepted strong verbs to increase impact.
                    </p>

                    {/* Word Bank Navigation */}
                    <div className="flex flex-wrap gap-1 border-b border-[#fafaf7] pb-3 mb-4">
                      {Object.keys(ACTION_VERB_BANK).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveVerbCategory(cat as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            activeVerbCategory === cat
                              ? "bg-[#fafaf7] border border-[#e3e1da] text-[#16191d]"
                              : "text-[#6e7682] hover:text-[#16191d]"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Tags Grid */}
                    <div className="flex flex-wrap gap-2">
                      {ACTION_VERB_BANK[activeVerbCategory].map((verb) => (
                        <button
                          key={verb}
                          onClick={() => copyToClipboard(verb, "verb")}
                          className="px-3 py-1.5 text-xs bg-[#fafaf7] hover:bg-[#16191d] hover:text-white border border-[#e3e1da] rounded-xl flex items-center gap-1.5 transition-colors group"
                        >
                          <span>{verb}</span>
                          <span className="text-[9px] text-[#6e7682] group-hover:text-white">
                            {copiedVerb === verb ? "Copied!" : <Copy className="w-3 h-3" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Plain Text */}
              {activeTab === "text" && (
                <div className="bg-white border border-[#e3e1da] rounded-2xl p-6 shadow-sm flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#16191d]">ATS Plain Text View</h3>
                      <p className="text-xs text-[#6e7682] mt-0.5">
                        This block displays the raw text parsed from the resume file.
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(report.plain_text, "raw")}
                      className="px-3 py-1.5 border border-[#e3e1da] hover:border-[#16191d] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedText ? "Copied!" : <><Copy className="w-3.5 h-3.5" /> Copy Text</>}
                    </button>
                  </div>

                  <div className="bg-[#fafaf7] border border-[#e3e1da] rounded-xl p-4 overflow-auto max-h-[400px] scrollbar-thin">
                    <pre className="text-[11px] font-mono text-[#6e7682] leading-relaxed whitespace-pre-wrap select-text">
                      {report.plain_text}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
