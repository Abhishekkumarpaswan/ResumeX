import { ResumeContent, DEFAULT_SECTION_ORDER } from "./types"

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="mt-4 mb-2">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-white bg-gray-800 px-3 py-1">
                {title}
            </h2>
        </div>
    )
}

export default function ModernTemplate({
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
                        <SectionHeader title="Profile" />
                        <p className="text-gray-700 leading-relaxed px-1">{content.personal.summary}</p>
                    </div>
                ) : null

            case "education":
                return content.education.length > 0 ? (
                    <div key="education">
                        <SectionHeader title="Education" />
                        {content.education.map((edu, i) => (
                            <div key={i} className="mb-3 px-1">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-900">{edu.school}</span>
                                    <span className="text-gray-500 text-[11px]">{edu.startYear}{edu.endYear ? `–${edu.endYear}` : ""}</span>
                                </div>
                                <div className="text-gray-600 italic text-[12px]">
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
                            <div key={i} className="mb-4 px-1">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-900">{exp.role}</span>
                                    <span className="text-gray-500 text-[11px]">{exp.startDate}{exp.endDate ? `–${exp.endDate}` : ""}</span>
                                </div>
                                <div className="text-blue-700 font-medium text-[12px] mb-1">{exp.company}</div>
                                {exp.description && (
                                    <ul className="list-disc ml-4 text-gray-700 space-y-0.5 text-[12px]">
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
                            <div key={i} className="mb-3 px-1">
                                <div className="flex items-baseline gap-1 flex-wrap">
                                    <span className="font-bold text-gray-900">{project.title}</span>
                                    {project.technologies && (
                                        <span className="text-blue-700 text-[11px]">| {project.technologies}</span>
                                    )}
                                    {project.link && (
                                        <a
                                            href={project.link.startsWith("http") ? project.link : `https://${project.link}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-[11px]"
                                        >
                                            ↗ Link
                                        </a>
                                    )}
                                </div>
                                {project.description && (
                                    <ul className="list-disc ml-4 text-gray-700 space-y-0.5 mt-0.5 text-[12px]">
                                        {project.description.split("\n").filter(Boolean).map((line, j) => (
                                            <li key={j}>{line}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                ) : null

            case "skills":
                return hasSkills ? (
                    <div key="skills">
                        <SectionHeader title="Skills" />
                        <div className="space-y-1 text-gray-700 px-1 text-[12px]">
                            {content.skills.technical.length > 0 && (
                                <div><span className="font-bold text-gray-900">Proficient: </span>{content.skills.technical.join(" • ")}</div>
                            )}
                            {content.skills.frameworks.length > 0 && (
                                <div><span className="font-bold text-gray-900">Frameworks & Tools: </span>{content.skills.frameworks.join(" • ")}</div>
                            )}
                            {content.skills.concepts.length > 0 && (
                                <div><span className="font-bold text-gray-900">Concepts: </span>{content.skills.concepts.join(" • ")}</div>
                            )}
                            {content.skills.soft.length > 0 && (
                                <div><span className="font-bold text-gray-900">Soft Skills: </span>{content.skills.soft.join(" • ")}</div>
                            )}
                        </div>
                    </div>
                ) : null

            case "certifications":
                return content.certifications.length > 0 ? (
                    <div key="certifications">
                        <SectionHeader title="Certifications" />
                        <ul className="list-disc ml-4 text-gray-700 space-y-0.5 px-1 text-[12px]">
                            {content.certifications.map((cert, i) => (
                                <li key={i}>
                                    <span className="font-semibold">{cert.name}</span>
                                    {cert.issuer && <span className="text-gray-500"> — {cert.issuer}</span>}
                                    {cert.date && <span className="text-gray-400"> {cert.date}</span>}
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
                            <div key={i} className="mb-2 px-1">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-900">{extra.title}</span>
                                    {extra.date && <span className="text-gray-500 text-[11px]">{extra.date}</span>}
                                </div>
                                {extra.organization && <div className="text-blue-700 text-[12px]">{extra.organization}</div>}
                                {extra.description && <p className="text-gray-700 text-[12px]">{extra.description}</p>}
                            </div>
                        ))}
                    </div>
                ) : null

            default:
                return null
        }
    }

    return (
        <div className="bg-white text-gray-900 font-sans leading-snug" style={{ fontSize: "13px", minHeight: "1050px" }}>

            {/* Header with dark background */}
            <div className="bg-gray-900 text-white px-8 py-6">
                <h1 className="font-bold text-white mb-1" style={{ fontSize: "24px" }}>
                    {content.personal.name || "Your Name"}
                </h1>
                <div className="flex flex-wrap gap-x-3 text-gray-300" style={{ fontSize: "11.5px" }}>
                    {content.personal.location && <span>{content.personal.location}</span>}
                    {content.personal.phone && <span>• {content.personal.phone}</span>}
                    {content.personal.email && <span>• {content.personal.email}</span>}
                    {content.personal.linkedin && (
                        <a
                            href={content.personal.linkedin.startsWith("http") ? content.personal.linkedin : `https://${content.personal.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-300 hover:underline"
                        >
                            • LinkedIn
                        </a>
                    )}
                    {content.personal.github && (
                        <a
                            href={content.personal.github.startsWith("http") ? content.personal.github : `https://${content.personal.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-300 hover:underline"
                        >
                            • GitHub
                        </a>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-8 pb-8">
                {sectionOrder.map((sectionId) => renderSection(sectionId))}
            </div>

        </div>
    )
}