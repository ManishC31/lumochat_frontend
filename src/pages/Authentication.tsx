import { MessageCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PreviewSection from "@/components/PreviewSection";
import { useAuth } from "@/contexts/AuthContext";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthenticationPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentForm, setCurrentForm] = useState<"login" | "register">("login");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chat");
    }
  }, [isAuthenticated, navigate]);

  const switchForm = (form: "login" | "register") => {
    setCurrentForm(form);
    setFieldErrors({});
    setFormError("");
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (currentForm === "register" && !name.trim()) {
      errors.name = "Name is required.";
    }

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_RE.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (currentForm === "register" && password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (currentForm === "login") {
        await login({ email, password });
        navigate("/chat");
      } else {
        await register({ name: name.trim(), email, password });
        setCurrentForm("login");
        setFormError("Registration successful! Please log in.");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen font-display bg-background">
      {/* Left Panel — preview */}
      <PreviewSection />

      {/* Right Panel — login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">LumoChat</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {currentForm === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground mt-2 text-[15px]">
              {currentForm === "login" ? "Sign in to LumoChat to continue chatting" : "Join LumoChat and start connecting"}
            </p>
          </div>

          {currentForm === "login" && (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Test Credentials</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "User 1", email: "testing1@gmail.com", password: "Password123" },
                  { label: "User 2", email: "testing2@gmail.com", password: "Password123" },
                ].map((cred) => (
                  <button
                    key={cred.label}
                    type="button"
                    onClick={() => { setEmail(cred.email); setPassword(cred.password); setFieldErrors({}); setFormError(""); }}
                    className="text-left rounded-xl bg-background border border-border px-3 py-2.5 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{cred.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{cred.email}</p>
                    <p className="text-[11px] text-muted-foreground">{cred.password}</p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Click a card to fill in the credentials.</p>
            </div>
          )}

          <div className="space-y-3">
            {currentForm === "register" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  className={`w-full h-12 px-5 rounded-full bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${fieldErrors.name ? "ring-2 ring-destructive/50" : "focus:ring-primary/30"}`}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors((prev) => ({ ...prev, name: undefined })); }}
                />
                {fieldErrors.name && <p className="text-xs text-destructive mt-1 ml-2">{fieldErrors.name}</p>}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full h-12 px-5 rounded-full bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${fieldErrors.email ? "ring-2 ring-destructive/50" : "focus:ring-primary/30"}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
              />
              {fieldErrors.email && <p className="text-xs text-destructive mt-1 ml-2">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full h-12 px-5 pr-12 rounded-full bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${fieldErrors.password ? "ring-2 ring-destructive/50" : "focus:ring-primary/30"}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-destructive mt-1 ml-2">{fieldErrors.password}</p>}
            </div>
          </div>

          {formError && (
            <p className={`text-sm mt-2 ${formError.startsWith("Registration") ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {formError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-[15px] font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait…" : currentForm === "register" ? "Sign Up" : "Sign In"}
          </Button>

          <div className="text-center">
            {currentForm === "register" ? (
              <p className="text-muted-foreground mt-2 text-[15px]">
                Already have an account?{" "}
                <span
                  onClick={() => switchForm("login")}
                  className="text-secondary-foreground cursor-pointer font-semibold underline"
                >
                  Sign In
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground mt-2 text-[15px]">
                Don't have an account?{" "}
                <span
                  onClick={() => switchForm("register")}
                  className="text-secondary-foreground cursor-pointer font-semibold underline"
                >
                  Sign Up
                </span>
              </p>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            By continuing, you agree to LumoChat's{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthenticationPage;
