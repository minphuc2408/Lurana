import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import type { LoginModel } from "../hooks/useLogin";
export function LoginForm(model: LoginModel) {
  const { t } = useLocale("auth");
  const {
    showPass,
    setShowPass,
    email,
    setEmail,
    password,
    setPassword,
    remember,
    setRemember,
    error,
    loading,
    handleSignIn
  } = model;
  return <div className="w-full rounded-3xl p-8 shadow-sm bg-white [border:1px_solid_#F0DDD5] [max-width:420px]">
          <h2 className="font-display [font-size:1.8rem] [font-weight:600] text-lunara-ink [margin-bottom:6px]">
            {t("Welcome back")}</h2>
          <p className="[font-size:0.85rem] text-lunara-body [margin-bottom:28px]">
            {t("Sign in to your Lunara account")}</p>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="[display:block] [font-size:0.78rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:8px]" htmlFor={"loginform-1"}>
                {t("Email Address")}</label>
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [transition:border-color_0.2s]" id={"loginform-1"} />
            </div>

            {/* Password */}
            <div>
              <label className="[display:block] [font-size:0.78rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:8px]" htmlFor={"loginform-2"}>
                {t("Password")}</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl px-4 py-3 pr-12 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"loginform-2"} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="[position:absolute] [right:14px] [top:50%] [transform:translateY(-50%)] bg-transparent [border:none] [cursor:pointer] text-lunara-body">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="rounded-xl px-4 py-3 bg-[#FFF0F2] [border:1px_solid_#F0C0C8] [font-size:0.82rem] text-[#B05060]">
                {t(error)}
              </div>}

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-lunara-rose" />
                <span className="[font-size:0.82rem] text-lunara-body">{t("Remember me")}</span>
              </label>
              <a href="#" className="[font-size:0.82rem] text-lunara-rose-strong [text-decoration:none]">
                {t("Forgot password?")}</a>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className={cn("w-full py-4 rounded-full text-center mt-2 text-white [border:none] [font-size:0.88rem] [letter-spacing:0.1em] [text-transform:uppercase] [font-weight:500] [transition:background-color_0.2s]", loading ? "bg-lunara-rose-light" : "bg-lunara-rose-strong", loading ? "[cursor:not-allowed]" : "[cursor:pointer]")}>
              {loading ? t("Signing in…") : t("Sign In")}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="[flex:1] [height:1px] bg-lunara-border" />
              <span className="[font-size:0.75rem] text-lunara-body">{t("or continue with")}</span>
              <div className="[flex:1] [height:1px] bg-lunara-border" />
            </div>

            {/* Social buttons */}
            <div className="flex gap-3">
              {["Google", "Facebook"].map(s => <button key={s} type="button" className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 [border:1px_solid_#F0DDD5] bg-white [cursor:pointer] [font-size:0.82rem] text-lunara-body">
                  {s === "Google" ? "🇬" : "𝒇"} {s}
                </button>)}
            </div>
          </form>

          <p className="[text-align:center] [font-size:0.82rem] text-lunara-body [margin-top:24px]">
            {t("Don't have an account?")}{" "}
            <Link to="/signup" className="text-lunara-rose-strong [text-decoration:none] [font-weight:500]">
              {t("Sign up")}</Link>
          </p>
        </div>;
}
