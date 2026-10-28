// src/components/chat/useChatPanel.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

type Lang = "es" | "en";

export function useChatPanel(lang: Lang) {
    const [input, setInput] = useState("");
    const [petStatus, setPetStatus] = useState("")
    const listRef = useRef<HTMLDivElement>(null);

    const transport = useMemo(
        () => new DefaultChatTransport({ api: "/api/chat", headers: { "x-locale": lang } }),
        [lang],
    );

    const { messages, sendMessage, status, error, stop } = useChat({ transport });
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