import { cn } from "@/shared/lib/utils";
import { Edit2, Save, MapPin, Phone, Mail } from "lucide-react";
import type { ProfileModel } from "../hooks/useProfile";
export function ProfileDetails(model: ProfileModel) {
  const {
    editing,
    setEditing,
    profile,
    setProfile,
    editData,
    setEditData,
    toggleEdit
  } = model;
  // Redirect to login if not authenticated
  return <div className="grid md:grid-cols-3 gap-8 pb-16">
            <div className="md:col-span-2">
              <div className="rounded-2xl p-6 bg-white [border:1px_solid_#F0DDD5]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display [font-size:1.3rem] text-lunara-ink">Personal Information</h2>
                  <button onClick={toggleEdit} className={cn("flex items-center gap-2 px-4 py-2 rounded-full [border:none] [cursor:pointer] [font-size:0.82rem]", editing ? "bg-lunara-rose-strong" : "bg-lunara-blush", editing ? "text-white" : "text-lunara-rose-strong")}>
                    {editing ? <><Save size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[{
            key: "firstName",
            label: "First Name"
          }, {
            key: "lastName",
            label: "Last Name"
          }, {
            key: "email",
            label: "Email Address"
          }, {
            key: "phone",
            label: "Phone Number"
          }].map(field => <div key={field.key}>
                      <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:4px]" htmlFor={`profiledetails-1-${field.key}`}>
                        {field.label}
                      </label>
                      {editing ? <input type="text" value={editData[field.key as keyof typeof editData]} onChange={e => setEditData({
              ...editData,
              [field.key]: e.target.value
            })} className="w-full rounded-xl px-4 py-2 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={`profiledetails-1-${field.key}`} /> : <p className="[font-size:0.9rem] text-lunara-ink">{profile[field.key as keyof typeof profile]}</p>}
                    </div>)}
                  <div className="col-span-2">
                    <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:4px]" htmlFor={"profiledetails-2"}>Address</label>
                    {editing ? <input type="text" value={editData.address} onChange={e => setEditData({
              ...editData,
              address: e.target.value
            })} className="w-full rounded-xl px-4 py-2 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"profiledetails-2"} /> : <p className="[font-size:0.9rem] text-lunara-ink">{profile.address}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="[display:block] [font-size:0.72rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:4px]" htmlFor={"profiledetails-3"}>Bio</label>
                    {editing ? <textarea value={editData.bio} onChange={e => setEditData({
              ...editData,
              bio: e.target.value
            })} rows={2} className="w-full rounded-xl px-4 py-2 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [resize:none]" id={"profiledetails-3"} /> : <p className="[font-size:0.9rem] text-lunara-ink">{profile.bio}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl p-5 bg-white [border:1px_solid_#F0DDD5]">
                <h3 className="font-display [font-size:1.1rem] text-lunara-ink [margin-bottom:16px]">Quick Info</h3>
                <div className="flex flex-col gap-3">
                  {[{
            icon: <Mail size={14} />,
            text: profile.email
          }, {
            icon: <Phone size={14} />,
            text: profile.phone
          }, {
            icon: <MapPin size={14} />,
            text: "Makati City"
          }].map((item, i) => <div key={i} className="flex items-center gap-3">
                      <span className="text-lunara-rose-strong">{item.icon}</span>
                      <span className="[font-size:0.82rem] text-lunara-body">{item.text}</span>
                    </div>)}
                </div>
              </div>

              <div className="rounded-2xl p-5 bg-lunara-blush [border:1px_solid_#F0DDD5]">
                <h3 className="font-display [font-size:1.1rem] text-lunara-ink [margin-bottom:12px]">My Stats</h3>
                {[{
          label: "Orders Placed",
          value: "12"
        }, {
          label: "Flowers Gifted",
          value: "47+"
        }, {
          label: "Member Since",
          value: "Jan 2025"
        }].map(s => <div key={s.label} className="flex justify-between py-2 [border-bottom:1px_solid_#F0DDD5]">
                    <span className="[font-size:0.82rem] text-lunara-body">{s.label}</span>
                    <span className="[font-size:0.88rem] text-lunara-ink [font-weight:500]">{s.value}</span>
                  </div>)}
              </div>
            </div>
          </div>;
}
