import type { CustomOrderModel } from "../hooks/useCustomOrder";
import type { FormData } from "../custom-order.types";
export function ContactStep(model: CustomOrderModel) {
  const {
    formData,
    setFormData
  } = model;
  return <div>
              <h2 className="font-display [font-size:1.8rem] text-lunara-ink [margin-bottom:6px]">Your contact details</h2>
              <p className="[font-size:0.85rem] text-lunara-body [margin-bottom:24px]">So our team can reach you about your order</p>

              <div className="flex flex-col gap-4">
                {[{
        key: "name",
        label: "Full Name",
        placeholder: "Maria Santos",
        type: "text"
      }, {
        key: "email",
        label: "Email Address",
        placeholder: "maria@example.com",
        type: "email"
      }, {
        key: "phone",
        label: "Phone Number",
        placeholder: "+63 912 345 6789",
        type: "tel"
      }].map(field => <div key={field.key}>
                    <label className="[display:block] [font-size:0.78rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={`contactstep-1-${field.key}`}>
                      {field.label}
                    </label>
                    <input type={field.type} placeholder={field.placeholder} value={formData[field.key as keyof FormData] as string} onChange={e => setFormData({
          ...formData,
          [field.key]: e.target.value
        })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={`contactstep-1-${field.key}`} />
                  </div>)}

                {/* Summary */}
                <div className="rounded-xl p-5 mt-2 bg-lunara-blush [border:1px_solid_#F0DDD5]">
                  <h4 className="font-display [font-size:1rem] text-lunara-ink [margin-bottom:12px]">Request Summary</h4>
                  <div className="flex flex-col gap-1">
                    {[{
            label: "Occasion",
            value: formData.occasion || "Not specified"
          }, {
            label: "Colors",
            value: formData.colors.join(", ") || "Not specified"
          }, {
            label: "Flowers",
            value: formData.flowers.join(", ") || "Not specified"
          }, {
            label: "Size",
            value: formData.size || "Not specified"
          }, {
            label: "Date Needed",
            value: formData.date || "Not specified"
          }].map(item => <div key={item.label} className="flex gap-2">
                        <span className="[font-size:0.78rem] text-lunara-body [min-width:80px]">{item.label}:</span>
                        <span className="[font-size:0.78rem] text-lunara-ink">{item.value}</span>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>;
}
