import { ResumeContent, DEFAULT_SECTION_ORDER } from "./types"

export default function MinimalTemplate({
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

    const leftSections = ["skills", "certifications", "education"]
    const rightSections = sectionOrder.filter(s => !leftSections.includes(s) && s !== "personal")

    return (
        <div className="bg-white text-gray-900 font-sans" style={{ fontSize: "13px", minHeight: "1050px" }}>

            {/* Header */}
            <div className="border-b-4 border-gray-900 px-8 pt-8 pb-4">
                <h1 className="font-bold text-gray-900" style={{ fontSize: "26px" }}>
                    {content.personal.name || "Your Name"}
                </h1>
                <div className="flex flex-wrap gap-x-3 mt-1 text-gray-600" style={{ fontSize: "11px" }}>
                    {content.personal.email && <span>{content.personal.email}</span>}
                    {content.personal.phone && <span>• {content.personal.phone}</span>}
                    {content.personal.location && <span>• {content.personal.location}</span>}
                    {content.personal.linkedin && (
                        <a
                            href={content.personal.linkedin.startsWith("http") ? content.personal.linkedin : `https://${content.personal.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:underline"
                        >
                            • LinkedIn
                        </a>
                    )}
                    {content.personal.github && (
                        <a
                            href={content.personal.github.startsWith("http") ? content.personal.github : `https://${content.personal.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:underline"
                        >
                            • GitHub
                        </a>
                    )}
                </div>
                {content.personal.summary && (
                    <p className="mt-3 text-gray-600 leading-relaxed" style={{ fontSize: "12px" }}>
                        {content.personal.summary}
                    </p>
                )}
            </div>

            {/* Two column body */}
            <div className="flex">

                {/* Left sidebar */}
                <div className="w-1/3 bg-gray-50 border-r px-5 py-5 space-y-5">

                    {leftSections.map(sectionId => {
                        if (sectionId === "skills" && hasSkills) return (
                            <div key="skills">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Skills</h2>
                                {content.skills.technical.length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] font-semibold text-gray-700 mb-1">Proficient</div>
                                        <div className="flex flex-wrap gap-1">
                                            {content.skills.technical.map((s, i) => (
                                                <span key={i} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {content.skills.frameworks.length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] font-semibold text-gray-700 mb-1">Frameworks</div>
                                        <div className="flex flex-wrap gap-1">
                                            {content.skills.frameworks.map((s, i) => (
                                                <span key={i} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {content.skills.concepts.length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] font-semibold text-gray-700 mb-1">Concepts</div>
                                        <div className="flex flex-wrap gap-1">
                                            {content.skills.concepts.map((s, i) => (
                                                <span key={i} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {content.skills.soft.length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] font-semibold text-gray-700 mb-1">Soft Skills</div>
                                        <div className="flex flex-wrap gap-1">
                                            {content.skills.soft.map((s, i) => (
                                                <span key={i} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px]">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )

                        if (sectionId === "certifications" && content.certifications.length > 0) return (
                            <div key="certifications">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Certifications</h2>
                                <ul className="space-y-1">
                                    {content.certifications.map((cert, i) => (
                                        <li key={i} className="text-[11px] text-gray-700">
                                            <div className="font-semibold">{cert.name}</div>
                                            {cert.issuer && <div className="text-gray-500">{cert.issuer}</div>}
                                            {cert.date && <div className="text-gray-400">{cert.date}</div>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )

                        if (sectionId === "education" && content.education.length > 0) return (
                            <div key="education">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Education</h2>
                                {content.education.map((edu, i) => (
                                    <div key={i} className="mb-2 text-[11px]">
                                        <div className="font-bold text-gray-900">{edu.school}</div>
                                        <div className="text-gray-600">{edu.degree}{edu.field ? `, ${edu.field}` : ""}</div>
                                        <div className="text-gray-400">{edu.startYear}{edu.endYear ? `–${edu.endYear}` : ""}</div>
                                    </div>
                                ))}
                            </div>
                        )

                        return null
                    })}

                </div>

                {/* Right main content */}
                <div className="w-2/3 px-6 py-5 space-y-5">
                    {rightSections.map(sectionId => {
                        if (sectionId === "experience" && content.experience.length > 0) return (
                            <div key="experience">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Experience</h2>
                                {content.experience.map((exp, i) => (
                                    <div key={i} className="mb-4">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold text-gray-900">{exp.role}</span>
                                            <span className="text-gray-400 text-[10px]">{exp.startDate}{exp.endDate ? `–${exp.endDate}` : ""}</span>
                                        </div>
                                        <div className="text-gray-600 text-[11px] mb-1">{exp.company}</div>
                                        {exp.description && (
                                            <ul className="list-disc ml-4 text-gray-700 space-y-0.5 text-[11px]">
                                                {exp.description.split("\n").filter(Boolean).map((line, j) => (
                                                    <li key={j}>{line}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )

                        if (sectionId === "projects" && content.projects.length > 0) return (
                            <div key="projects">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Projects</h2>
                                {content.projects.map((project, i) => (
                                    <div key={i} className="mb-3">
                                        <div className="flex items-baseline gap-1 flex-wrap">
                                            <span className="font-bold text-gray-900">{project.title}</span>
                                            {project.technologies && (
                                                <span className="text-gray-500 text-[10px]">| {project.technologies}</span>
                                            )}
                                            {project.link && (
                                                <a
                                                    href={project.link.startsWith("http") ? project.link : `https://${project.link}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-500 hover:underline text-[10px]"
                                                >
                                                    ↗
                                                </a>
                                            )}
                                        </div>
                                        {project.description && (
                                            <ul className="list-disc ml-4 text-gray-700 space-y-0.5 mt-0.5 text-[11px]">
                                                {project.description.split("\n").filter(Boolean).map((line, j) => (
                                                    <li key={j}>{line}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )

                        if (sectionId === "extracurricular" && content.extracurricular.length > 0) return (
                            <div key="extracurricular">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Extracurricular</h2>
                                {content.extracurricular.map((extra, i) => (
                                    <div key={i} className="mb-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold text-gray-900">{extra.title}</span>
                                            {extra.date && <span className="text-gray-400 text-[10px]">{extra.date}</span>}
                                        </div>
                                        {extra.organization && <div className="text-gray-600 text-[11px]">{extra.organization}</div>}
                                        {extra.description && <p className="text-gray-700 text-[11px]">{extra.description}</p>}
                                    </div>
                                ))}
                            </div>
                        )

                        return null
                    })}
                </div>

            </div>
        </div>
    )
}