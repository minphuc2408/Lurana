export const requests = [{
  id: "REQ-001",
  customer: "Maria Santos",
  date: "Mar 17, 2026",
  occasion: "Wedding Anniversary",
  budget: "₱3,500",
  flowers: "Pink peonies, white roses, baby's breath",
  notes: "For a dinner table centerpiece, romantic vibe.",
  status: "Pending"
}, {
  id: "REQ-002",
  customer: "Sofia Lim",
  date: "Mar 16, 2026",
  occasion: "Birthday",
  budget: "₱2,000",
  flowers: "Sunflowers, yellow tulips, greenery",
  notes: "Bright and cheerful bouquet for my mom's 60th birthday.",
  status: "In Review"
}, {
  id: "REQ-003",
  customer: "Isabel Cruz",
  date: "Mar 15, 2026",
  occasion: "Condolence",
  budget: "₱1,500",
  flowers: "White lilies, white chrysanthemums",
  notes: "Simple and dignified arrangement.",
  status: "Approved"
}, {
  id: "REQ-004",
  customer: "Camille Tan",
  date: "Mar 14, 2026",
  occasion: "Valentine's Day",
  budget: "₱5,000",
  flowers: "Red roses, lavender, eucalyptus",
  notes: "Premium bouquet with box packaging and ribbon.",
  status: "Approved"
}, {
  id: "REQ-005",
  customer: "Rachel Go",
  date: "Mar 12, 2026",
  occasion: "Graduation",
  budget: "₱2,500",
  flowers: "Mixed pastel flowers",
  notes: "Pastel-colored arrangement to match school colors (blue and white).",
  status: "Completed"
}];
export const statusConfig: Record<string, {
  bg: string;
  color: string;
}> = {
  Pending: {
    bg: "#FDF8E8",
    color: "#D4A020"
  },
  "In Review": {
    bg: "#EDF3FC",
    color: "#5B8DD9"
  },
  Approved: {
    bg: "#EDF7EF",
    color: "#7A9E7E"
  },
  Completed: {
    bg: "#F9EDE9",
    color: "#C17B8A"
  },
  Declined: {
    bg: "#F5F0F0",
    color: "#9A7080"
  }
};
