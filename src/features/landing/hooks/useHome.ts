import { getHomeDemoData } from "../home.service";
export function useHome() {
  return getHomeDemoData();
}
export type HomeModel = ReturnType<typeof useHome>;
