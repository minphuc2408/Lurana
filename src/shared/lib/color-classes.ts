// Finite palette classes keep dynamic demo colors discoverable by Tailwind.
const palette: Record<string, Record<"color" | "backgroundColor" | "borderColor", string>> = {
  "transparent": {
    "color": "text-transparent",
    "backgroundColor": "bg-transparent",
    "borderColor": "border-transparent"
  },
  "white": {
    "color": "text-white",
    "backgroundColor": "bg-white",
    "borderColor": "border-white"
  },
  "none": {
    "color": "text-transparent",
    "backgroundColor": "bg-transparent",
    "borderColor": "border-transparent"
  },
  "#5B8DD9": {
    "color": "text-[#3763A0]",
    "backgroundColor": "bg-lunara-info",
    "borderColor": "border-lunara-info"
  },
  "#EDF3FC": {
    "color": "text-[#EDF3FC]",
    "backgroundColor": "bg-[#EDF3FC]",
    "borderColor": "border-[#EDF3FC]"
  },
  "#7A9E7E": {
    "color": "text-[#426647]",
    "backgroundColor": "bg-lunara-success",
    "borderColor": "border-lunara-success"
  },
  "#EDF7EF": {
    "color": "text-[#EDF7EF]",
    "backgroundColor": "bg-[#EDF7EF]",
    "borderColor": "border-[#EDF7EF]"
  },
  "#D4A020": {
    "color": "text-[#806000]",
    "backgroundColor": "bg-lunara-warning",
    "borderColor": "border-lunara-warning"
  },
  "#FDF8E8": {
    "color": "text-[#FDF8E8]",
    "backgroundColor": "bg-[#FDF8E8]",
    "borderColor": "border-[#FDF8E8]"
  },
  "#C17B8A": {
    "color": "text-lunara-rose-strong",
    "backgroundColor": "bg-lunara-rose-strong",
    "borderColor": "border-lunara-rose"
  },
  "#FDF0F3": {
    "color": "text-[#FDF0F3]",
    "backgroundColor": "bg-[#FDF0F3]",
    "borderColor": "border-[#FDF0F3]"
  },
  "#F0DDD5": {
    "color": "text-lunara-border",
    "backgroundColor": "bg-lunara-border",
    "borderColor": "border-lunara-border"
  },
  "#9A7080": {
    "color": "text-lunara-body",
    "backgroundColor": "bg-lunara-muted",
    "borderColor": "border-lunara-muted"
  },
  "#D4A0AC": {
    "color": "text-lunara-rose-light",
    "backgroundColor": "bg-lunara-rose-light",
    "borderColor": "border-lunara-rose-light"
  },
  "#9B6BA8": {
    "color": "text-[#9B6BA8]",
    "backgroundColor": "bg-[#9B6BA8]",
    "borderColor": "border-[#9B6BA8]"
  },
  "#E87A5B": {
    "color": "text-[#E87A5B]",
    "backgroundColor": "bg-[#E87A5B]",
    "borderColor": "border-[#E87A5B]"
  },
  "#D4B896": {
    "color": "text-[#D4B896]",
    "backgroundColor": "bg-[#D4B896]",
    "borderColor": "border-[#D4B896]"
  },
  "#F5F0F0": {
    "color": "text-[#F5F0F0]",
    "backgroundColor": "bg-[#F5F0F0]",
    "borderColor": "border-[#F5F0F0]"
  },
  "#E8453C": {
    "color": "text-[#B42318]",
    "backgroundColor": "bg-lunara-danger",
    "borderColor": "border-lunara-danger"
  },
  "#F5A623": {
    "color": "text-[#F5A623]",
    "backgroundColor": "bg-[#F5A623]",
    "borderColor": "border-[#F5A623]"
  },
  "#3D9970": {
    "color": "text-[#3D9970]",
    "backgroundColor": "bg-[#3D9970]",
    "borderColor": "border-[#3D9970]"
  },
  "#F9EDE9": {
    "color": "text-lunara-blush",
    "backgroundColor": "bg-lunara-blush",
    "borderColor": "border-lunara-blush"
  },
  "#F8C8C8": {
    "color": "text-[#F8C8C8]",
    "backgroundColor": "bg-[#F8C8C8]",
    "borderColor": "border-[#F8C8C8]"
  },
  "#FDFAF5": {
    "color": "text-[#FDFAF5]",
    "backgroundColor": "bg-[#FDFAF5]",
    "borderColor": "border-[#FDFAF5]"
  },
  "#D4677A": {
    "color": "text-[#D4677A]",
    "backgroundColor": "bg-[#D4677A]",
    "borderColor": "border-[#D4677A]"
  },
  "#7A2035": {
    "color": "text-[#7A2035]",
    "backgroundColor": "bg-[#7A2035]",
    "borderColor": "border-[#7A2035]"
  },
  "#B89EC4": {
    "color": "text-[#B89EC4]",
    "backgroundColor": "bg-[#B89EC4]",
    "borderColor": "border-[#B89EC4]"
  },
  "#F5D060": {
    "color": "text-[#F5D060]",
    "backgroundColor": "bg-[#F5D060]",
    "borderColor": "border-[#F5D060]"
  },
  "#D4A520": {
    "color": "text-[#D4A520]",
    "backgroundColor": "bg-[#D4A520]",
    "borderColor": "border-[#D4A520]"
  },
  "#F5F5F5": {
    "color": "text-[#F5F5F5]",
    "backgroundColor": "bg-[#F5F5F5]",
    "borderColor": "border-[#F5F5F5]"
  },
  "#E0E0E0": {
    "color": "text-[#E0E0E0]",
    "backgroundColor": "bg-[#E0E0E0]",
    "borderColor": "border-[#E0E0E0]"
  },
  "#FF8C61": {
    "color": "text-[#FF8C61]",
    "backgroundColor": "bg-[#FF8C61]",
    "borderColor": "border-[#FF8C61]"
  },
  "#56C3A0": {
    "color": "text-[#56C3A0]",
    "backgroundColor": "bg-[#56C3A0]",
    "borderColor": "border-[#56C3A0]"
  },
  "#FFF0F0": {
    "color": "text-[#FFF0F0]",
    "backgroundColor": "bg-[#FFF0F0]",
    "borderColor": "border-[#FFF0F0]"
  },
  "#6A4050": {
    "color": "text-[#6A4050]",
    "backgroundColor": "bg-[#6A4050]",
    "borderColor": "border-[#6A4050]"
  },
  "#4A2830": {
    "color": "text-[#4A2830]",
    "backgroundColor": "bg-[#4A2830]",
    "borderColor": "border-[#4A2830]"
  },
  "rgba(193,123,138,0.18)": {
    "color": "text-[rgba(193,123,138,0.18)]",
    "backgroundColor": "bg-[rgba(193,123,138,0.18)]",
    "borderColor": "border-[rgba(193,123,138,0.18)]"
  },
  "#E8B0BC": {
    "color": "text-[#E8B0BC]",
    "backgroundColor": "bg-[#E8B0BC]",
    "borderColor": "border-[#E8B0BC]"
  },
  "rgba(255,255,255,0.06)": {
    "color": "text-[rgba(255,255,255,0.06)]",
    "backgroundColor": "bg-[rgba(255,255,255,0.06)]",
    "borderColor": "border-[rgba(255,255,255,0.06)]"
  },
  "#1A0D12": {
    "color": "text-lunara-sidebar",
    "backgroundColor": "bg-lunara-sidebar",
    "borderColor": "border-lunara-sidebar"
  },
  "rgba(0,0,0,0.55)": {
    "color": "text-[rgba(0,0,0,0.55)]",
    "backgroundColor": "bg-[rgba(0,0,0,0.55)]",
    "borderColor": "border-[rgba(0,0,0,0.55)]"
  },
  "#F8F4F2": {
    "color": "text-lunara-admin-background",
    "backgroundColor": "bg-lunara-admin-background",
    "borderColor": "border-lunara-admin-background"
  },
  "#6B4C55": {
    "color": "text-lunara-body",
    "backgroundColor": "bg-lunara-body",
    "borderColor": "border-lunara-body"
  },
  "#3D2228": {
    "color": "text-lunara-ink",
    "backgroundColor": "bg-lunara-ink",
    "borderColor": "border-lunara-ink"
  },
  "#B090A0": {
    "color": "text-lunara-body",
    "backgroundColor": "bg-[#B090A0]",
    "borderColor": "border-[#B090A0]"
  },
  "#FDF6F0": {
    "color": "text-lunara-cream",
    "backgroundColor": "bg-lunara-cream",
    "borderColor": "border-lunara-cream"
  },
  "rgba(253,246,240,0.95)": {
    "color": "text-[rgba(253,246,240,0.95)]",
    "backgroundColor": "bg-[rgba(253,246,240,0.95)]",
    "borderColor": "border-[rgba(253,246,240,0.95)]"
  },
  "#F5DDD5": {
    "color": "text-[#F5DDD5]",
    "backgroundColor": "bg-[#F5DDD5]",
    "borderColor": "border-[#F5DDD5]"
  },
  "#C0A0A8": {
    "color": "text-lunara-body",
    "backgroundColor": "bg-[#C0A0A8]",
    "borderColor": "border-[#C0A0A8]"
  },
  "#8A6070": {
    "color": "text-[#8A6070]",
    "backgroundColor": "bg-[#8A6070]",
    "borderColor": "border-[#8A6070]"
  },
  "#FDFBF9": {
    "color": "text-lunara-surface",
    "backgroundColor": "bg-lunara-surface",
    "borderColor": "border-lunara-surface"
  },
  "#FFF0EE": {
    "color": "text-[#FFF0EE]",
    "backgroundColor": "bg-[#FFF0EE]",
    "borderColor": "border-[#FFF0EE]"
  },
  "#F5F0F2": {
    "color": "text-[#F5F0F2]",
    "backgroundColor": "bg-[#F5F0F2]",
    "borderColor": "border-[#F5F0F2]"
  },
  "#5A8060": {
    "color": "text-[#5A8060]",
    "backgroundColor": "bg-[#5A8060]",
    "borderColor": "border-[#5A8060]"
  },
  "#E0D0D5": {
    "color": "text-[#E0D0D5]",
    "backgroundColor": "bg-[#E0D0D5]",
    "borderColor": "border-[#E0D0D5]"
  },
  "#FFF0F2": {
    "color": "text-[#FFF0F2]",
    "backgroundColor": "bg-[#FFF0F2]",
    "borderColor": "border-[#FFF0F2]"
  },
  "#B05060": {
    "color": "text-[#B05060]",
    "backgroundColor": "bg-[#B05060]",
    "borderColor": "border-[#B05060]"
  },
  "#F5E8E4": {
    "color": "text-[#F5E8E4]",
    "backgroundColor": "bg-[#F5E8E4]",
    "borderColor": "border-[#F5E8E4]"
  },
  "#D0C0C4": {
    "color": "text-[#D0C0C4]",
    "backgroundColor": "bg-[#D0C0C4]",
    "borderColor": "border-[#D0C0C4]"
  },
  "rgba(61,34,40,0.55)": {
    "color": "text-[rgba(61,34,40,0.55)]",
    "backgroundColor": "bg-[rgba(61,34,40,0.55)]",
    "borderColor": "border-[rgba(61,34,40,0.55)]"
  },
  "#F8D7E0": {
    "color": "text-[#F8D7E0]",
    "backgroundColor": "bg-[#F8D7E0]",
    "borderColor": "border-[#F8D7E0]"
  },
  "rgba(255,255,255,0.25)": {
    "color": "text-[rgba(255,255,255,0.25)]",
    "backgroundColor": "bg-[rgba(255,255,255,0.25)]",
    "borderColor": "border-[rgba(255,255,255,0.25)]"
  },
  "#D0B0B8": {
    "color": "text-lunara-body",
    "backgroundColor": "bg-[#D0B0B8]",
    "borderColor": "border-[#D0B0B8]"
  },
  "#7A9E7E20": {
    "color": "text-[#7A9E7E20]",
    "backgroundColor": "bg-[#7A9E7E20]",
    "borderColor": "border-[#7A9E7E20]"
  },
  "#C17B8A20": {
    "color": "text-[#C17B8A20]",
    "backgroundColor": "bg-[#C17B8A20]",
    "borderColor": "border-[#C17B8A20]"
  },
  "#D4A02020": {
    "color": "text-[#D4A02020]",
    "backgroundColor": "bg-[#D4A02020]",
    "borderColor": "border-[#D4A02020]"
  }
};

export function colorClass(value: string, property: "color" | "backgroundColor" | "borderColor") {
  return palette[value]?.[property] ?? "";
}
