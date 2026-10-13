import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import type { SignupModel } from "../hooks/useSignup";
export function SignupForm(model: SignupModel) {
  const {
    showPass,
    setShowPass,
    showConfirm,
    setShowConfirm,
    form,
    setForm,
    setSubmitted,
    strength,
    strengthLabels,
    strengthColors
  } = model;
  return <div className="w-full rounded-3xl p-8 shadow-sm bg-white [border:1px_solid_#F0DDD5] [max-width:460px]">
          <h2 className="font-display [font-size:1.8rem] [font-weight:600] text-lunara-ink [margin-bottom:6px]">
            Create an account
          </h2>
          <p className="[font-size:0.85rem] text-lunara-body [margin-bottom:28px]">Join the Lunara family today</p>

          <div className="flex flex-col gap-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-1"}>First Name</label>
                <input type="text" placeholder="Maria" value={form.firstName} onChange={e => setForm({
            ...form,
            firstName: e.target.value
          })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"signupform-1"} />
              </div>
              <div>
                <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-2"}>Last Name</label>
                <input type="text" placeholder="Santos" value={form.lastName} onChange={e => setForm({
            ...form,
            lastName: e.target.value
          })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"signupform-2"} />
              </div>
            </div>

            <div>
              <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-3"}>Email Address</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({
          ...form,
          email: e.target.value
        })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"signupform-3"} />
            </div>

            <div>
              <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-4"}>Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm({
            ...form,
            password: e.target.value
          })} className="w-full rounded-xl px-4 py-3 pr-12 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"signupform-4"} />
                <button onClick={() => setShowPass(!showPass)} className="[position:absolute] [right:14px] [top:50%] [transform:translateY(-50%)] bg-transparent [border:none] [cursor:pointer] text-lunara-body">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map(i => <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= strength ? colorClass(strengthColors[strength], "backgroundColor") : "bg-lunara-border")} />)}
                  </div>
                  <span className={cn("[font-size:0.72rem]", colorClass(strengthColors[strength], "color"))}>{strengthLabels[strength]}</span>
                </div>}
            </div>

            <div>
              <label className="[display:block] [font-size:0.75rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"signupform-5"}>Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={form.confirm} onChange={e => setForm({
            ...form,
            confirm: e.target.value
          })} className={cn("w-full rounded-xl px-4 py-3 pr-12 [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface", form.confirm && form.confirm !== form.password ? "[border:1px_solid_#E8453C]" : "[border:1px_solid_#F0DDD5]")} id={"signupform-5"} />
                <button onClick={() => setShowConfirm(!showConfirm)} className="[position:absolute] [right:14px] [top:50%] [transform:translateY(-50%)] bg-transparent [border:none] [cursor:pointer] text-lunara-body">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm && form.confirm !== form.password && <p className="[font-size:0.75rem] text-[#B42318] [margin-top:4px]">Passwords don't match</p>}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.agree} onChange={e => setForm({
          ...form,
          agree: e.target.checked
        })} className="accent-lunara-rose [margin-top:2px]" />
              <span className="[font-size:0.8rem] text-lunara-body [line-height:1.5]">
                I agree to the{" "}
                <a href="#" className="text-lunara-rose-strong [text-decoration:none]">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-lunara-rose-strong [text-decoration:none]">Privacy Policy</a>
              </span>
            </label>

            <button onClick={() => form.agree && setSubmitted(true)} className={cn("w-full py-4 rounded-full mt-2 [border:none] [font-size:0.88rem] [letter-spacing:0.1em] [text-transform:uppercase] [font-weight:500]", form.agree ? "bg-lunara-rose-strong" : "bg-lunara-border", form.agree ? "text-white" : "text-lunara-body", form.agree ? "[cursor:pointer]" : "[cursor:not-allowed]")}>
              Create Account
            </button>
          </div>

          <p className="[text-align:center] [font-size:0.82rem] text-lunara-body [margin-top:20px]">
            Already have an account?{" "}
            <Link to="/login" className="text-lunara-rose-strong [text-decoration:none] [font-weight:500]">Sign in</Link>
          </p>
        </div>;
}
