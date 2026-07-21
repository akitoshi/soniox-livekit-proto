"use client";

import { useEffect, useMemo, useState } from "react";

import type { CaptionPayload } from "@/hooks/use-caption-channel";
import { getCaptionPresentation } from "@/lib/caption-presentation";
import { cn } from "@/lib/utils";

type CaptionOverlayProps = {
  enabled: boolean;
  finalCaptions: CaptionPayload[];
  interimCaptions: CaptionPayload[];
  localParticipantIdentity: string;
};

const CAPTION_VISIBLE_MS = 12_000;

export function CaptionOverlay({
  enabled,
  finalCaptions,
  interimCaptions,
  localParticipantIdentity,
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
      className="consultation-caption-safe pointer-events-none absolute z-20 mx-auto flex max-w-3xl flex-col items-center gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {captions.map((caption) => {
        const presentation = getCaptionPresentation(
          caption,
          caption.participantIdentity === localParticipantIdentity,
        );

        return (
          <div
            key={`${caption.participantIdentity}-${caption.timestamp}-${caption.isFinal}`}
            className={cn(
              "max-w-full animate-[caption-in_180ms_ease-out] rounded-xl border border-white/10 bg-slate-950/82 px-4 py-2.5 text-center text-sm text-slate-50 shadow-lg backdrop-blur-md md:text-base",
              !caption.isFinal && "text-slate-300/65",
            )}
          >
            <div>
              <span className="mr-2 font-semibold text-teal-200">
                {caption.participantName}
              </span>
              {presentation.mainLanguage ? (
                <span className="mr-2 font-mono text-[10px] font-semibold uppercase text-teal-200/80">
                  {presentation.mainLanguage}
                </span>
              ) : null}
              <span>{presentation.mainText}</span>
            </div>
            {presentation.secondaryText ? (
              <div className="mt-1 border-t border-white/10 pt-1.5 text-xs leading-5 text-slate-400 md:text-sm">
                <span className="mr-2 font-semibold text-slate-500">
                  {presentation.secondaryLabel}
                  {presentation.secondaryLanguage
                    ? ` ${presentation.secondaryLanguage}`
                    : ""}
                </span>
                <span>{presentation.secondaryText}</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
