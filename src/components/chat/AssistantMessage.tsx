import type { ComponentType } from "react";
import type { UIMessage } from "ai";
import { getToolName, isToolUIPart } from "ai";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { toolRegistry, type ToolRegistryName } from "./toolRegistry";
import { ToolStatus } from "./ToolStatus";

interface AssistantMessageProps {
    message: UIMessage;
    isStreaming: boolean;
    labels: { loading: string; tools?: Record<string, string> };
}

export function AssistantMessage({ message, isStreaming, labels }: AssistantMessageProps) {
    return (
        <div className="flex w-full max-w-[42rem] text-left flex-col gap-2.5 self-start">
            {message.parts.map((part, i) => {
                if (part.type === "text" && part.text) {
                    return (
                        <Streamdown
                            key={i}
                            plugins={{ code, mermaid, math, cjk }}
                            shikiTheme={["dracula", "dracula"]}
                            controls={false}
                            isAnimating={isStreaming}
                            className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-badge px-4 py-2.5 font-sans text-[0.95rem] leading-[1.6] text-badge-ink"
                        >
                            {part.text}
                        </Streamdown>
                    );
                }

                if (isToolUIPart(part)) {
                    const name = getToolName(part);
                    if (!(name in toolRegistry)) return null;
                    const Component = toolRegistry[name as ToolRegistryName] as ComponentType;
                    // El nombre de la herramienta se dice explícitamente: el
                    // estado de espera no es un "cargando" genérico, es "estoy
                    // buscando tracks" o "estoy preparando el contacto".
                    const runningLabel = labels.tools?.[name] ?? labels.loading;

                    switch (part.state) {
                        case "input-streaming":
                        case "input-available":
                            return <ToolStatus key={i} label={runningLabel} />;
                        case "output-available":
                            return <Component key={i} {...(part.output as object)} />;
                        case "output-error":
                            return (
                                <p key={i} role="alert" className="font-sans text-sm text-red-500">
                                    {part.errorText}
                                </p>
                            );
                        default:
                            // `approval-*` y `output-denied` no se usan todavía:
                            // sin rama explícita el part no pinta nada.
                            return null;
                    }
                }

                return null;
            })}
        </div>
    );
}
