"use client";

import { useState } from "react";
import { Check, ChatText, Copy, Translate, Waveform } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CaptionPayload } from "@/hooks/use-caption-channel";
import {
  CAPTION_SIZES,
  getCaptionPresentation,
  getCaptionRoleClass,
  getCaptionSizeClass,
  getCaptionStateClass,
  type CaptionSize,
} from "@/lib/caption-presentation";
import type { SonioxLanguageCode } from "@/lib/languages";
import { formatTranscript } from "@/lib/transcript-format";
import { cn } from "@/lib/utils";

type CaptionHistoryProps = {
  finalCaptions: CaptionPayload[];
  transcriptCaptions: CaptionPayload[];
  interimCaptions: CaptionPayload[];
  localParticipantIdentity: string;
  viewerLanguage: SonioxLanguageCode;
  role: CaptionPayload["role"];
  captionSize: CaptionSize;
  onCaptionSizeChange: (size: CaptionSize) => void;
};

function CaptionText({
  caption,
  isLocal,
}: {
  caption: CaptionPayload;
  isLocal: boolean;
}) {
  const presentation = getCaptionPresentation(caption, isLocal);

  return (
    <>
      <p className="caption-main text-foreground/90">{presentation.mainText}</p>
      {presentation.secondaryText ? (
        <div className="caption-secondary mt-2 flex gap-2 rounded-lg bg-primary/8 p-2.5">
          <Translate className="caption-speaker mt-0.5 shrink-0" size={15} weight="bold" />
          <div>
            <p className="mb-0.5 font-mono text-[10px] font-semibold uppercase">
              {presentation.secondaryLabel}
              {presentation.secondaryLanguage ? ` ${presentation.secondaryLanguage}` : ""}
            </p>
            <p>{presentation.secondaryText}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

export function CaptionHistory({
  finalCaptions,
  transcriptCaptions,
  interimCaptions,
  localParticipantIdentity,
  viewerLanguage,
  role,
  captionSize,
  onCaptionSizeChange,
}: CaptionHistoryProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const hasTranscript = transcriptCaptions.length > 0;

  async function copyTranscript() {
    const transcript = formatTranscript(transcriptCaptions, viewerLanguage);
    if (!transcript) return;

    try {
      await navigator.clipboard.writeText(transcript);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <SheetContent
      className={cn("caption-surface-history", getCaptionSizeClass(captionSize))}
    >
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <ChatText size={20} weight="bold" />
          字幕履歴
        </SheetTitle>
        <SheetDescription>
          この履歴はブラウザのメモリ内だけに保持され、ページを閉じると消去されます。
        </SheetDescription>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex items-center gap-1 rounded-xl border bg-muted/35 p-1"
            role="group"
            aria-label="字幕サイズ"
          >
            <span className="px-1.5 text-xs font-semibold text-muted-foreground">
              サイズ
            </span>
            {CAPTION_SIZES.map((size) => (
              <Button
                key={size}
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "size-8 px-0 text-xs text-muted-foreground",
                  captionSize === size &&
                    "bg-teal-100 text-teal-900 hover:bg-teal-100 hover:text-teal-900",
                )}
                onClick={() => onCaptionSizeChange(size)}
                aria-label={`字幕サイズ ${size}`}
                aria-pressed={captionSize === size}
              >
                {size}
              </Button>
            ))}
          </div>

          {role === "doctor" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit border-slate-300/70 text-slate-700 hover:bg-teal-50 hover:text-teal-800"
              onClick={copyTranscript}
              disabled={!hasTranscript}
              aria-label="確定済み会話ログ全文をコピー"
            >
              {copyStatus === "copied" ? (
                <Check size={16} weight="bold" />
              ) : (
                <Copy size={16} weight="bold" />
              )}
              {copyStatus === "copied"
                ? "コピーしました"
                : copyStatus === "error"
                  ? "コピーできませんでした"
                  : "全文をコピー"}
            </Button>
          ) : null}
        </div>
      </SheetHeader>

      <ScrollArea className="min-h-0 flex-1 px-6 pb-6">
        {finalCaptions.length === 0 && interimCaptions.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed bg-muted/35 p-6 text-center">
            <Waveform className="mx-auto text-muted-foreground" size={28} />
            <p className="mt-3 text-sm font-semibold">まだ字幕はありません</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              発話を検出すると、話者名と時刻がここに表示されます。
            </p>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {finalCaptions.map((caption, index) => {
              const presentation = getCaptionPresentation(
                caption,
                caption.participantIdentity === localParticipantIdentity,
              );

              return (
                <article
                  key={`${caption.participantIdentity}-${caption.timestamp}-${index}`}
                  className={cn(
                    "rounded-r-lg py-1 pl-3",
                    getCaptionRoleClass(caption.role),
                    getCaptionStateClass(caption.isFinal),
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <p className="caption-speaker text-sm font-semibold">
                      {caption.participantName}
                    </p>
                    {presentation.mainLanguage ? (
                      <Badge variant="secondary">{presentation.mainLanguage}</Badge>
                    ) : null}
                    <time className="ml-auto font-mono text-[11px] text-muted-foreground">
                      {formatTime(caption.timestamp)}
                    </time>
                  </div>
                  <CaptionText
                    caption={caption}
                    isLocal={caption.participantIdentity === localParticipantIdentity}
                  />
                </article>
              );
            })}

            {interimCaptions.map((caption) => (
              <article
                key={`interim-${caption.participantIdentity}`}
                className={cn(
                  "rounded-r-lg py-1 pl-3",
                  getCaptionRoleClass(caption.role),
                  getCaptionStateClass(caption.isFinal),
                )}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <p className="caption-speaker text-sm font-semibold">
                    {caption.participantName}
                  </p>
                  <Badge variant="outline">認識中</Badge>
                </div>
                <CaptionText
                  caption={caption}
                  isLocal={caption.participantIdentity === localParticipantIdentity}
                />
              </article>
            ))}
          </div>
        )}
      </ScrollArea>
    </SheetContent>
  );
}
