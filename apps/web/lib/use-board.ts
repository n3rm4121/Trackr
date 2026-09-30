import { useContext } from "react";
import { BoardContext } from "./board-context";

export function useBoard() {
  const store = useContext(BoardContext);
  if (!store) {
    throw new Error("useBoard must be used inside a BoardProvider");
  }
  return store;
}
