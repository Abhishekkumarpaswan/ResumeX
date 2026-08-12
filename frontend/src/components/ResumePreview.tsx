import { getTemplate } from "./resume-templates"
import { ResumeContent } from "./resume-templates/types"

export default function ResumePreview({
  content,
  sectionOrder,
  templateId = "classic",
}: {
  content: ResumeContent
  sectionOrder?: string[]
  templateId?: string
}) {
  const { component: TemplateComponent } = getTemplate(templateId)
  return <TemplateComponent content={content} sectionOrder={sectionOrder} />
}