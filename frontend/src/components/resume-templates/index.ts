import { ComponentType } from "react"
import ClassicTemplate from "./ClassicTemplate"
import ModernTemplate from "./ModernTemplate"
import MinimalTemplate from "./MinimalTemplate"
import { ResumeTemplateProps } from "./types"

export interface TemplateDefinition {
    id: string
    name: string
    component: ComponentType<ResumeTemplateProps>
}

export const RESUME_TEMPLATES: TemplateDefinition[] = [
    { id: "classic", name: "Classic", component: ClassicTemplate },
    { id: "modern", name: "Modern", component: ModernTemplate },
    { id: "minimal", name: "Minimal", component: MinimalTemplate },
]

export function getTemplate(id: string): TemplateDefinition {
    return RESUME_TEMPLATES.find((t) => t.id === id) || RESUME_TEMPLATES[0]
}

export * from "./types"