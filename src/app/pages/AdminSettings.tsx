import { useState } from "react";
import { Save, Bell, Shield, Store, Palette, Mail, Phone } from "lucide-react";

export function AdminSettings() {
  const [store, setStore] = useState({ name: "Lunara Flower Shop", email: "hello@lunara.ph", phone: "+63 2 8888 0000", address: "12 Petal Lane, Makati City, Metro Manila", currency: "PHP", timezone: "Asia/Manila" });
  const [notifications, setNotifications] = useState({ newOrder: true, lowStock: true, newRequest: true, emailDigest: false });
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const inputStyle = { border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9", borderRadius: "12px", padding: "10px 14px", width: "100%" };
  const labelStyle = { display: "block" as const, fontSize: "0.72rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: "6px" };
  const sectionCard = { backgroundColor: "white", border: "1px solid #F0DDD5", borderRadius: "16px", padding: "24px", marginBottom: "20px" };

  return (
    <div className="p-6 max-w-3xl" style={{ fontFamily: "'Jost', sans-serif" }}>
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5" style={{ backgroundColor: "#EDF7EF", border: "1px solid #B8E0C0" }}>
          <Save size={15} style={{ color: "#7A9E7E" }} />
          <span style={{ fontSize: "0.85rem", color: "#5A8060" }}>Settings saved successfully!</span>
        </div>
      )}

      {/* Store Info */}
      <div style={sectionCard}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F9EDE9" }}>
            <Store size={16} style={{ color: "#C17B8A" }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", fontWeight: 600 }}>Store Information</h2>
            <p style={{ fontSize: "0.72rem", color: "#9A7080" }}>Basic details about your shop</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Store Name</label>
            <input style={inputStyle} value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Currency</label>
            <select style={inputStyle} value={store.currency} onChange={(e) => setStore({ ...store, currency: e.target.value })}>
              <option>PHP</option><option>USD</option><option>EUR</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}><Mail size={10} style={{ display: "inline", marginRight: "4px" }} />Email</label>
            <input style={inputStyle} type="email" value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}><Phone size={10} style={{ display: "inline", marginRight: "4px" }} />Phone</label>
            <input style={inputStyle} value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Timezone</label>
            <select style={inputStyle} value={store.timezone} onChange={(e) => setStore({ ...store, timezone: e.target.value })}>
              <option>Asia/Manila</option><option>UTC</option><option>America/New_York</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div style={sectionCard}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FDF8E8" }}>
            <Bell size={16} style={{ color: "#D4A020" }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", fontWeight: 600 }}>Notification Settings</h2>
            <p style={{ fontSize: "0.72rem", color: "#9A7080" }}>Choose what alerts you receive</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { key: "newOrder", label: "New Order Received", desc: "Get notified when a customer places an order" },
            { key: "lowStock", label: "Low Stock Alert", desc: "Alert when product stock falls below threshold" },
            { key: "newRequest", label: "New Custom Request", desc: "Notification for incoming custom flower requests" },
            { key: "emailDigest", label: "Daily Email Digest", desc: "Receive a summary of the day's activity" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0DDD5" }}>
              <div>
                <div style={{ fontSize: "0.88rem", color: "#3D2228", fontWeight: 500 }}>{n.label}</div>
                <div style={{ fontSize: "0.78rem", color: "#9A7080", marginTop: "2px" }}>{n.desc}</div>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key as keyof typeof notifications] })}
                className="relative flex-shrink-0"
                style={{
                  width: "42px",
                  height: "24px",
                  borderRadius: "999px",
                  backgroundColor: notifications[n.key as keyof typeof notifications] ? "#C17B8A" : "#E0D0D5",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  padding: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: notifications[n.key as keyof typeof notifications] ? "21px" : "3px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div style={sectionCard}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EDF3FC" }}>
            <Shield size={16} style={{ color: "#5B8DD9" }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", fontWeight: 600 }}>Security</h2>
            <p style={{ fontSize: "0.72rem", color: "#9A7080" }}>Admin account security settings</p>
          </div>
        </div>
        {[
          { label: "Current Password", placeholder: "••••••••" },
          { label: "New Password", placeholder: "Minimum 8 characters" },
          { label: "Confirm New Password", placeholder: "Repeat new password" },
        ].map((f) => (
          <div key={f.label} className="mb-4">
            <label style={labelStyle}>{f.label}</label>
            <input type="password" placeholder={f.placeholder} style={inputStyle} />
          </div>
        ))}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-3 rounded-full"
        style={{ backgroundColor: "#C17B8A", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", letterSpacing: "0.05em" }}
      >
        <Save size={15} /> Save All Settings
      </button>
    </div>
  );
}
