"use client";

import { Gear } from "@phosphor-icons/react";

import { buttonVariants } from "@/components/ui/button";
import {
  SONIOX_LANGUAGES,
  isSonioxLanguageCode,
  type SonioxLanguageCode,
} from "@/lib/languages";
import { cn } from "@/lib/utils";

type SessionSettingsPopoverProps = {
  patientLanguage: SonioxLanguageCode;
  onPatientLanguageChange: (language: SonioxLanguageCode) => void;
};

export function SessionSettingsPopover({
  patientLanguage,
  onPatientLanguageChange,
}: SessionSettingsPopoverProps) {
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
      </div>
    </details>
  );
}
