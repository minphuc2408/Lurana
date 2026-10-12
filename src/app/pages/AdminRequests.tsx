import { useState } from "react";
import { MessageSquare, Check, X, Eye, Clock } from "lucide-react";

const requests = [
  { id: "REQ-001", customer: "Maria Santos", date: "Mar 17, 2026", occasion: "Wedding Anniversary", budget: "₱3,500", flowers: "Pink peonies, white roses, baby's breath", notes: "For a dinner table centerpiece, romantic vibe.", status: "Pending" },
  { id: "REQ-002", customer: "Sofia Lim", date: "Mar 16, 2026", occasion: "Birthday", budget: "₱2,000", flowers: "Sunflowers, yellow tulips, greenery", notes: "Bright and cheerful bouquet for my mom's 60th birthday.", status: "In Review" },
  { id: "REQ-003", customer: "Isabel Cruz", date: "Mar 15, 2026", occasion: "Condolence", budget: "₱1,500", flowers: "White lilies, white chrysanthemums", notes: "Simple and dignified arrangement.", status: "Approved" },
  { id: "REQ-004", customer: "Camille Tan", date: "Mar 14, 2026", occasion: "Valentine's Day", budget: "₱5,000", flowers: "Red roses, lavender, eucalyptus", notes: "Premium bouquet with box packaging and ribbon.", status: "Approved" },
  { id: "REQ-005", customer: "Rachel Go", date: "Mar 12, 2026", occasion: "Graduation", budget: "₱2,500", flowers: "Mixed pastel flowers", notes: "Pastel-colored arrangement to match school colors (blue and white).", status: "Completed" },
];

const statusConfig: Record<string, { bg: string; color: string }> = {
  Pending: { bg: "#FDF8E8", color: "#D4A020" },
  "In Review": { bg: "#EDF3FC", color: "#5B8DD9" },
  Approved: { bg: "#EDF7EF", color: "#7A9E7E" },
  Completed: { bg: "#F9EDE9", color: "#C17B8A" },
  Declined: { bg: "#F5F0F0", color: "#9A7080" },
};

export function AdminRequests() {
  const [reqs, setReqs] = useState(requests);
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateStatus = (id: string, status: string) =>
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  return (
    <div className="p-6" style={{ fontFamily: "'Jost', sans-serif" }}>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Requests", value: reqs.length, color: "#C17B8A", bg: "#FDF0F3" },
          { label: "Pending", value: reqs.filter((r) => r.status === "Pending").length, color: "#D4A020", bg: "#FDF8E8" },
          { label: "In Review", value: reqs.filter((r) => r.status === "In Review").length, color: "#5B8DD9", bg: "#EDF3FC" },
          { label: "Completed", value: reqs.filter((r) => r.status === "Completed").length, color: "#7A9E7E", bg: "#EDF7EF" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
              <MessageSquare size={16} style={{ color: s.color }} />
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 600, color: "#3D2228", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: "#6B4C55", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Requests List */}
      <div className="flex flex-col gap-3">
        {reqs.map((req) => (
          <div key={req.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
            <div
              className="flex items-center justify-between p-5 cursor-pointer"
              onClick={() => setExpanded(expanded === req.id ? null : req.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F9EDE9" }}>
                  <MessageSquare size={16} style={{ color: "#C17B8A" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#3D2228", fontWeight: 500 }}>{req.customer}</span>
                    <span style={{ fontSize: "0.72rem", color: "#C17B8A" }}>{req.id}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#9A7080", marginTop: "2px" }}>
                    {req.occasion} · {req.budget} budget · {req.date}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full" style={{ ...statusConfig[req.status], fontSize: "0.72rem", fontWeight: 500 }}>
                  {req.status}
                </span>
                <Eye size={15} style={{ color: "#9A7080" }} />
              </div>
            </div>

            {expanded === req.id && (
              <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F0DDD5" }}>
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <p style={{ fontSize: "0.72rem", color: "#9A7080", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Requested Flowers</p>
                    <p style={{ fontSize: "0.88rem", color: "#3D2228" }}>{req.flowers}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.72rem", color: "#9A7080", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Special Notes</p>
                    <p style={{ fontSize: "0.88rem", color: "#3D2228" }}>{req.notes}</p>
                  </div>
                </div>
                {(req.status === "Pending" || req.status === "In Review") && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => updateStatus(req.id, req.status === "Pending" ? "In Review" : "Approved")}
                      className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ backgroundColor: "#EDF7EF", color: "#7A9E7E", border: "none", cursor: "pointer", fontSize: "0.82rem" }}
                    >
                      <Check size={13} /> {req.status === "Pending" ? "Start Review" : "Approve"}
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, "Declined")}
                      className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ backgroundColor: "#FFF0F0", color: "#E8453C", border: "none", cursor: "pointer", fontSize: "0.82rem" }}
                    >
                      <X size={13} /> Decline
                    </button>
                    {req.status === "Approved" && (
                      <button
                        onClick={() => updateStatus(req.id, "Completed")}
                        className="flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ backgroundColor: "#F9EDE9", color: "#C17B8A", border: "none", cursor: "pointer", fontSize: "0.82rem" }}
                      >
                        <Clock size={13} /> Mark Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
