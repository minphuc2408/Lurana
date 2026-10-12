import { useState } from "react";
import { Camera, Edit2, Save, MapPin, Phone, Mail, Package, Heart, Star, Settings, LogOut } from "lucide-react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

const peonyImage = "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjJib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=400";
const lavenderImage = "https://images.unsplash.com/photo-1653821355168-144695e5c0e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXZlbmRlciUyMHB1cnBsZSUyMGZsb3JhbCUyMGVsZWdhbnQlMjB3ZWRkaW5nfGVufDF8fHx8MTc3MzU1Mjk2MXww&ixlib=rb-4.1.0&q=80&w=400";

const wishlistItems = [
  { id: 1, name: "Blush Peony Bouquet", price: "₱1,200", image: peonyImage },
  { id: 2, name: "Lavender Dreams", price: "₱950", image: lavenderImage },
];

const recentOrders = [
  { id: "LN-2026-1042", date: "Mar 10, 2026", items: "Blush Peony × 1", total: "₱1,350", status: "Delivered" },
  { id: "LN-2026-0987", date: "Feb 22, 2026", items: "White Lily × 2, Lavender × 1", total: "₱3,100", status: "Delivered" },
  { id: "LN-2026-0843", date: "Jan 14, 2026", items: "Garden Party Mix", total: "₱1,650", status: "Delivered" },
];

const tabs = ["Profile", "Orders", "Wishlist", "Settings"];

export function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@email.com",
    phone: "+63 912 345 6789",
    address: "456 Sampaguita Street, Makati City",
    bio: "Flower lover & occasional gardener. Can't live without peonies!",
  });
  const [editData, setEditData] = useState(profile);

  const statusColor = (s: string) => s === "Delivered" ? "#7A9E7E" : s === "Processing" ? "#C17B8A" : "#D4A020";

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ backgroundColor: "#FDF6F0", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }}>
      {/* Cover */}
      <div style={{ height: "200px", background: "linear-gradient(135deg, #F9EDE9 0%, #E8C5D0 50%, #D4B896 100%)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${peonyImage})`, backgroundSize: "cover", backgroundPosition: "center top", opacity: 0.15 }} />
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Avatar + Name */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 mb-8 relative z-10">
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full border-4 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: "#F9EDE9", borderColor: "white", fontSize: "2.5rem" }}
            >
              🌸
            </div>
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
              style={{ backgroundColor: "#C17B8A", border: "2px solid white" }}
            >
              <Camera size={14} color="white" />
            </button>
          </div>
          <div className="flex-1 pb-2">
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 600, color: "#3D2228" }}>
              {profile.firstName} {profile.lastName}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#9A7080" }}>{profile.bio}</p>
          </div>
          <div className="pb-2 flex gap-3">
            <Link to="/orders" className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: "#F9EDE9", color: "#C17B8A", textDecoration: "none", fontSize: "0.82rem", border: "1px solid #F0DDD5" }}>
              <Package size={14} /> My Orders
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: "#F0DDD5" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: activeTab === tab ? "#C17B8A" : "#9A7080",
                borderBottom: `2px solid ${activeTab === tab ? "#C17B8A" : "transparent"}`,
                transition: "all 0.2s",
                letterSpacing: "0.05em"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "Profile" && (
          <div className="grid md:grid-cols-3 gap-8 pb-16">
            <div className="md:col-span-2">
              <div className="rounded-2xl p-6" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#3D2228" }}>Personal Information</h2>
                  <button
                    onClick={() => {
                      if (editing) setProfile(editData);
                      setEditing(!editing);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: editing ? "#C17B8A" : "#F9EDE9", color: editing ? "white" : "#C17B8A", border: "none", cursor: "pointer", fontSize: "0.82rem" }}
                  >
                    {editing ? <><Save size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "firstName", label: "First Name" },
                    { key: "lastName", label: "Last Name" },
                    { key: "email", label: "Email Address" },
                    { key: "phone", label: "Phone Number" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label style={{ display: "block", fontSize: "0.72rem", color: "#9A7080", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
                        {field.label}
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editData[field.key as keyof typeof editData]}
                          onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                          className="w-full rounded-xl px-4 py-2"
                          style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                        />
                      ) : (
                        <p style={{ fontSize: "0.9rem", color: "#3D2228" }}>{profile[field.key as keyof typeof profile]}</p>
                      )}
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#9A7080", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Address</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        className="w-full rounded-xl px-4 py-2"
                        style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                      />
                    ) : (
                      <p style={{ fontSize: "0.9rem", color: "#3D2228" }}>{profile.address}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label style={{ display: "block", fontSize: "0.72rem", color: "#9A7080", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Bio</label>
                    {editing ? (
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        rows={2}
                        className="w-full rounded-xl px-4 py-2"
                        style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9", resize: "none" }}
                      />
                    ) : (
                      <p style={{ fontSize: "0.9rem", color: "#3D2228" }}>{profile.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", marginBottom: "16px" }}>Quick Info</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: <Mail size={14} />, text: profile.email },
                    { icon: <Phone size={14} />, text: profile.phone },
                    { icon: <MapPin size={14} />, text: "Makati City" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span style={{ color: "#C17B8A" }}>{item.icon}</span>
                      <span style={{ fontSize: "0.82rem", color: "#6B4C55" }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ backgroundColor: "#F9EDE9", border: "1px solid #F0DDD5" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", marginBottom: "12px" }}>My Stats</h3>
                {[
                  { label: "Orders Placed", value: "12" },
                  { label: "Flowers Gifted", value: "47+" },
                  { label: "Member Since", value: "Jan 2025" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between py-2" style={{ borderBottom: "1px solid #F0DDD5" }}>
                    <span style={{ fontSize: "0.82rem", color: "#6B4C55" }}>{s.label}</span>
                    <span style={{ fontSize: "0.88rem", color: "#3D2228", fontWeight: 500 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "Orders" && (
          <div className="pb-16">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
              {recentOrders.map((order, i) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4"
                  style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid #F0DDD5" : "none" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F9EDE9" }}>
                      <Package size={18} style={{ color: "#C17B8A" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#3D2228", fontWeight: 500 }}>{order.id}</div>
                      <div style={{ fontSize: "0.78rem", color: "#9A7080" }}>{order.date} · {order.items}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#C17B8A", fontWeight: 600 }}>{order.total}</span>
                    <span className="px-3 py-1 rounded-full" style={{ backgroundColor: `${statusColor(order.status)}20`, color: statusColor(order.status), fontSize: "0.75rem", fontWeight: 500 }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === "Wishlist" && (
          <div className="pb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {wishlistItems.map((item) => (
                <div key={item.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
                  <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="p-4">
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem", color: "#3D2228" }}>{item.name}</h3>
                    <p style={{ fontSize: "0.88rem", color: "#C17B8A", fontWeight: 500, marginTop: "4px" }}>{item.price}</p>
                    <button className="w-full mt-3 py-2 rounded-full flex items-center justify-center gap-1"
                      style={{ backgroundColor: "#F9EDE9", border: "none", cursor: "pointer", fontSize: "0.78rem", color: "#C17B8A" }}>
                      <Heart size={12} fill="#C17B8A" /> Wishlisted
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "Settings" && (
          <div className="max-w-xl pb-16">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
              {[
                { icon: <Settings size={18} />, label: "Account Settings", desc: "Update your account preferences" },
                { icon: <Star size={18} />, label: "Notification Settings", desc: "Manage email and push notifications" },
                { icon: <Heart size={18} />, label: "Privacy Settings", desc: "Control your data and visibility" },
              ].map((item, i, arr) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-4 p-5 text-left"
                  style={{ background: "none", border: "none", cursor: "pointer", borderBottom: i < arr.length - 1 ? "1px solid #F0DDD5" : "none" }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F9EDE9" }}>
                    <span style={{ color: "#C17B8A" }}>{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: "0.9rem", color: "#3D2228", fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: "0.78rem", color: "#9A7080" }}>{item.desc}</div>
                  </div>
                  <span style={{ color: "#C0A0A8" }}>›</span>
                </button>
              ))}
              <button
                className="w-full flex items-center gap-4 p-5 text-left"
                style={{ background: "none", border: "none", cursor: "pointer", borderTop: "1px solid #F0DDD5" }}
                onClick={logout}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFF0F0" }}>
                  <LogOut size={18} style={{ color: "#E8453C" }} />
                </div>
                <span style={{ fontSize: "0.9rem", color: "#E8453C" }}>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}