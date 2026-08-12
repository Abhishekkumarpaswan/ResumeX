"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import ResumePreview from "@/components/ResumePreview"
import AppNav from "@/components/AppNav"
import { useReactToPrint } from "react-to-print"
import { RESUME_TEMPLATES } from "@/components/resume-templates"
import { API_URL, authenticatedFetch } from "@/lib/api"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface ResumeContent {
  personal: {
    name: string
    email: string
    phone: string
    location: string
    linkedin: string
    github: string
    summary: string
  }
  experience: {
    company: string
    role: string
    startDate: string
    endDate: string
    description: string
  }[]
  projects: {
    title: string
    description: string
    technologies: string
    link: string
  }[]
  skills: {
    technical: string[]
    frameworks: string[]
    concepts: string[]
    soft: string[]
  }
  education: {
    school: string
    degree: string
    field: string
    startYear: string
    endYear: string
  }[]
  certifications: {
    name: string
    issuer: string
    date: string
    link: string
  }[]
  extracurricular: {
    title: string
    organization: string
    date: string
    description: string
  }[]
}

const defaultContent: ResumeContent = {
  personal: { name: "", email: "", phone: "", location: "", linkedin: "", github: "", summary: "" },
  experience: [],
  projects: [],
  skills: { technical: [], frameworks: [], concepts: [], soft: [] },
  education: [],
  certifications: [],
  extracurricular: []
}

const defaultSectionOrder = ["personal", "education", "experience", "projects", "skills", "certifications", "extracurricular"]

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="mb-6" suppressHydrationWarning>
      <div className="flex items-center gap-2 mb-1">
        <button
          {...attributes}
          {...listeners}
          className="text-[#e3e1da] hover:text-[#6e7682] cursor-grab active:cursor-grabbing px-1"
          title="Drag to reorder"
          suppressHydrationWarning
        >
          ⠿
        </button>
        <span className="text-xs text-[#6e7682] uppercase tracking-wider font-medium font-mono">
          {id === "personal" ? "Personal Info" : id === "extracurricular" ? "Extracurricular" : id.charAt(0).toUpperCase() + id.slice(1)}
        </span>
      </div>
      {children}
    </div>
  )
}

export default function ResumeEditorPage() {
  const router = useRouter()
  const params = useParams()
  const [content, setContent] = useState<ResumeContent>(defaultContent)
  const [title, setTitle] = useState("")
  const [token, setToken] = useState("")
  const [saved, setSaved] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultSectionOrder)
  const [template, setTemplate] = useState("classic")
  const [skillInputs, setSkillInputs] = useState({ technical: "", frameworks: "", concepts: "", soft: "" })

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

  const previewRef = useRef<HTMLDivElement>(null)        // on-screen preview only (not printed)

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
    documentTitle: title || "Resume",
    pageStyle: `@page { size: A4; margin: 0; }`,
    onBeforePrint: async () => {
      computeFitScale()
      // give React a moment to re-render with the new scale before printing
      await new Promise((resolve) => setTimeout(resolve, 120))
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (!t) { router.push("/login"); return }
    setToken(t)
    fetchResume()
  }, [])

  const fetchResume = async () => {
    const res = await authenticatedFetch(`/resumes/${params.id}`)
    const data = await res.json()
    setTitle(data.title)
    setTemplate(data.template || "classic")
    setContent({
      personal: {
        name: data.content?.personal?.name || "",
        email: data.content?.personal?.email || "",
        phone: data.content?.personal?.phone || "",
        location: data.content?.personal?.location || "",
        linkedin: data.content?.personal?.linkedin || "",
        github: data.content?.personal?.github || "",
        summary: data.content?.personal?.summary || ""
      },
      experience: data.content?.experience || [],
      projects: data.content?.projects || [],
      skills: {
        technical: data.content?.skills?.technical || [],
        frameworks: data.content?.skills?.frameworks || [],
        concepts: data.content?.skills?.concepts || [],
        soft: data.content?.skills?.soft || []
      },
      education: data.content?.education || [],
      certifications: data.content?.certifications || [],
      extracurricular: data.content?.extracurricular || []
    })
    if (data.content?.sectionOrder) setSectionOrder(data.content.sectionOrder)
  }

  const saveResume = async () => {
    await authenticatedFetch(`/resumes/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, template, content: { ...content, sectionOrder } })
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const updatePersonal = (field: string, value: string) => {
    setContent(prev => ({ ...prev, personal: { ...prev.personal, [field]: value } }))
  }

  const addSkill = (category: keyof ResumeContent["skills"]) => {
    if (!skillInputs[category].trim()) return
    setContent(prev => ({ ...prev, skills: { ...prev.skills, [category]: [...prev.skills[category], skillInputs[category].trim()] } }))
    setSkillInputs(prev => ({ ...prev, [category]: "" }))
  }

  const removeSkill = (category: keyof ResumeContent["skills"], index: number) => {
    setContent(prev => ({ ...prev, skills: { ...prev.skills, [category]: prev.skills[category].filter((_, i) => i !== index) } }))
  }

  const addExperience = () => setContent(prev => ({ ...prev, experience: [...prev.experience, { company: "", role: "", startDate: "", endDate: "", description: "" }] }))
  const updateExperience = (index: number, field: string, value: string) => setContent(prev => ({ ...prev, experience: prev.experience.map((e, i) => i === index ? { ...e, [field]: value } : e) }))
  const removeExperience = (index: number) => setContent(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }))

  const addProject = () => setContent(prev => ({ ...prev, projects: [...prev.projects, { title: "", description: "", technologies: "", link: "" }] }))
  const updateProject = (index: number, field: string, value: string) => setContent(prev => ({ ...prev, projects: prev.projects.map((p, i) => i === index ? { ...p, [field]: value } : p) }))
  const removeProject = (index: number) => setContent(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }))

  const addEducation = () => setContent(prev => ({ ...prev, education: [...prev.education, { school: "", degree: "", field: "", startYear: "", endYear: "" }] }))
  const updateEducation = (index: number, field: string, value: string) => setContent(prev => ({ ...prev, education: prev.education.map((e, i) => i === index ? { ...e, [field]: value } : e) }))
  const removeEducation = (index: number) => setContent(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }))

  const addCertification = () => setContent(prev => ({ ...prev, certifications: [...prev.certifications, { name: "", issuer: "", date: "", link: "" }] }))
  const updateCertification = (index: number, field: string, value: string) => setContent(prev => ({ ...prev, certifications: prev.certifications.map((c, i) => i === index ? { ...c, [field]: value } : c) }))
  const removeCertification = (index: number) => setContent(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }))

  const addExtra = () => setContent(prev => ({ ...prev, extracurricular: [...prev.extracurricular, { title: "", organization: "", date: "", description: "" }] }))
  const updateExtra = (index: number, field: string, value: string) => setContent(prev => ({ ...prev, extracurricular: prev.extracurricular.map((e, i) => i === index ? { ...e, [field]: value } : e) }))
  const removeExtra = (index: number) => setContent(prev => ({ ...prev, extracurricular: prev.extracurricular.filter((_, i) => i !== index) }))

  const skillCategories = [
    { key: "technical" as const, label: "Technical Skills" },
    { key: "frameworks" as const, label: "Frameworks & Tools" },
    { key: "concepts" as const, label: "Concepts" },
    { key: "soft" as const, label: "Soft Skills" },
  ]

  const inputCls = "mt-1 w-full px-3 py-2 border border-[#e3e1da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16191d] bg-white"

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        return (
          <div className="bg-white border border-[#e3e1da] rounded-xl p-6">
            <h3 className="font-semibold text-[#16191d] mb-4">Personal Information</h3>
            <div className="space-y-4">
              {[
                { label: "Full Name", field: "name", type: "text" },
                { label: "Email", field: "email", type: "email" },
                { label: "Phone", field: "phone", type: "text" },
                { label: "Location", field: "location", type: "text" },
                { label: "LinkedIn URL", field: "linkedin", type: "text" },
                { label: "GitHub URL", field: "github", type: "text" },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="text-sm font-medium text-[#16191d]">{label}</label>
                  <input type={type} value={content.personal[field as keyof typeof content.personal]} onChange={(e) => updatePersonal(field, e.target.value)} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-[#16191d]">Summary</label>
                <textarea value={content.personal.summary} onChange={(e) => updatePersonal("summary", e.target.value)} rows={4} className={inputCls} />
              </div>
            </div>
          </div>
        )

      case "experience":
        return (
          <div className="bg-white border border-[#e3e1da] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#16191d]">Experience</h3>
              <button onClick={addExperience} className="text-xs border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] text-[#6e7682] transition-colors">+ Add</button>
            </div>
            {content.experience.map((exp, index) => (
              <div key={index} className="border border-[#e3e1da] rounded-lg p-4 mb-4 space-y-3">
                {[{ label: "Company", field: "company" }, { label: "Role", field: "role" }, { label: "Start Date", field: "startDate" }, { label: "End Date", field: "endDate" }].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-[#16191d]">{label}</label>
                    <input type="text" value={exp[field as keyof typeof exp]} onChange={(e) => updateExperience(index, field, e.target.value)} className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-[#16191d]">Description</label>
                  <textarea value={exp.description} onChange={(e) => updateExperience(index, "description", e.target.value)} rows={3} className={inputCls} />
                </div>
                <button onClick={() => removeExperience(index)} className="text-xs text-[#ff6b47] hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )

      case "projects":
        return (
          <div className="bg-white border border-[#e3e1da] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#16191d]">Projects</h3>
              <button onClick={addProject} className="text-xs border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] text-[#6e7682] transition-colors">+ Add</button>
            </div>
            {content.projects.map((project, index) => (
              <div key={index} className="border border-[#e3e1da] rounded-lg p-4 mb-4 space-y-3">
                {[{ label: "Title", field: "title" }, { label: "Technologies", field: "technologies" }, { label: "Link", field: "link" }].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-[#16191d]">{label}</label>
                    <input type="text" value={project[field as keyof typeof project]} onChange={(e) => updateProject(index, field, e.target.value)} className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-[#16191d]">Description</label>
                  <textarea value={project.description} onChange={(e) => updateProject(index, "description", e.target.value)} rows={3} className={inputCls} />
                </div>
                <button onClick={() => removeProject(index)} className="text-xs text-[#ff6b47] hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )

      case "skills":
        return (
          <div className="bg-white border border-[#e3e1da] rounded-xl p-6">
            <h3 className="font-semibold text-[#16191d] mb-4">Skills</h3>
            {skillCategories.map(({ key, label }) => (
              <div key={key} className="mb-6">
                <label className="text-sm font-medium text-[#16191d] mb-2 block">{label}</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={skillInputs[key]} onChange={(e) => setSkillInputs(prev => ({ ...prev, [key]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addSkill(key)} placeholder={`Add ${label.toLowerCase()} and press Enter`} className={inputCls + " mt-0"} />
                  <button onClick={() => addSkill(key)} className="text-xs bg-[#16191d] text-white px-3 py-1.5 rounded-lg hover:bg-[#2a2d32] transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.skills[key].map((skill, index) => (
                    <span key={index} className="bg-[#f1f0eb] text-[#16191d] px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button onClick={() => removeSkill(key, index)} className="text-[#6e7682] hover:text-[#ff6b47]">×</button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )

      case "education":
        return (
          <div className="bg-white border border-[#e3e1da] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#16191d]">Education</h3>
              <button onClick={addEducation} className="text-xs border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] text-[#6e7682] transition-colors">+ Add</button>
            </div>
            {content.education.map((edu, index) => (
              <div key={index} className="border border-[#e3e1da] rounded-lg p-4 mb-4 space-y-3">
                {[{ label: "School", field: "school" }, { label: "Degree", field: "degree" }, { label: "Field of Study", field: "field" }, { label: "Start Year", field: "startYear" }, { label: "End Year", field: "endYear" }].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-[#16191d]">{label}</label>
                    <input type="text" value={edu[field as keyof typeof edu]} onChange={(e) => updateEducation(index, field, e.target.value)} className={inputCls} />
                  </div>
                ))}
                <button onClick={() => removeEducation(index)} className="text-xs text-[#ff6b47] hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )

      case "certifications":
        return (
          <div className="bg-white border border-[#e3e1da] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#16191d]">Certifications</h3>
              <button onClick={addCertification} className="text-xs border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] text-[#6e7682] transition-colors">+ Add</button>
            </div>
            {content.certifications.map((cert, index) => (
              <div key={index} className="border border-[#e3e1da] rounded-lg p-4 mb-4 space-y-3">
                {[{ label: "Certificate Name", field: "name" }, { label: "Issuer", field: "issuer" }, { label: "Date", field: "date" }, { label: "Link", field: "link" }].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-[#16191d]">{label}</label>
                    <input type="text" value={cert[field as keyof typeof cert]} onChange={(e) => updateCertification(index, field, e.target.value)} className={inputCls} />
                  </div>
                ))}
                <button onClick={() => removeCertification(index)} className="text-xs text-[#ff6b47] hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )

      case "extracurricular":
        return (
          <div className="bg-white border border-[#e3e1da] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#16191d]">Extracurricular Activities</h3>
              <button onClick={addExtra} className="text-xs border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] text-[#6e7682] transition-colors">+ Add</button>
            </div>
            {content.extracurricular.map((extra, index) => (
              <div key={index} className="border border-[#e3e1da] rounded-lg p-4 mb-4 space-y-3">
                {[{ label: "Title", field: "title" }, { label: "Organization", field: "organization" }, { label: "Date", field: "date" }].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-[#16191d]">{label}</label>
                    <input type="text" value={extra[field as keyof typeof extra]} onChange={(e) => updateExtra(index, field, e.target.value)} className={inputCls} />
                  </div>
                ))}
                <div>
                  <label className="text-sm font-medium text-[#16191d]">Description</label>
                  <textarea value={extra.description} onChange={(e) => updateExtra(index, "description", e.target.value)} rows={3} className={inputCls} />
                </div>
                <button onClick={() => removeExtra(index)} className="text-xs text-[#ff6b47] hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-screen bg-[#fafaf7] flex flex-col">
      <AppNav />

      {/* Toolbar */}
      <div className="bg-white border-b border-[#e3e1da] px-6 py-3 flex items-center justify-between shrink-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resume title..."
          className="text-lg font-bold text-[#16191d] bg-transparent border-none outline-none"
          style={{ fontFamily: "var(--font-display)" }}
        />
        <div className="flex gap-3 items-center">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="text-sm border border-[#e3e1da] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#16191d]"
          >
            {RESUME_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={() => handlePrint()}
            className="text-sm border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors text-[#6e7682]"
          >
            Download PDF
          </button>
          <button
            onClick={saveResume}
            className="text-sm bg-[#16191d] text-white px-4 py-1.5 rounded-lg hover:bg-[#2a2d32] transition-colors"
          >
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Side-by-side layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Editor */}
        <div className="w-1/2 overflow-y-auto px-6 py-6 border-r bg-[#fafaf7]">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
              {sectionOrder.map((sectionId) => (
                <SortableSection key={sectionId} id={sectionId}>
                  {renderSection(sectionId)}
                </SortableSection>
              ))}
            </SortableContext>
          </DndContext>

          <button
            onClick={saveResume}
            className="w-full mb-8 mt-2 bg-[#16191d] text-white py-2.5 rounded-xl font-medium hover:bg-[#2a2d32] transition-colors"
          >
            {saved ? "Saved!" : "Save Resume"}
          </button>
        </div>

        {/* RIGHT: Preview */}
        <div className="w-1/2 overflow-y-auto bg-[#f1f0eb]">
          <div className="sticky top-0 bg-[#e3e1da] border-b border-[#d4d2cb] px-4 py-2 text-xs text-[#6e7682] font-mono uppercase tracking-wider z-10">
            Preview
          </div>
          <div className="p-6">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden" ref={previewRef}>
              <ResumePreview content={content} sectionOrder={sectionOrder} templateId={template} />
            </div>
          </div>
        </div>

      </div>

      {/*
        Hidden fit-to-one-page print target.
        A separate copy of the resume, rendered off-screen at a fixed A4 page
        size. computeFitScale() measures its natural height and applies a
        compensating width + transform scale so content shrinks (long resumes)
        or grows (short resumes) to fill exactly one page. The visible editor
        preview on the right is never touched.
      */}
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
            <ResumePreview content={content} sectionOrder={sectionOrder} templateId={template} />
          </div>
        </div>
      </div>
    </div>
  )
}