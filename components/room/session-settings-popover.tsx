"use client";

import { useState } from "react";
import { Gear } from "@phosphor-icons/react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  SONIOX_LANGUAGES,
  isSonioxLanguageCode,
  type SonioxLanguageCode,
} from "@/lib/languages";
import { cn } from "@/lib/utils";
import { sanitizeExtraTerms } from "@/lib/session-settings";

type SessionSettingsPopoverProps = {
  patientLanguage: SonioxLanguageCode;
  onPatientLanguageChange: (language: SonioxLanguageCode) => void;
  extraTerms: readonly string[];
  onExtraTermsChange: (terms: string[]) => void;
};

export function SessionSettingsPopover({
  patientLanguage,
  onPatientLanguageChange,
  extraTerms,
  onExtraTermsChange,
}: SessionSettingsPopoverProps) {
  const [extraTermsDraft, setExtraTermsDraft] = useState(() =>
    extraTerms.join("\n"),
  );

  function applyExtraTerms() {
    const sanitized = sanitizeExtraTerms(extraTermsDraft.split(/[\n,]+/u));
    setExtraTermsDraft(sanitized.join("\n"));
    onExtraTermsChange(sanitized);
  }

  return (
    <details className="group relative">
      <summary
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "cursor-pointer list-none text-slate-200 hover:bg-white/10 hover:text-white [&::-webkit-details-marker]:hidden",
        )}
        aria-label="通話設定を開く"
      >
        <Gear size={20} weight="bold" />
      </summary>
      <div
        role="dialog"
        aria-label="通話設定"
        className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-slate-900 p-4 text-slate-100 shadow-2xl"
      >
        <p className="text-sm font-semibold">通話設定</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          変更すると双方の字幕セッションが新しい設定で再開します。
        </p>
        <div className="mt-4 space-y-2">
          <label htmlFor="in-call-patient-language" className="text-xs font-semibold text-slate-200">
            患者の言語
          </label>
          <select
            id="in-call-patient-language"
            value={patientLanguage}
            onChange={(event) => {
              if (isSonioxLanguageCode(event.target.value)) {
                onPatientLanguageChange(event.target.value);
              }
            }}
            aria-label="患者の言語"
            className="h-11 w-full rounded-xl border border-white/15 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition-[border-color,box-shadow] focus-visible:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-400/25"
          >
            {SONIOX_LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName} ({language.jaName})
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 space-y-2">
          <label htmlFor="in-call-extra-terms" className="text-xs font-semibold text-slate-200">
            カスタム語彙
          </label>
          <textarea
            id="in-call-extra-terms"
            value={extraTermsDraft}
            onChange={(event) => setExtraTermsDraft(event.target.value)}
            aria-label="カスタム語彙"
            aria-describedby="in-call-extra-terms-help"
            rows={5}
            placeholder={"例: 病院名\n薬剤名, 専門用語"}
            className="w-full resize-y rounded-xl border border-white/15 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition-[border-color,box-shadow] placeholder:text-slate-600 focus-visible:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-400/25"
          />
          <p id="in-call-extra-terms-help" className="text-[11px] leading-5 text-slate-400">
            改行またはカンマ区切り・最大50語。端末には保存されません。
          </p>
          <Button
            type="button"
            size="sm"
            className="w-full bg-teal-600 text-white hover:bg-teal-500"
            onClick={applyExtraTerms}
          >
            語彙を適用
          </Button>
        </div>
      </div>
    </details>
  );
}
