import { ResumeContent, DEFAULT_SECTION_ORDER } from "./types"

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="mt-4 mb-1.5">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-gray-900">{title}</h2>
            <div className="border-t border-gray-400 mt-0.5" />
        </div>
    )
}

export default function ClassicTemplate({
    content,
    sectionOrder = DEFAULT_SECTION_ORDER,
}: {
    content: ResumeContent
    sectionOrder?: string[]
}) {
    const hasSkills =
        content.skills.technical.length > 0 ||
        content.skills.frameworks.length > 0 ||
        content.skills.concepts.length > 0 ||
        content.skills.soft.length > 0

    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case "personal":
                return content.personal.summary ? (
                    <div key="personal">
                        <SectionHeader title="Professional Summary" />
                        <p className="text-gray-700 leading-relaxed">{content.personal.summary}</p>
                    </div>
                ) : null

            case "education":
                return content.education.length > 0 ? (
                    <div key="education">
                        <SectionHeader title="Education" />
                        {content.education.map((edu, i) => (
                            <div key={i} className="mb-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-900">{edu.school}</span>
                                    <span className="text-gray-600">{edu.startYear}{edu.endYear ? `–${edu.endYear}` : ""}</span>
                                </div>
                                <div className="text-gray-700 italic">
                                    {edu.degree}{edu.field ? `, ${edu.field}` : ""}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null

            case "experience":
                return content.experience.length > 0 ? (
                    <div key="experience">
                        <SectionHeader title="Experience" />
                        {content.experience.map((exp, i) => (
                            <div key={i} className="mb-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-900">{exp.company}</span>
                                    <span className="text-gray-600">{exp.startDate}{exp.endDate ? `–${exp.endDate}` : ""}</span>
                                </div>
                                <div className="italic text-gray-700 mb-1">{exp.role}</div>
                                {exp.description && (
                                    <ul className="list-disc ml-4 text-gray-700 space-y-0.5">
                                        {exp.description.split("\n").filter(Boolean).map((line, j) => (
                                            <li key={j}>{line}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                ) : null

            case "projects":
                return content.projects.length > 0 ? (
                    <div key="projects">
                        <SectionHeader title="Projects" />
                        {content.projects.map((project, i) => (
                            <div key={i} className="mb-3">
                                <div className="flex items-baseline gap-1 flex-wrap">
                                    <span className="font-bold text-gray-900">{project.title}</span>
                                    {project.technologies && (
                                        <span className="text-gray-700" style={{ fontSize: "11px" }}>
                                            | {project.technologies}
                                        </span>
                                    )}
                                    {project.link && (
                                        <a
                                            href={project.link.startsWith("http") ? project.link : `https://${project.link}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                                            style={{ fontSize: "11px" }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0077b5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                            </svg>
                                            GitHub
                                        </a>
                                    )}
                            </div>
                {
                                project.description && (
                                    <ul className="list-disc ml-4 text-gray-700 space-y-0.5 mt-0.5">
                                        {project.description.split("\n").filter(Boolean).map((line, j) => (
                                            <li key={j}>{line}</li>
                                        ))}
                                    </ul>
                                )
                            }
              </div>
                ))
        }
          </div >
        ) : null

      case "skills":
    return hasSkills ? (
        <div key="skills">
            <SectionHeader title="Skills" />
            <div className="space-y-0.5 text-gray-700">
                {content.skills.technical.length > 0 && (
                    <div><span className="font-bold">Proficient: </span>{content.skills.technical.join(", ")}</div>
                )}
                {content.skills.frameworks.length > 0 && (
                    <div><span className="font-bold">Frameworks & Tools: </span>{content.skills.frameworks.join(", ")}</div>
                )}
                {content.skills.concepts.length > 0 && (
                    <div><span className="font-bold">Concepts: </span>{content.skills.concepts.join(", ")}</div>
                )}
                {content.skills.soft.length > 0 && (
                    <div><span className="font-bold">Soft Skills: </span>{content.skills.soft.join(", ")}</div>
                )}
            </div>
        </div>
    ) : null

      case "certifications":
    return content.certifications.length > 0 ? (
        <div key="certifications">
            <SectionHeader title="Certifications" />
            <ul className="list-disc ml-4 text-gray-700 space-y-0.5">
                {content.certifications.map((cert, i) => (
                    <li key={i}>
                        <span className="font-semibold">{cert.name}</span>
                        {cert.issuer && <span className="text-gray-600"> – {cert.issuer}</span>}
                        {cert.date && <span className="text-gray-500"> {cert.date}</span>}
                    </li>
                ))}
            </ul>
        </div>
    ) : null

      case "extracurricular":
    return content.extracurricular.length > 0 ? (
        <div key="extracurricular">
            <SectionHeader title="Extracurricular" />
            {content.extracurricular.map((extra, i) => (
                <div key={i} className="mb-2">
                    <div className="flex justify-between items-baseline">
                        <span className="font-bold text-gray-900">{extra.title}</span>
                        {extra.date && <span className="text-gray-500">{extra.date}</span>}
                    </div>
                    {extra.organization && (
                        <div className="text-gray-600 italic">{extra.organization}</div>
                    )}
                    {extra.description && (
                        <p className="text-gray-700">{extra.description}</p>
                    )}
                </div>
            ))}
        </div>
    ) : null

      default:
    return null
}
  }

return (
    <div className="bg-white text-gray-900 font-sans leading-snug p-8" style={{ fontSize: "13px", minHeight: "1050px" }}>

        {/* Name */}
        <div className="text-center mb-1">
            <h1 className="font-bold text-gray-900" style={{ fontSize: "20px" }}>
                {content.personal.name || "Your Name"}
            </h1>
        </div>

        {/* Contact line */}
        <div className="flex flex-wrap justify-center gap-x-2 text-gray-600 mb-1" style={{ fontSize: "11.5px" }}>
            {content.personal.location && <span>{content.personal.location}</span>}
            {content.personal.phone && (
                <><span className="text-gray-400">•</span><span>{content.personal.phone}</span></>
            )}
            {content.personal.email && (
                <><span className="text-gray-400">•</span><span>{content.personal.email}</span></>
            )}
            {content.personal.linkedin && (
                <>
                    <span className="text-gray-400">•</span>
                    <a
                        href={content.personal.linkedin.startsWith("http") ? content.personal.linkedin : `https://${content.personal.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#0077b5">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        LinkedIn
                    </a>
                </>
            )}
        {content.personal.github && (
            <>
                <span className="text-gray-400">•</span>
                <a
                    href={content.personal.github.startsWith("http") ? content.personal.github : `https://${content.personal.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#333">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                </a>
            </>
        )}
      </div >

    <div className="border-t-2 border-gray-800 mb-2" />

{/* Render sections in order */ }
{ sectionOrder.map((sectionId) => renderSection(sectionId)) }

    </div >
  )
}
