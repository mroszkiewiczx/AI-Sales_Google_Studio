import * as React from "react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getTranslator, Locale } from "@/i18n";

const LS_KEY = "salesos_lang_last";

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(LS_KEY);
  if (stored === "en" || stored === "pl") return stored;
  return "pl";
}

export default function AuthPage() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  const t = getTranslator(locale);

  React.useEffect(() => {
    const autoLogin = async () => {
      if (user) return;
      const email = "mateusz.roszkiewicz@optimakers.pl";
      const password = "21Browar2121#@";
      
      try {
        const signInResult = await signIn(email, password);
        if (signInResult.error) {
          if (signInResult.error.message.includes("auth/operation-not-allowed")) {
            console.warn("Email/Password auth is not enabled in Firebase Console.");
            return;
          }
          // Try to sign up if it's a new user
          await signUp(email, password, "Mateusz Roszkiewicz");
        }
      } catch (err) {
        // Silent fail for auto-login
      }
    };

    autoLogin();
  }, [user, signIn, signUp]);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = isSignUp
      ? await signUp(email, password, displayName)
      : await signIn(email, password);

    if (result.error) {
      if (result.error.message.includes("auth/operation-not-allowed")) {
        setError("Email/Password authentication is not enabled. Please use Google Sign-In or enable it in Firebase Console.");
      } else {
        setError(result.error.message);
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) setError(result.error.message);
    setLoading(false);
  };

  const toggleLocale = () => {
    const next = locale === "pl" ? "en" : "pl";
    setLocale(next);
    localStorage.setItem(LS_KEY, next);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                S
              </div>
              <span className="text-lg font-semibold">SalesOS</span>
            </div>
            <button
              type="button"
              onClick={toggleLocale}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border"
            >
              {locale === "pl" ? "EN" : "PL"}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? t("auth.createYourAccount") : t("auth.signInToWorkspace")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-9 gap-2"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs">{t("auth.name")}</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={t("auth.yourName")}
                  className="h-9"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-9"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/5 rounded-md p-2">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-9 active:scale-[0.97]"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? t("auth.createAccount") : t("auth.signIn")}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {isSignUp ? t("auth.alreadyHaveAccount") : t("auth.dontHaveAccount")}{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              >
                {isSignUp ? t("auth.signIn") : t("auth.signUp")}
              </button>
            </p>
          </form>

          <div className="mt-6 pt-4 border-t">
            <p className="text-[10px] text-muted-foreground text-center">
              {t("auth.testCredentials")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
