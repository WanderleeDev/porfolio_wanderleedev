import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { TRACKS } from "../music-player/tracks";
import { resolveTrackIndex } from "../music-player/player-core";
import { readNowPlaying, sendPlayerCommand, type PlayerCommand } from "../music-player/player-store";
import type { PlaybackProps } from "../../ai/ui-schema";

type Lang = "es" | "en";
type PetStatus = "idle" | "typing" | "send" | "done" | "error";

const ACTIONS = ["play", "pause", "next", "prev"] as const;
type Action = (typeof ACTIONS)[number];

function playbackOutput(mensaje: string): PlaybackProps {
    const state = readNowPlaying();
    return state
        ? { titulo: state.title, artista: state.artist, playing: state.playing, mensaje }
        : { titulo: "—", artista: "—", playing: false, mensaje };
}

export function useChatPanel(lang: Lang) {
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    const transport = useMemo(
        () => new DefaultChatTransport({ api: "/api/chat", headers: { "x-locale": lang } }),
        [lang],
    );

    const { messages, sendMessage, status, error, stop, addToolOutput } = useChat({
        transport,
        onToolCall({ toolCall }) {
            if (toolCall.dynamic) return;

            const reply = (output: PlaybackProps) => {
                addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output });
            };

            switch (toolCall.toolName) {
                case "playTrack": {
                    const query = (toolCall.input as { track?: string }).track ?? "";
                    const index = resolveTrackIndex(query, TRACKS);
                    if (index === -1) {
                        reply(playbackOutput(`No encontré "${query}"`));
                        break;
                    }
                    sendPlayerCommand({ type: "select", index });
                    reply(playbackOutput("Elegido"));
                    break;
                }

                case "controlTrack": {
                    const action = (toolCall.input as { action?: Action }).action;
                    if (!action || !ACTIONS.includes(action)) {
                        reply(playbackOutput("Acción desconocida"));
                        break;
                    }
                    sendPlayerCommand({ type: action } as PlayerCommand);
                    reply(playbackOutput(action === "pause" ? "En pausa" : "Listo"));
                    break;
                }
            }
        },
    });

    const isBusy = status === "submitted" || status === "streaming";

    const petStatus: PetStatus =
        status === "error" ? "error"
            : isBusy ? "send"
                : isTyping ? "typing"
                    : messages.length > 0 ? "done"
                        : "idle";

    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, status]);

    const send = useCallback(
        (text: string) => {
            const value = text.trim();
            if (!value || isBusy) return;
            sendMessage({ text: value });
            setInput("");
            setIsTyping(false);
        },
        [isBusy, sendMessage],
    );

    const handleInputChange = useCallback((value: string) => {
        setInput(value);
        setIsTyping(value.length > 0);
    }, []);

    return {
        messages,
        status,
        error,
        isBusy,
        input,
        setInput: handleInputChange,
        send,
        stop,
        listRef,
        petStatus,
    };
}