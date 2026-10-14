import { useLocale, getLocalizedName } from "@/shared/i18n";
import { Minus, Plus, X } from "lucide-react";
import type { QuoteCartModel as CartModel } from '../hooks/useQuoteCart';
import { formatVND } from '@/shared/lib/format';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
export function CartItemList(model: CartModel) {
  const { t, language } = useLocale("cart");
  const {
    items,
    updateQty,
    removeItem
  } = model;
  return <div className="flex flex-col gap-4">
                  {items.map(item => <div key={item.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5 rounded-2xl bg-white [border:1px_solid_#F0DDD5]">
                      <ImageWithFallback src={item.image} alt={getLocalizedName(item, language) || t('Unavailable')} className="rounded-xl w-[72px] h-[88px] sm:w-[100px] sm:h-[120px] object-cover shrink-0" />
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 [overflow-wrap:anywhere]">
                            <h3 className="font-display [font-size:1.1rem] text-lunara-ink [font-weight:500]">{getLocalizedName(item, language) || t('Unavailable')}</h3>
                            <span className="[font-size:0.78rem] text-lunara-body">{t("Size:")}{" "}{t(item.size)}</span>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="shrink-0 bg-transparent [border:none] [cursor:pointer] text-lunara-body" aria-label={t("Remove {{value0}}", { value0: getLocalizedName(item, language) })}>
                            <X size={18} />
                          </button>
                        </div>
                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mt-3">
                          <div className="flex items-center gap-3 rounded-full px-1 py-1 [border:1px_solid_#F0DDD5]">
                            <button disabled={item.qty <= 1} onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent [border:none] [cursor:pointer] text-lunara-body disabled:opacity-40" aria-label={t("Decrease quantity")}>
                              <Minus size={14} />
                            </button>
                            <span className="[font-size:0.9rem] text-lunara-ink [min-width:20px] [text-align:center]">{item.qty}</span>
                            <button disabled={item.qty >= (item.maxQuantity ?? 20)} onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent [border:none] [cursor:pointer] text-lunara-body disabled:opacity-40" aria-label={t("Increase quantity")}>
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-display [font-size:1.1rem] [font-weight:600] text-lunara-rose-strong">
                            {item.name ? formatVND(item.price * item.qty, language) : t('Unavailable')}
                          </span>
                        </div>
                      </div>
                    </div>)}
                </div>;
}
