"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useReactToPrint } from "react-to-print"
import ResumePreview from "@/components/ResumePreview"
import AppNav from "@/components/AppNav"
import { RESUME_TEMPLATES } from "@/components/resume-templates"
import { API_URL, authenticatedFetch } from "@/lib/api"

export default function BuddyGeneratePage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [jd, setJd] = useState("")
  const [template, setTemplate] = useState("classic")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [resumeContent, setResumeContent] = useState<any>(null)
  const [rankingInfo, setRankingInfo] = useState<any>(null)
  const [error, setError] = useState("")
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste")
  const [fileName, setFileName] = useState("")
  const [extracting, setExtracting] = useState(false)

  // --- Project swap state ---
  const [allRankedProjects, setAllRankedProjects] = useState<any[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([])
  const [swapSlotIndex, setSwapSlotIndex] = useState<number | null>(null)

  // --- Print / fit-to-one-page state ---
  // A4 at 96dpi. Change to 816 x 1056 if you want US Letter instead.
  const PAGE_WIDTH_PX = 794
  const PAGE_HEIGHT_PX = 1123
  const MIN_SCALE = 0.5
  const MAX_SCALE = 2

  const printPageRef = useRef<HTMLDivElement>(null)      // fixed A4-size box that gets printed
  const printContentRef = useRef<HTMLDivElement>(null)   // the scaled resume content inside it
  const [printWidth, setPrintWidth] = useState(PAGE_WIDTH_PX)
  const [printScale, setPrintScale] = useState(1)

  const previewRef = useRef<HTMLDivElement>(null)        // on-screen scrollable preview only (not printed)

  // Measures the resume's natural height and computes a scale so it fills
  // exactly one page (shrinks if too long, grows if too short).
  const computeFitScale = () => {
    const node = printContentRef.current
    if (!node) return

    // Pass 1: measure at full page width, no scale
    node.style.width = `${PAGE_WIDTH_PX}px`
    node.style.transform = "none"
    const naturalHeight = node.scrollHeight
    let scale = PAGE_HEIGHT_PX / naturalHeight
    scale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE)

    // Pass 2: re-measure after compensating width (text reflows at new width)
    const compensatedWidth = PAGE_WIDTH_PX / scale
    node.style.width = `${compensatedWidth}px`
    const reflowedHeight = node.scrollHeight
    let finalScale = PAGE_HEIGHT_PX / reflowedHeight
    finalScale = Math.min(Math.max(finalScale, MIN_SCALE), MAX_SCALE)

    setPrintWidth(PAGE_WIDTH_PX / finalScale)
    setPrintScale(finalScale)
  }

  const handlePrint = useReactToPrint({
    contentRef: printPageRef,
    documentTitle: "Generated Resume",
    pageStyle: `@page { size: A4; margin: 0; }`,
    onBeforePrint: async () => {
      computeFitScale()
      // give React a moment to re-render with the new scale before printing
      await new Promise((resolve) => setTimeout(resolve, 120))
    },
  })

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (!t) { router.push("/login"); return }
    setToken(t)
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    const res = await authenticatedFetch("/buddy/status")
    const data = await res.json()
    setStatus(data)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError("")
    setExtracting(true)
    setJd("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await authenticatedFetch("/buddy/extract-jd", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.detail) setError(data.detail)
      else setJd(data.text || "")
    } catch {
      setError("Failed to extract text. Please try pasting instead.")
    }
    setExtracting(false)
  }

  const generate = async () => {
    if (!jd.trim()) { setError("Please paste or upload a job description"); return }
    setError("")
    setLoading(true)
    setSwapSlotIndex(null)
    try {
      const res = await authenticatedFetch("/buddy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jd, template })
      })
      const data = await res.json()
      if (data.detail) {
        setError(data.detail)
      } else {
        setResumeContent(data.resume_content)
        setRankingInfo(data.ranking_info)
        const ranked = data.all_ranked_projects || []
        setAllRankedProjects(ranked)
        setSelectedProjectIds(ranked.slice(0, 3).map((p: any) => p.id))
      }
    } catch {
      setError("Something went wrong. Please try again.")
    }
    setLoading(false)
  }

  // Rebuild resumeContent.projects whenever selectedProjectIds changes
  const projectToResumeFormat = (p: any) => ({
    title: p.title,
    description: p.description || "",
    technologies: p.technologies || "",
    link: ""
  })

  const swapProject = (slotIndex: number, newProjectId: number) => {
    setSelectedProjectIds(prev => {
      const updated = [...prev]
      updated[slotIndex] = newProjectId
      return updated
    })
    setSwapSlotIndex(null)
  }

  useEffect(() => {
    if (!resumeContent || allRankedProjects.length === 0) return
    const selectedProjects = selectedProjectIds
      .map(id => allRankedProjects.find(p => p.id === id))
      .filter(Boolean)
      .map(projectToResumeFormat)

    setResumeContent((prev: any) => ({
      ...prev,
      projects: selectedProjects
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectIds])

  const availableForSlot = (slotIndex: number) => {
    // Projects not currently selected in OTHER slots
    const otherSelected = selectedProjectIds.filter((_, i) => i !== slotIndex)
    return allRankedProjects.filter(p => !otherSelected.includes(p.id))
  }

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <AppNav />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-[#6e7682] mb-2">Resume Buddy</p>
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-bold text-[#16191d]" style={{ fontFamily: "var(--font-display)" }}>
              Generate Resume
            </h2>
            <button
              onClick={() => router.push("/buddy")}
              className="text-sm border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors text-[#6e7682]"
            >
              ← Knowledge Base
            </button>
          </div>
          <p className="text-[#6e7682] text-sm mt-1">Paste or upload a job description and we'll build the perfect resume from your knowledge base.</p>
        </div>

        {/* KB Status */}
        {status && (
          <div className={`border rounded-2xl p-4 mb-8 ${status.ready ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-semibold ${status.ready ? "text-green-700" : "text-yellow-700"}`}>
                {status.ready ? "✅ Knowledge Base Ready" : "⚠️ Knowledge Base Incomplete"}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-[#6e7682] flex-wrap">
              <span className={status.personal ? "text-green-600" : "text-red-500"}>{status.personal ? "✓" : "✗"} Personal Info</span>
              <span className={status.education_count >= 1 ? "text-green-600" : "text-red-500"}>{status.education_count >= 1 ? "✓" : "✗"} Education ({status.education_count})</span>
              <span className={status.projects_count >= 2 ? "text-green-600" : "text-red-500"}>{status.projects_count >= 2 ? "✓" : "✗"} Projects ({status.projects_count}/2 min)</span>
              <span className={status.skills_count >= 3 ? "text-green-600" : "text-red-500"}>{status.skills_count >= 3 ? "✓" : "✗"} Skills ({status.skills_count}/3 min)</span>
            </div>
            {!status.ready && (
              <button onClick={() => router.push("/buddy")}
                className="mt-3 text-sm border border-yellow-300 px-3 py-1.5 rounded-lg text-yellow-700 hover:bg-yellow-100 transition-colors">
                Complete Knowledge Base →
              </button>
            )}
          </div>
        )}

        <div className={`grid gap-6 ${resumeContent ? "grid-cols-2" : "grid-cols-1 max-w-2xl"}`}>

          {/* Left: Input + Project Selection */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#16191d]">Job Description</label>
                <div className="flex gap-1 bg-[#f1f0eb] rounded-lg p-1">
                  <button onClick={() => { setInputMode("paste"); setError("") }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${inputMode === "paste" ? "bg-white text-[#16191d] shadow-sm" : "text-[#6e7682]"}`}>
                    Paste Text
                  </button>
                  <button onClick={() => { setInputMode("upload"); setError("") }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${inputMode === "upload" ? "bg-white text-[#16191d] shadow-sm" : "text-[#6e7682]"}`}>
                    Upload File
                  </button>
                </div>
              </div>

              {inputMode === "paste" ? (
                <textarea value={jd} onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={12}
                  className="w-full px-3 py-2 border border-[#e3e1da] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16191d] resize-none bg-white" />
              ) : (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#e3e1da] rounded-xl py-8 cursor-pointer hover:border-[#6e7682] transition-colors bg-white">
                    <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
                    <span className="text-sm text-[#6e7682] font-medium">
                      {extracting ? "Extracting text..." : fileName || "Click to upload PDF or DOCX"}
                    </span>
                    <span className="text-xs text-[#6e7682] mt-1">Job description file</span>
                  </label>
                  {jd && !extracting && (
                    <div>
                      <label className="text-xs font-medium text-[#6e7682] mb-1 block">Extracted text (you can edit)</label>
                      <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={8}
                        className="w-full px-3 py-2 border border-[#e3e1da] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16191d] resize-none bg-white" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-[#16191d] mb-2 block">Template</label>
              <select value={template} onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-[#e3e1da] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#16191d] bg-white">
                {RESUME_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button
              onClick={generate}
              disabled={loading || extracting || !status?.ready}
              className="w-full bg-[#16191d] text-white py-3 rounded-xl font-medium hover:bg-[#2a2d32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Resume"}
            </button>

            {rankingInfo && (
              <div className="bg-[#f1f0eb] border border-[#e3e1da] rounded-xl p-4 text-xs text-[#6e7682] space-y-1">
                <p className="font-semibold text-[#16191d] mb-2">Selected from your knowledge base:</p>
                <p>📁 Projects: {rankingInfo.projects_selected}</p>
                <p>💼 Experience: {rankingInfo.experience_selected}</p>
                <p>🏆 Certifications: {rankingInfo.certifications_selected}</p>
                <p>⭐ Achievements: {rankingInfo.achievements_selected}</p>
                <p>🛠 Skills: {rankingInfo.skills_selected}</p>
              </div>
            )}

            {/* --- Project Selection Panel --- */}
            {allRankedProjects.length > 0 && (
              <div className="bg-white border border-[#e3e1da] rounded-xl p-4">
                <p className="font-semibold text-[#16191d] text-sm mb-3">Projects in Resume</p>
                <div className="space-y-2">
                  {selectedProjectIds.map((pid, slotIndex) => {
                    const project = allRankedProjects.find(p => p.id === pid)
                    if (!project) return null
                    return (
                      <div key={slotIndex} className="border border-[#e3e1da] rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#16191d] truncate">{project.title}</p>
                            <p className="text-xs text-[#6e7682] truncate">{project.technologies}</p>
                          </div>
                          <button
                            onClick={() => setSwapSlotIndex(swapSlotIndex === slotIndex ? null : slotIndex)}
                            className="text-xs border border-[#e3e1da] px-2 py-1 rounded-lg hover:border-[#6e7682] text-[#6e7682] transition-colors flex-shrink-0 ml-2"
                          >
                            {swapSlotIndex === slotIndex ? "Cancel" : "⇄ Change"}
                          </button>
                        </div>

                        {/* Swap picker */}
                        {swapSlotIndex === slotIndex && (
                          <div className="mt-3 pt-3 border-t border-[#e3e1da] space-y-1.5">
                            <p className="text-xs text-[#6e7682] mb-2">Choose a replacement:</p>
                            {availableForSlot(slotIndex).map((alt) => (
                              <button
                                key={alt.id}
                                onClick={() => swapProject(slotIndex, alt.id)}
                                disabled={alt.id === pid}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${alt.id === pid
                                  ? "bg-[#f1f0eb] text-[#16191d] font-medium cursor-default"
                                  : "hover:bg-[#f1f0eb] text-[#6e7682]"
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{alt.title}</span>
                                  <span className="text-[10px] text-[#6e7682] ml-2 flex-shrink-0">
                                    score {alt.score}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          {resumeContent && (
            <div className="border border-[#e3e1da] rounded-2xl overflow-hidden">
              <div className="bg-[#f1f0eb] border-b border-[#e3e1da] px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-[#6e7682] font-medium uppercase tracking-wider">Generated Resume</span>
                <button onClick={() => handlePrint()}
                  className="text-sm border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors text-[#6e7682] bg-white">
                  Download PDF
                </button>
              </div>
              <div className="overflow-y-auto max-h-[800px]">
                <div ref={previewRef}>
                  <ResumePreview content={resumeContent} templateId={template} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/*
          Hidden fit-to-one-page print target.
          This is a separate copy of the resume, rendered off-screen at a fixed
          A4 page size. computeFitScale() measures its natural height and applies
          a compensating width + transform scale so the content shrinks (long
          resumes) or grows (short resumes) to fill exactly one page. The visible
          preview above is never touched, so on-screen editing stays unaffected.
        */}
        {resumeContent && (
          <div style={{ position: "fixed", top: 0, left: "-9999px", zIndex: -1 }} aria-hidden="true">
            <div
              ref={printPageRef}
              style={{
                width: PAGE_WIDTH_PX,
                height: PAGE_HEIGHT_PX,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                ref={printContentRef}
                style={{
                  width: printWidth,
                  transform: `scale(${printScale})`,
                  transformOrigin: "top left",
                }}
              >
                <ResumePreview content={resumeContent} templateId={template} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}