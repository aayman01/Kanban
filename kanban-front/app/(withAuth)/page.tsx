import { BoardList } from "@/components/boards/board-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boards",
};

export default function HomePage() {
  return <BoardList />;
}
