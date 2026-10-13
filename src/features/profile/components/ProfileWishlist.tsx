import { formatMoney } from "@/shared/lib/format";
import { Heart } from "lucide-react";
import type { ProfileModel } from "../hooks/useProfile";
export function ProfileWishlist(model: ProfileModel) {
  const {
    wishlistItems
  } = model;
  // Redirect to login if not authenticated
  return <div className="pb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {wishlistItems.map(item => <div key={item.id} className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
                  <div className="[aspect-ratio:3/4] [overflow:hidden]">
                    <img src={item.image} alt={item.name} className="[width:100%] [height:100%] [object-fit:cover]" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display [font-size:0.95rem] text-lunara-ink">{item.name}</h3>
                    <p className="[font-size:0.88rem] text-lunara-rose-strong [font-weight:500] [margin-top:4px]">{formatMoney(item.price)}</p>
                    <button className="w-full mt-3 py-2 rounded-full flex items-center justify-center gap-1 bg-lunara-blush [border:none] [cursor:pointer] [font-size:0.78rem] text-lunara-rose-strong">
                      <Heart size={12} fill="#C17B8A" /> Wishlisted
                    </button>
                  </div>
                </div>)}
            </div>
          </div>;
}
