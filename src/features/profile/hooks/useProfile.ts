import { demoProfile } from "../data/demo-profile";
import { useState } from "react";
import { useAuth } from "@/features/auth";
import { getProfileDemoData } from "../profile.service";
export function useProfile() {
  const {
    peonyImage,
    wishlistItems,
    recentOrders,
    tabs
  } = getProfileDemoData();
  const {
    user,
    logout
  } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(structuredClone(demoProfile));
  const [editData, setEditData] = useState(profile);
  const statusColor = (s: string) => s === "Delivered" ? "#7A9E7E" : s === "Processing" ? "#C17B8A" : "#D4A020";

  // Redirect to login if not authenticated
  const toggleEdit = () => {
    if (editing) setProfile(editData);
    setEditing(!editing);
  };
  return {
    user,
    logout,
    activeTab,
    setActiveTab,
    editing,
    setEditing,
    profile,
    setProfile,
    editData,
    setEditData,
    statusColor,
    peonyImage,
    wishlistItems,
    recentOrders,
    tabs,
    toggleEdit
  };
}
export type ProfileModel = ReturnType<typeof useProfile>;
