import type { ComponentType } from "react";
import type { UIMessage } from "ai";
import { getToolName, isToolUIPart } from "ai";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { toolRegistry, type ToolRegistryName } from "./toolRegistry";

interface AssistantMessageProps {
    message: UIMessage;
    isStreaming: boolean;
    labels: { loading: string };
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

                    switch (part.state) {
                        case "input-streaming":
                        case "input-available":
                            return (
                                <p key={i} role="status" className="self-start rounded-full border border-line bg-field px-3 py-1.5 font-sans text-xs text-soft">
                                    {labels.loading}
                                </p>
                            );
                        case "output-available":
                            return <Component key={i} {...(part.output as object)} />;
                        case "output-error":
                            return (
                                <p key={i} role="alert" className="font-sans text-sm text-red-500">
                                    {part.errorText}
                                </p>
                            );
                    }
                }

                return null;
            })}
        </div>
    );
}
