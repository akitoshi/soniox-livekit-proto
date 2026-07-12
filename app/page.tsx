import { randomUUID } from "node:crypto";

import { LobbyForm } from "@/components/lobby-form";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <LobbyForm initialRoomName={`consult-${randomUUID().slice(0, 6)}`} />;
}
