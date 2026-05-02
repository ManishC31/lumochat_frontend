import { MessageCircle, Shield, Zap, Users, CheckCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PreviewSection from "@/components/PreviewSection";
import { useAuth } from "@/contexts/AuthContext";

const AuthenticationPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentForm, setCurrentForm] = useState<"login" | "register">("login");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/chat");
    }
  }, [isAuthenticated, navigate]);

  // submit form for login and register user.
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setFormError("");

    if (!email || !password || (currentForm === "register" && !name)) {
      setFormError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (currentForm === "login") {
        await login({ email, password });
        navigate("/chat");
      } else {
        await register({ name: name.trim(), email, password });
        // After register, switch to login or auto login
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
        <div className="w-full max-w-md space-y-8 opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">LumoChat</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2 text-[15px]">Sign in to continue your conversations</p>
          </div>

          {/* Email input (visual) */}
          <div className="space-y-3">
            {currentForm === "register" ? (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full h-12 px-5 rounded-full bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            ) : null}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full h-12 px-5 rounded-full bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full h-12 px-5 pr-12 rounded-full bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 text-[15px] font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {currentForm === "register" ? "Sign Up" : "Sign In"}
          </Button>

          {formError ? <p className="text-sm text-destructive mt-2">{formError}</p> : null}

          <div className="text-center">
            {currentForm === "register" ? (
              <p className="text-muted-foreground mt-2 text-[15px]">
                Already have an account ?{" "}
                <span
                  onClick={() => {
                    setCurrentForm("login");
                  }}
                  className="text-secondary-foreground cursor-pointer font-semibold underline"
                >
                  Sign In
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground mt-2 text-[15px]">
                Don't have an account ?{" "}
                <span
                  onClick={() => {
                    setCurrentForm("register");
                  }}
                  className="text-secondary-foreground cursor-pointer font-semibold underline"
                >
                  Sign Up
                </span>
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            className="w-full h-12 text-[15px] font-medium gap-3 rounded-full border border-border bg-card text-foreground hover:bg-muted/60 hover:border-primary/30 transition-all"
            variant="outline"
            onClick={() => alert("Google authentication is not yet configured")}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

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
        </div>
      </div>
    </div>
  );
};

export default AuthenticationPage;
