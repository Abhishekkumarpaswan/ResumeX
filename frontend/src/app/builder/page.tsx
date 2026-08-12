"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import AppNav from "@/components/AppNav"
import { API_URL, authenticatedFetch } from "@/lib/api"

interface Resume {
  id: number
  title: string
  template: string
  created_at: string
}

export default function BuilderPage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [token, setToken] = useState("")

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (!t) {
      router.push("/login")
      return
    }
    setToken(t)
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    const res = await authenticatedFetch("/resumes/")
    const data = await res.json()
    setResumes(data)
  }

  const createResume = async () => {
    const res = await authenticatedFetch("/resumes/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled Resume",
        template: "classic",
        content: {}
      })
    })
    const data = await res.json()
    router.push(`/builder/${data.id}`)
  }

  const deleteResume = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm("Delete this resume?")) return
    await authenticatedFetch(`/resumes/${id}`, {
      method: "DELETE"
    })
    fetchResumes()
  }

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <AppNav />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[#6e7682] mb-2">Resume Builder</p>
            <h2
              className="text-3xl font-bold text-[#16191d]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              My Resumes
            </h2>
          </div>
          <Button
            onClick={createResume}
            className="bg-[#16191d] text-white hover:bg-[#2a2d32] rounded-xl"
          >
            + New Resume
          </Button>
        </div>

        {resumes.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#e3e1da] rounded-2xl bg-white">
            <p className="text-[#6e7682] mb-4">No resumes yet</p>
            <Button
              onClick={createResume}
              className="bg-[#16191d] text-white hover:bg-[#2a2d32] rounded-xl"
            >
              Create your first resume
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white border border-[#e3e1da] rounded-2xl p-6 hover:shadow-md cursor-pointer relative transition-all hover:border-[#6e7682] group"
                onClick={() => router.push(`/builder/${resume.id}`)}
              >
                <div className="w-8 h-8 rounded-lg bg-[#f1f0eb] flex items-center justify-center mb-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6e7682" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <h3
                  className="font-bold text-[#16191d] mb-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {resume.title}
                </h3>
                <p className="text-xs text-[#6e7682] mb-1 capitalize">{resume.template} template</p>
                <p className="text-xs text-[#6e7682]">
                  {new Date(resume.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={(e) => deleteResume(e, resume.id)}
                  className="absolute top-4 right-4 text-[#e3e1da] hover:text-[#ff6b47] text-xl transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}