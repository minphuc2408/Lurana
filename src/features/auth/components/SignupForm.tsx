import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Link } from "react-router";
import type { SignupModel } from "../hooks/useSignup";
export function SignupForm(model: SignupModel) {
  const { t } = useLocale("auth");
  const {
    form,
    setForm,
    setSubmitted,
    strength,
    strengthLabels,
    strengthColors
  } = model;
  return <div className="w-full rounded-3xl p-8 shadow-sm bg-white [border:1px_solid_#F0DDD5] [max-width:460px]">
          <h2 className="font-display [font-size:1.8rem] [font-weight:600] text-lunara-ink [margin-bottom:6px]">
            {t("Create an account")}</h2>
          <p className="[font-size:0.85rem] text-lunara-body [margin-bottom:28px]">{t("Join the Lunara family today")}</p>

          <div className="flex flex-col gap-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-1"}>{t("First Name")}</label>
                <input type="text" placeholder={t("Maria")} value={form.firstName} onChange={e => setForm({
            ...form,
            firstName: e.target.value
          })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"signupform-1"} />
              </div>
              <div>
                <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-2"}>{t("Last Name")}</label>
                <input type="text" placeholder={t("Santos")} value={form.lastName} onChange={e => setForm({
            ...form,
            lastName: e.target.value
          })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"signupform-2"} />
              </div>
            </div>

            <div>
              <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-3"}>{t("Email Address")}</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({
          ...form,
          email: e.target.value
        })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"signupform-3"} />
            </div>

            <div>
              <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-4"}>{t("Password")}</label>
              <div>
                <input type="password" placeholder={t("Minimum 8 characters")} value={form.password} onChange={e => setForm({
            ...form,
            password: e.target.value
          })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"signupform-4"} />
              {form.password && <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map(i => <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= strength ? colorClass(strengthColors[strength], "backgroundColor") : "bg-lunara-border")} />)}
                  </div>
                  <span className={cn("[font-size:0.72rem]", colorClass(strengthColors[strength], "color"))}>{t(strengthLabels[strength])}</span>
                </div>}
            </div>
            </div>

            <div>
              <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-5"}>{t("Confirm Password")}</label>
              <div>
                <input type="password" placeholder={t("Repeat your password")} value={form.confirm} onChange={e => setForm({
            ...form,
            confirm: e.target.value
          })} className={cn("w-full rounded-xl px-4 py-3 [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface", form.confirm && form.confirm !== form.password ? "[border:1px_solid_#E8453C]" : "[border:1px_solid_#F0DDD5]")} id={"signupform-5"} />
              {form.confirm && form.confirm !== form.password && <p className="[font-size:0.75rem] text-[#B42318] [margin-top:4px]">{t("Passwords don't match")}</p>}
            </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.agree} onChange={e => setForm({
          ...form,
          agree: e.target.checked
        })} className="accent-lunara-rose [margin-top:2px]" />
              <span className="[font-size:0.8rem] text-lunara-body [line-height:1.5]">
                {t("I agree to the")}{" "}
                <a href="#" className="text-lunara-rose-strong [text-decoration:none]">{t("Terms of Service")}</a>{" "}
                {t("and")}{" "}
                <a href="#" className="text-lunara-rose-strong [text-decoration:none]">{t("Privacy Policy")}</a>
              </span>
            </label>

            <button onClick={() => form.agree && setSubmitted(true)} className={cn("w-full py-4 rounded-full mt-2 [border:none] [font-size:0.88rem] [letter-spacing:0.1em] [text-transform:uppercase] [font-weight:500]", form.agree ? "bg-lunara-rose-strong" : "bg-lunara-border", form.agree ? "text-white" : "text-lunara-body", form.agree ? "[cursor:pointer]" : "[cursor:not-allowed]")}>
              {t("Create Account")}</button>
          </div>

          <p className="[text-align:center] [font-size:0.82rem] text-lunara-body [margin-top:20px]">
            {t("Already have an account?")}{" "}
            <Link to="/login" className="text-lunara-rose-strong [text-decoration:none] [font-weight:500]">{t("Sign in")}</Link>
          </p>
        </div>;
}
