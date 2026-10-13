import { ProfileView, useProfile } from "@/features/profile";
export default function ProfilePage() {
  const model = useProfile();
  return <ProfileView {...model} />;
}
