// src/components/chat/useChatPanel.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { TRACKS } from "../../music-player/tracks";
import { resolveTrackIndex } from "../../music-player/player-core";
import { readNowPlaying, sendPlayerCommand, type PlayerCommand } from "../../music-player/player-store";
import type { PlaybackProps } from "../../../ai/ui-schema";

type Lang = "es" | "en";

function playbackOutput(fallback: string, mensaje: string): PlaybackProps {
    const state = readNowPlaying();
    if (!state) {
        return { titulo: "—", artista: "—", playing: false, mensaje: fallback };
    }
    return { titulo: state.title, artista: state.artist, playing: state.playing, mensaje };
}

export function useChatPanel(lang: Lang) {
    const [input, setInput] = useState("");
    const [petStatus, setPetStatus] = useState("")
    const listRef = useRef<HTMLDivElement>(null);

    const transport = useMemo(
        () => new DefaultChatTransport({ api: "/api/chat", headers: { "x-locale": lang } }),
        [lang],
    );

    const { messages, sendMessage, status, error, stop, addToolOutput } = useChat({
        transport,
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        onToolCall({ toolCall }) {
            if (toolCall.dynamic) return;

            if (toolCall.toolName === "playTrack") {
                const query = (toolCall.input as { track?: string } | undefined)?.track ?? "";
                const index = resolveTrackIndex(query, TRACKS);
                if (index === -1) {
                    addToolOutput({
                        tool: "playTrack",
                        toolCallId: toolCall.toolCallId,
                        output: playbackOutput(
                            `No hay un track que coincida con "${query}".`,
                            `No encontré "${query}"`,
                        ),
                    });
                    return;
                }
                sendPlayerCommand({ type: "select", index });
                addToolOutput({
                    tool: "playTrack",
                    toolCallId: toolCall.toolCallId,
                    output: playbackOutput("El reproductor no está disponible.", "Elegido"),
                });
                return;
            }

            if (toolCall.toolName === "controlTrack") {
                const action = (toolCall.input as { action?: string } | undefined)?.action;
                const command = action === "next" || action === "prev" || action === "pause" || action === "play"
                    ? ({ type: action } as PlayerCommand)
                    : null;
                if (!command) {
                    addToolOutput({
                        tool: "controlTrack",
                        toolCallId: toolCall.toolCallId,
                        output: playbackOutput("Acción desconocida.", "Sin cambios"),
                    });
                    return;
                }
                sendPlayerCommand(command);
                addToolOutput({
                    tool: "controlTrack",
                    toolCallId: toolCall.toolCallId,
                    output: playbackOutput("El reproductor no está disponible.", action === "pause" ? "En pausa" : "Listo"),
                });
            }
        },
    });
    const isBusy = status === "submitted" || status === "streaming";

    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, status]);

    useEffect(() => {
        if (status === "submitted") setPetStatus("send");
        if (status === "ready") setPetStatus("done");
        if (status === "error") setPetStatus("error");
    }, [status]);

    const send = (text: string) => {
        const value = text.trim();
        if (!value || isBusy) return;
        sendMessage({ text: value });
        setInput("");
    };

    const onInputChange = (value: string) => {
        setInput(value);
        setPetStatus("typing");
    };

    return { messages, status, error, isBusy, input, setInput: onInputChange, send, stop, listRef, petStatus };
}