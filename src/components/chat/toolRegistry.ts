// src/components/chat/toolRegistry.ts
import type { ComponentType } from "react";
import { ProjectList } from "./ProjectList";
import { TechList } from "./TechList";
import { ContactCard } from "./ContactCard";
import type { ProjectListProps, TechListProps, ContactProps } from "../../ai/ui-schema";

export const toolRegistry = {
    displayProjects: ProjectList as ComponentType<ProjectListProps>,
    displayTechs: TechList as ComponentType<TechListProps>,
    displayContact: ContactCard as ComponentType<ContactProps>,
} satisfies Record<string, ComponentType<any>>;

export type ToolRegistryName = keyof typeof toolRegistry;