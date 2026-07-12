import { RoomClient } from "@/components/room/room-client";

type RoomPageProps = {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { roomName } = await params;
  const { name } = await searchParams;
  const displayName = Array.isArray(name) ? name[0] : (name ?? "");

  return <RoomClient roomName={decodeURIComponent(roomName)} displayName={displayName} />;
}
