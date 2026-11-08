// src/components/chat/toolRegistry.ts
import type { ComponentType } from "react";
import { ProjectList } from "./ProjectList";
import { TechList } from "./TechList";
import { ContactCard } from "./ContactCard";
import { TrackList } from "./TrackList";
import { PlaybackChip } from "./PlaybackChip";
import type { ProjectListProps, TechListProps, ContactProps, TrackListProps, PlaybackProps } from "../../ai/ui-schema";

export const toolRegistry = {
    displayProjects: ProjectList as ComponentType<ProjectListProps>,
    displayTechs: TechList as ComponentType<TechListProps>,
    displayContact: ContactCard as ComponentType<ContactProps>,
    listTracks: TrackList as ComponentType<TrackListProps>,
    playTrack: PlaybackChip as ComponentType<PlaybackProps>,
    controlTrack: PlaybackChip as ComponentType<PlaybackProps>,
} satisfies Record<string, ComponentType<any>>;

export type ToolRegistryName = keyof typeof toolRegistry;
