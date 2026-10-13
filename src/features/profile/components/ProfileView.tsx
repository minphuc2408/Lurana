import { ProfileSettings } from "./ProfileSettings";
import { ProfileWishlist } from "./ProfileWishlist";
import { ProfileOrders } from "./ProfileOrders";
import { ProfileDetails } from "./ProfileDetails";
import { cn } from "@/shared/lib/utils";
import { Camera, Package } from "lucide-react";
import { Link, Navigate } from "react-router";
import type { ProfileModel } from "../hooks/useProfile";
export function ProfileView(model: ProfileModel) {
  const {
    user,
    activeTab,
    setActiveTab,
    profile,
    peonyImage,
    tabs
  } = model;
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <div className="bg-lunara-cream [min-height:100vh] font-body">
      {/* Cover */}
      <div className="[height:200px] [background:linear-gradient(135deg,_#F9EDE9_0%,_#E8C5D0_50%,_#D4B896_100%)] [position:relative]">
        <div className="relative [position:absolute] [inset:0] [opacity:0.15]"><img src={peonyImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top" /></div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Avatar + Name */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-8 relative z-10">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 flex items-center justify-center shadow-lg bg-lunara-blush border-white [font-size:2.5rem]">
              🌸
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md bg-lunara-rose-strong [border:2px_solid_white]" aria-label="Change photo">
              <Camera size={14} color="white" />
            </button>
          </div>
          <div className="flex-1 pb-2">
            <h1 className="font-display [font-size:1.8rem] [font-weight:600] text-lunara-ink">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="[font-size:0.85rem] text-lunara-body">{profile.bio}</p>
          </div>
          <div className="pb-2 flex gap-3">
            <Link to="/orders" className="flex items-center gap-2 px-4 py-2 rounded-full bg-lunara-blush text-lunara-rose-strong [text-decoration:none] [font-size:0.82rem] [border:1px_solid_#F0DDD5]">
              <Package size={14} /> My Orders
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-lunara-border">
          {tabs.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-5 py-3 bg-transparent [border:none] [cursor:pointer] [font-size:0.85rem] [transition:all_0.2s] [letter-spacing:0.05em]", activeTab === tab ? "text-lunara-rose-strong" : "text-lunara-body", activeTab === tab ? "[border-bottom:2px_solid_#C17B8A]" : "[border-bottom:2px_solid_transparent]")}>
              {tab}
            </button>)}
        </div>

        {/* Profile Tab */}
        {activeTab === "Profile" && <ProfileDetails {...model} />}

        {/* Orders Tab */}
        {activeTab === "Orders" && <ProfileOrders {...model} />}

        {/* Wishlist Tab */}
        {activeTab === "Wishlist" && <ProfileWishlist {...model} />}

        {/* Settings Tab */}
        {activeTab === "Settings" && <ProfileSettings {...model} />}
      </div>
    </div>;
}
