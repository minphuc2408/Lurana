import { useLocale } from "@/shared/i18n";
import type { CartModel } from "../hooks/useCheckout";
export function CheckoutForm(model: CartModel) {
  const { t } = useLocale("cart");
  const {
    form,
    setForm
  } = model;
  return /* Checkout Form */<div className="p-6 rounded-2xl bg-white [border:1px_solid_#F0DDD5]">
              <h3 className="font-display [font-size:1.4rem] text-lunara-ink [margin-bottom:24px]">{t("Delivery Information")}</h3>
              <div className="grid grid-cols-2 gap-4">
                {[{
        key: "firstName",
        label: "First Name",
        placeholder: "Maria"
      }, {
        key: "lastName",
        label: "Last Name",
        placeholder: "Santos"
      }, {
        key: "email",
        label: "Email Address",
        placeholder: "maria@example.com",
        full: true
      }, {
        key: "phone",
        label: "Phone Number",
        placeholder: "+63 912 345 6789",
        full: true
      }, {
        key: "address",
        label: "Street Address",
        placeholder: "123 Bloom Street, Barangay Floralia",
        full: true
      }, {
        key: "city",
        label: "City",
        placeholder: "Manila"
      }].map(field => <div key={field.key} className={field.full ? "col-span-2" : ""}>
                    <label className="[display:block] [font-size:0.8rem] text-lunara-body [letter-spacing:0.08em] [margin-bottom:6px] [text-transform:uppercase]" htmlFor={`checkoutform-1-${field.key}`}>
                      {t(field.label)}
                    </label>
                    <input type="text" placeholder={field.placeholder} value={form[field.key as keyof typeof form]} onChange={e => setForm({
          ...form,
          [field.key]: e.target.value
        })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={`checkoutform-1-${field.key}`} />
                  </div>)}
                <div className="col-span-2">
                  <label className="[display:block] [font-size:0.8rem] text-lunara-body [letter-spacing:0.08em] [margin-bottom:6px] [text-transform:uppercase]" htmlFor={"checkoutform-2"}>
                    {t("Special Notes (Optional)")}</label>
                  <textarea placeholder={t("Any special requests for your arrangement...")} value={form.notes} onChange={e => setForm({
          ...form,
          notes: e.target.value
        })} rows={3} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [resize:none]" id={"checkoutform-2"} />
                </div>
              </div>
            </div>;
}
