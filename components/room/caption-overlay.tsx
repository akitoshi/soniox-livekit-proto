"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { CaptionPayload } from "@/types/captions";

type CaptionOverlayProps = {
  enabled: boolean;
  finalCaptions: CaptionPayload[];
  interimCaptions: CaptionPayload[];
};

const CAPTION_VISIBLE_MS = 12_000;

export function CaptionOverlay({
  enabled,
  finalCaptions,
  interimCaptions,
}: CaptionOverlayProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const captions = useMemo(() => {
    const recentFinal = finalCaptions.filter(
      (caption) => now - caption.timestamp < CAPTION_VISIBLE_MS,
    );
    return [...recentFinal, ...interimCaptions]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-3);
  }, [finalCaptions, interimCaptions, now]);

  if (!enabled || captions.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-3 bottom-24 z-20 mx-auto flex max-w-3xl flex-col items-center gap-2 md:bottom-28"
      aria-live="polite"
      aria-atomic="false"
    >
      {captions.map((caption) => (
        <div
          key={`${caption.participantIdentity}-${caption.timestamp}-${caption.isFinal}`}
          className={cn(
            "max-w-full animate-[caption-in_180ms_ease-out] rounded-xl border border-white/10 bg-slate-950/82 px-4 py-2.5 text-center text-sm text-slate-50 shadow-lg backdrop-blur-md md:text-base",
            !caption.isFinal && "text-slate-200/65",
          )}
        >
          <div>
            <span className="mr-2 font-semibold text-teal-200">{caption.participantName}</span>
            <span>{caption.text}</span>
          </div>
          {caption.translation ? (
            <div className="mt-1 border-t border-white/10 pt-1.5 text-slate-50">
              {caption.translationLang ? (
                <span className="mr-2 font-mono text-[10px] font-semibold uppercase text-teal-200/80">
                  {caption.translationLang}
                </span>
              ) : null}
              <span>{caption.translation}</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
