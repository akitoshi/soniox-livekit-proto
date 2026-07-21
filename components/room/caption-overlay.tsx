"use client";

import { useEffect, useMemo, useState } from "react";

import type { CaptionPayload } from "@/hooks/use-caption-channel";
import {
  getCaptionOverlayItems,
  getCaptionPresentation,
  getCaptionRoleClass,
  getCaptionSizeClass,
  getCaptionStateClass,
  type CaptionSize,
} from "@/lib/caption-presentation";
import { cn } from "@/lib/utils";

type CaptionOverlayProps = {
  enabled: boolean;
  finalCaptions: CaptionPayload[];
  interimCaptions: CaptionPayload[];
  localParticipantIdentity: string;
  captionSize: CaptionSize;
};

export function CaptionOverlay({
  enabled,
  finalCaptions,
  interimCaptions,
  localParticipantIdentity,
  captionSize,
}: CaptionOverlayProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const captions = useMemo(() => {
    return getCaptionOverlayItems(finalCaptions, interimCaptions, now);
  }, [finalCaptions, interimCaptions, now]);

  if (!enabled || captions.length === 0) return null;

  return (
    <div
      className={cn(
        "caption-surface-overlay consultation-caption-safe pointer-events-none absolute z-20 mx-auto flex max-w-3xl flex-col items-center gap-2",
        getCaptionSizeClass(captionSize),
      )}
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
              "max-w-full animate-[caption-in_180ms_ease-out] break-words rounded-xl border border-white/10 bg-slate-950/82 px-4 py-2.5 text-left text-slate-50 shadow-lg backdrop-blur-md",
              getCaptionRoleClass(caption.role),
              getCaptionStateClass(caption.isFinal),
            )}
          >
            <div className="caption-main">
              <span className="caption-speaker mr-2 text-sm font-semibold">
                {caption.participantName}
              </span>
              {presentation.mainLanguage ? (
                <span className="caption-speaker mr-2 font-mono text-[10px] font-semibold uppercase">
                  {presentation.mainLanguage}
                </span>
              ) : null}
              <span>{presentation.mainText}</span>
            </div>
            {presentation.secondaryText ? (
              <div className="caption-secondary mt-1 border-t border-white/10 pt-1.5">
                <span className="mr-2 font-semibold">
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
