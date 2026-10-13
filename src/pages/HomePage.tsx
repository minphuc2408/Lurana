import { HomeView, useHome } from "@/features/landing";
export default function HomePage() {
  const model = useHome();
  return <HomeView {...model} />;
}
