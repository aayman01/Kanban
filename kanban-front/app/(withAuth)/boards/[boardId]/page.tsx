import { BoardView } from "@/components/boards/board-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Board",
};

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  return <BoardView key={boardId} boardId={boardId} />;
}
