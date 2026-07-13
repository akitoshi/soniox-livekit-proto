import { RoomClient } from "@/components/room/room-client";
import { isSonioxLanguageCode } from "@/lib/languages";

type RoomPageProps = {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{
    name?: string | string[];
    role?: string | string[];
    lang?: string | string[];
  }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { roomName } = await params;
  const { name, role, lang } = await searchParams;
  const displayName = Array.isArray(name) ? name[0] : (name ?? "");
  const requestedRole = Array.isArray(role) ? role[0] : role;
  const requestedLanguage = (Array.isArray(lang) ? lang[0] : lang) ?? "";
  const safeRole = requestedRole === "doctor" || requestedRole === "patient"
    ? requestedRole
    : "patient";
  const safePatientLanguage = isSonioxLanguageCode(requestedLanguage)
    ? requestedLanguage
    : "en";

  return (
    <RoomClient
      roomName={decodeURIComponent(roomName)}
      displayName={displayName}
      role={safeRole}
      patientLanguage={safePatientLanguage}
    />
  );
}
