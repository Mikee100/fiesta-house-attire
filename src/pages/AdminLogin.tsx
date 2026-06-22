import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SEO from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAdmin, isAdminAuthenticated, refreshAdminSession } from "@/lib/adminAuth";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get("next") || "/admin";

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      if (isAdminAuthenticated()) {
        navigate(next, { replace: true });
        return;
      }

      const restored = await refreshAdminSession();
      if (mounted && restored) {
        navigate(next, { replace: true });
      }
    };

    restoreSession();
    return () => {
      mounted = false;
    };
  }, [navigate, next]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await loginAdmin(email, password);

    if (!success) {
      toast.error("Invalid admin email or password");
      setSubmitting(false);
      return;
    }

    toast.success("Welcome back");
    navigate(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-12">
      <SEO title="Admin Login" noindex nofollow />

      <Card className="w-full max-w-md border-slate-200/80 shadow-xl shadow-slate-200/40">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--magenta)] to-[var(--sky-blue)] text-white flex items-center justify-center">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Admin Sign In</CardTitle>
          <CardDescription>
            Sign in to access Fiesta House admin tools.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fiestahouseattire.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--magenta)] hover:bg-[var(--sky-blue)] text-white"
              disabled={submitting}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-[var(--magenta)] transition-colors">
              Back to website
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
