export interface ResumeContent {
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

export const DEFAULT_SECTION_ORDER = [
  "personal",
  "education",
  "experience",
  "projects",
  "skills",
  "certifications",
  "extracurricular",
]

export interface ResumeTemplateProps {
  content: ResumeContent
  sectionOrder?: string[]
}