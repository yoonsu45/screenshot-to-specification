import { type FormEvent, useEffect, useState } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const USER_KEY = "olpark-user-v1";
const LOGIN_LABEL = "\uB85C\uADF8\uC778";
const LOGOUT_LABEL = "\uB85C\uADF8\uC544\uC6C3";

export function LoginDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setUserEmail(localStorage.getItem(USER_KEY));
    } catch {
      // localStorage may be unavailable during server rendering or private browsing.
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    try {
      localStorage.setItem(USER_KEY, trimmedEmail);
    } catch {
      // Keep the session in memory when persistence is unavailable.
    }
    setUserEmail(trimmedEmail);
    setEmail("");
    setPassword("");
    setError("");
    setOpen(false);
  }

  function handleLogout() {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // The in-memory state is still cleared below.
    }
    setUserEmail(null);
  }

  if (userEmail) {
    return (
      <div className="relative z-10 flex items-center gap-2 self-end">
        <span className="hidden max-w-36 truncate rounded-full bg-background/90 px-3 py-2 text-xs font-semibold text-primary shadow-sm sm:inline-block">{userEmail}</span>
        <Button type="button" variant="outline" size="sm" onClick={handleLogout} className="rounded-full border-primary/20 bg-background/90 font-bold text-primary backdrop-blur-sm hover:bg-background">
          <LogOut /> {LOGOUT_LABEL}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="relative z-10 self-end rounded-full bg-primary px-4 font-bold text-primary-foreground shadow-fab hover:bg-primary/90">
        <LogIn /> {LOGIN_LABEL}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary"><UserRound className="h-5 w-5" />{LOGIN_LABEL}</DialogTitle>
            <DialogDescription>Sign in to keep your event plans saved in this browser.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><label htmlFor="login-email" className="text-sm font-semibold">Email</label><Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
            <div className="space-y-2"><label htmlFor="login-password" className="text-sm font-semibold">Password</label><Input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 4 characters" autoComplete="current-password" required /></div>
            {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
            <DialogFooter><Button type="submit" className="w-full rounded-xl font-bold sm:w-auto">{LOGIN_LABEL}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
