export function TypingIndicator() {
    return (
        <div className="self-start rounded-2xl rounded-bl-md bg-badge px-4 py-3" aria-hidden="true">
            <span className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="size-1.5 animate-bounce rounded-full bg-badge-ink/60"
                        style={{ animationDelay: `${i * 140}ms` }}
                    />
                ))}
            </span>
        </div>
    );
}
