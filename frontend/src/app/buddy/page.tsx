"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import AppNav from "@/components/AppNav"
import { API_URL, authenticatedFetch } from "@/lib/api"

export default function BuddyPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (!t) {
      router.push("/login")
      return
    }
    setToken(t)
  }, [])

  const tabs = [
    { id: "personal", label: "Personal" },
    { id: "education", label: "Education" },
    { id: "projects", label: "Projects" },
    { id: "experience", label: "Experience" },
    { id: "skills", label: "Skills" },
    { id: "certifications", label: "Certifications" },
    { id: "achievements", label: "Achievements" },
  ]

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <AppNav />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-[#6e7682] mb-2">Resume Buddy</p>
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-bold text-[#16191d]" style={{ fontFamily: "var(--font-display)" }}>
              Knowledge Base
            </h2>
            <button
              onClick={() => router.push("/buddy/generate")}
              className="bg-[#d7fb3d] text-[#16191d] font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#c8f020] transition-colors"
            >
              Generate Resume →
            </button>
          </div>
          <p className="text-[#6e7682] text-sm mt-1">Store your career data once. Generate tailored resumes instantly.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap mb-6 bg-[#f1f0eb] p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                  ? "bg-white text-[#16191d] shadow-sm"
                  : "text-[#6e7682] hover:text-[#16191d]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-[#e3e1da] rounded-2xl p-6">
          {activeTab === "personal" && <PersonalTab token={token} />}
          {activeTab === "education" && <EducationTab token={token} />}
          {activeTab === "projects" && <ProjectsTab token={token} />}
          {activeTab === "experience" && <ExperienceTab token={token} />}
          {activeTab === "skills" && <SkillsTab token={token} />}
          {activeTab === "certifications" && <CertificationsTab token={token} />}
          {activeTab === "achievements" && <AchievementsTab token={token} />}
        </div>
      </main>
    </div>
  )
}

const inputClass = "mt-1 w-full px-3 py-2 border border-[#e3e1da] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16191d] bg-white"
const labelClass = "text-sm font-medium text-[#16191d]"
const cardClass = "border border-[#e3e1da] rounded-xl p-4 mb-3"

// --- Personal Tab ---
function PersonalTab({ token }: { token: string }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", location: "",
    linkedin: "", github: "", summary: ""
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!token) return
    authenticatedFetch("/kb/personal")
      .then(r => r.json())
      .then(data => {
        if (data) setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          linkedin: data.linkedin || "",
          github: data.github || "",
          summary: data.summary || ""
        })
      })
  }, [token])

  const save = async () => {
    await authenticatedFetch("/kb/personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-[#16191d] mb-4">Personal Information</h3>
      {[
        { label: "Full Name", field: "name", type: "text" },
        { label: "Email", field: "email", type: "email" },
        { label: "Phone", field: "phone", type: "text" },
        { label: "Location", field: "location", type: "text" },
        { label: "LinkedIn URL", field: "linkedin", type: "text" },
        { label: "GitHub URL", field: "github", type: "text" },
      ].map(({ label, field, type }) => (
        <div key={field}>
          <label className={labelClass}>{label}</label>
          <input
            type={type}
            value={form[field as keyof typeof form]}
            onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
            className={inputClass}
          />
        </div>
      ))}
      <div>
        <label className={labelClass}>Summary</label>
        <textarea
          value={form.summary}
          onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
          rows={4}
          className={inputClass}
        />
      </div>
      <button
        onClick={save}
        className="w-full bg-[#16191d] text-white py-2.5 rounded-lg font-medium hover:bg-[#2a2d32] transition-colors text-sm"
      >
        {saved ? "Saved!" : "Save Personal Info"}
      </button>
    </div>
  )
}

// --- Education Tab ---
function EducationTab({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ school: "", degree: "", field: "", start_year: "", end_year: "", grade: "" })
  const [adding, setAdding] = useState(false)

  const fetchList = async () => {
    const res = await authenticatedFetch("/kb/education")
    const data = await res.json()
    setList(data || [])
  }

  useEffect(() => { if (token) fetchList() }, [token])

  const save = async () => {
    await authenticatedFetch("/kb/education", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    setForm({ school: "", degree: "", field: "", start_year: "", end_year: "", grade: "" })
    setAdding(false)
    fetchList()
  }

  const remove = async (id: number) => {
    await authenticatedFetch(`/kb/education/${id}`, { method: "DELETE" })
    fetchList()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#16191d]">Education</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors text-[#6e7682]"
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>
      {adding && (
        <div className="border border-[#e3e1da] rounded-xl p-4 mb-4 space-y-3">
          {[
            { label: "School", field: "school" },
            { label: "Degree", field: "degree" },
            { label: "Field of Study", field: "field" },
            { label: "Start Year", field: "start_year" },
            { label: "End Year", field: "end_year" },
            { label: "Grade/GPA", field: "grade" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input type="text" value={form[field as keyof typeof form]}
                onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                className={inputClass} />
            </div>
          ))}
          <button onClick={save} className="w-full bg-[#16191d] text-white py-2.5 rounded-lg font-medium hover:bg-[#2a2d32] transition-colors text-sm">
            Save Education
          </button>
        </div>
      )}
      {list.length === 0 && !adding && <p className="text-[#6e7682] text-sm text-center py-8">No education added yet</p>}
      {list.map((edu) => (
        <div key={edu.id} className={cardClass}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-[#16191d]">{edu.school}</p>
              <p className="text-sm text-[#6e7682]">{edu.degree}{edu.field ? `, ${edu.field}` : ""}</p>
              <p className="text-xs text-[#6e7682] mt-0.5">{edu.start_year}{edu.end_year ? ` – ${edu.end_year}` : ""}{edu.grade ? ` • ${edu.grade}` : ""}</p>
            </div>
            <button onClick={() => remove(edu.id)} className="text-[#e3e1da] hover:text-[#ff6b47] text-xl transition-colors">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Projects Tab ---
function ProjectsTab({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ title: "", description: "", technologies: "", role: "", outcomes: "", domain: "", start_date: "", end_date: "" })
  const [adding, setAdding] = useState(false)

  const fetchList = async () => {
    const res = await authenticatedFetch("/kb/projects")
    const data = await res.json()
    setList(data || [])
  }

  useEffect(() => { if (token) fetchList() }, [token])

  const save = async () => {
    await authenticatedFetch("/kb/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    setForm({ title: "", description: "", technologies: "", role: "", outcomes: "", domain: "", start_date: "", end_date: "" })
    setAdding(false)
    fetchList()
  }

  const remove = async (id: number) => {
    await authenticatedFetch(`/kb/projects/${id}`, { method: "DELETE" })
    fetchList()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#16191d]">Projects</h3>
        <button onClick={() => setAdding(!adding)} className="text-sm border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors text-[#6e7682]">
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>
      {adding && (
        <div className="border border-[#e3e1da] rounded-xl p-4 mb-4 space-y-3">
          {[
            { label: "Project Title", field: "title" },
            { label: "Technologies Used", field: "technologies" },
            { label: "Your Role", field: "role" },
            { label: "Domain (e.g. fintech, healthcare)", field: "domain" },
            { label: "Start Date", field: "start_date" },
            { label: "End Date", field: "end_date" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input type="text" value={form[field as keyof typeof form]}
                onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                className={inputClass} />
            </div>
          ))}
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3} placeholder="Describe what the project does..." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Outcomes</label>
            <textarea value={form.outcomes} onChange={(e) => setForm(prev => ({ ...prev, outcomes: e.target.value }))}
              rows={2} placeholder="What was achieved? (e.g. reduced load time by 40%)" className={inputClass} />
          </div>
          <button onClick={save} className="w-full bg-[#16191d] text-white py-2.5 rounded-lg font-medium hover:bg-[#2a2d32] transition-colors text-sm">
            Save Project
          </button>
        </div>
      )}
      {list.length === 0 && !adding && <p className="text-[#6e7682] text-sm text-center py-8">No projects added yet. Add at least 2.</p>}
      {list.map((project) => (
        <div key={project.id} className={cardClass}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-semibold text-[#16191d]">{project.title}</p>
              {project.technologies && <p className="text-sm text-[#6e7682] mt-1">Tech: {project.technologies}</p>}
              {project.domain && <p className="text-xs text-[#6e7682]">Domain: {project.domain}</p>}
              {project.description && <p className="text-xs text-[#6e7682] mt-1 line-clamp-2">{project.description}</p>}
            </div>
            <button onClick={() => remove(project.id)} className="text-[#e3e1da] hover:text-[#ff6b47] text-xl transition-colors ml-4">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Experience Tab ---
function ExperienceTab({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ company: "", role: "", responsibilities: "", technologies: "", start_date: "", end_date: "" })
  const [adding, setAdding] = useState(false)

  const fetchList = async () => {
    const res = await authenticatedFetch("/kb/experience")
    const data = await res.json()
    setList(data || [])
  }

  useEffect(() => { if (token) fetchList() }, [token])

  const save = async () => {
    await authenticatedFetch("/kb/experience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    setForm({ company: "", role: "", responsibilities: "", technologies: "", start_date: "", end_date: "" })
    setAdding(false)
    fetchList()
  }

  const remove = async (id: number) => {
    await authenticatedFetch(`/kb/experience/${id}`, { method: "DELETE" })
    fetchList()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#16191d]">Experience</h3>
        <button onClick={() => setAdding(!adding)} className="text-sm border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors text-[#6e7682]">
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>
      {adding && (
        <div className="border border-[#e3e1da] rounded-xl p-4 mb-4 space-y-3">
          {[
            { label: "Company", field: "company" },
            { label: "Role / Title", field: "role" },
            { label: "Technologies Used", field: "technologies" },
            { label: "Start Date", field: "start_date" },
            { label: "End Date", field: "end_date" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input type="text" value={form[field as keyof typeof form]}
                onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                className={inputClass} />
            </div>
          ))}
          <div>
            <label className={labelClass}>Responsibilities</label>
            <textarea value={form.responsibilities} onChange={(e) => setForm(prev => ({ ...prev, responsibilities: e.target.value }))}
              rows={3} placeholder="What did you do? (each line will be a bullet point)" className={inputClass} />
          </div>
          <button onClick={save} className="w-full bg-[#16191d] text-white py-2.5 rounded-lg font-medium hover:bg-[#2a2d32] transition-colors text-sm">
            Save Experience
          </button>
        </div>
      )}
      {list.length === 0 && !adding && <p className="text-[#6e7682] text-sm text-center py-8">No experience added yet</p>}
      {list.map((exp) => (
        <div key={exp.id} className={cardClass}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-[#16191d]">{exp.role}</p>
              <p className="text-sm text-[#6e7682]">{exp.company}</p>
              <p className="text-xs text-[#6e7682] mt-0.5">{exp.start_date}{exp.end_date ? ` – ${exp.end_date}` : ""}</p>
            </div>
            <button onClick={() => remove(exp.id)} className="text-[#e3e1da] hover:text-[#ff6b47] text-xl transition-colors">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Skills Tab ---
function SkillsTab({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({
    languages: "", frameworks: "", tools: "", databases: "", cloud: ""
  })

  const categories = [
    { key: "languages", label: "Programming Languages" },
    { key: "frameworks", label: "Frameworks" },
    { key: "tools", label: "Tools" },
    { key: "databases", label: "Databases" },
    { key: "cloud", label: "Cloud Technologies" },
  ]

  const fetchList = async () => {
    const res = await authenticatedFetch("/kb/skills")
    const data = await res.json()
    setList(data || [])
  }

  useEffect(() => { if (token) fetchList() }, [token])

  const addSkill = async (category: string) => {
    const name = inputs[category].trim()
    if (!name) return
    await authenticatedFetch("/kb/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, name })
    })
    setInputs(prev => ({ ...prev, [category]: "" }))
    fetchList()
  }

  const remove = async (id: number) => {
    await authenticatedFetch(`/kb/skills/${id}`, { method: "DELETE" })
    fetchList()
  }

  const totalSkills = list.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#16191d]">Skills</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${totalSkills >= 3 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
          {totalSkills} skill{totalSkills !== 1 ? "s" : ""} {totalSkills < 3 ? "(min 3)" : "✓"}
        </span>
      </div>
      {categories.map(({ key, label }) => {
        const categorySkills = list.filter(s => s.category === key)
        return (
          <div key={key} className="mb-5">
            <label className="text-sm font-medium text-[#16191d] mb-2 block">{label}</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={inputs[key]}
                onChange={(e) => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addSkill(key)}
                placeholder={`Add and press Enter`}
                className={inputClass} />
              <button onClick={() => addSkill(key)} className="text-sm bg-[#16191d] text-white px-3 py-1.5 rounded-lg hover:bg-[#2a2d32] transition-colors">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categorySkills.map((skill) => (
                <span key={skill.id} className="bg-[#f1f0eb] text-[#16191d] px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {skill.name}
                  <button onClick={() => remove(skill.id)} className="text-[#6e7682] hover:text-[#ff6b47] transition-colors">×</button>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Certifications Tab ---
function CertificationsTab({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ name: "", issuer: "", skills_covered: "", date: "" })
  const [adding, setAdding] = useState(false)

  const fetchList = async () => {
    const res = await authenticatedFetch("/kb/certifications")
    const data = await res.json()
    setList(data || [])
  }

  useEffect(() => { if (token) fetchList() }, [token])

  const save = async () => {
    await authenticatedFetch("/kb/certifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    setForm({ name: "", issuer: "", skills_covered: "", date: "" })
    setAdding(false)
    fetchList()
  }

  const remove = async (id: number) => {
    await authenticatedFetch(`/kb/certifications/${id}`, { method: "DELETE" })
    fetchList()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#16191d]">Certifications</h3>
        <button onClick={() => setAdding(!adding)} className="text-sm border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors text-[#6e7682]">
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>
      {adding && (
        <div className="border border-[#e3e1da] rounded-xl p-4 mb-4 space-y-3">
          {[
            { label: "Certification Name", field: "name" },
            { label: "Issuer", field: "issuer" },
            { label: "Skills Covered", field: "skills_covered" },
            { label: "Date", field: "date" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input type="text" value={form[field as keyof typeof form]}
                onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                className={inputClass} />
            </div>
          ))}
          <button onClick={save} className="w-full bg-[#16191d] text-white py-2.5 rounded-lg font-medium hover:bg-[#2a2d32] transition-colors text-sm">
            Save Certification
          </button>
        </div>
      )}
      {list.length === 0 && !adding && <p className="text-[#6e7682] text-sm text-center py-8">No certifications added yet</p>}
      {list.map((cert) => (
        <div key={cert.id} className={cardClass}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-[#16191d]">{cert.name}</p>
              {cert.issuer && <p className="text-sm text-[#6e7682]">{cert.issuer}</p>}
              {cert.skills_covered && <p className="text-xs text-[#6e7682]">Skills: {cert.skills_covered}</p>}
              {cert.date && <p className="text-xs text-[#6e7682] mt-0.5">{cert.date}</p>}
            </div>
            <button onClick={() => remove(cert.id)} className="text-[#e3e1da] hover:text-[#ff6b47] text-xl transition-colors">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Achievements Tab ---
function AchievementsTab({ token }: { token: string }) {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ title: "", description: "", date: "" })
  const [adding, setAdding] = useState(false)

  const fetchList = async () => {
    const res = await authenticatedFetch("/kb/achievements")
    const data = await res.json()
    setList(data || [])
  }

  useEffect(() => { if (token) fetchList() }, [token])

  const save = async () => {
    await authenticatedFetch("/kb/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    setForm({ title: "", description: "", date: "" })
    setAdding(false)
    fetchList()
  }

  const remove = async (id: number) => {
    await authenticatedFetch(`/kb/achievements/${id}`, { method: "DELETE" })
    fetchList()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#16191d]">Achievements</h3>
        <button onClick={() => setAdding(!adding)} className="text-sm border border-[#e3e1da] px-3 py-1.5 rounded-lg hover:border-[#6e7682] transition-colors text-[#6e7682]">
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>
      {adding && (
        <div className="border border-[#e3e1da] rounded-xl p-4 mb-4 space-y-3">
          {[
            { label: "Title", field: "title" },
            { label: "Date", field: "date" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input type="text" value={form[field as keyof typeof form]}
                onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                className={inputClass} />
            </div>
          ))}
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3} placeholder="Describe the achievement..." className={inputClass} />
          </div>
          <button onClick={save} className="w-full bg-[#16191d] text-white py-2.5 rounded-lg font-medium hover:bg-[#2a2d32] transition-colors text-sm">
            Save Achievement
          </button>
        </div>
      )}
      {list.length === 0 && !adding && <p className="text-[#6e7682] text-sm text-center py-8">No achievements added yet</p>}
      {list.map((ach) => (
        <div key={ach.id} className={cardClass}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-[#16191d]">{ach.title}</p>
              {ach.description && <p className="text-sm text-[#6e7682] mt-1">{ach.description}</p>}
              {ach.date && <p className="text-xs text-[#6e7682] mt-1">{ach.date}</p>}
            </div>
            <button onClick={() => remove(ach.id)} className="text-[#e3e1da] hover:text-[#ff6b47] text-xl transition-colors">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}