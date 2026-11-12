import { type FormEvent, useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
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
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.length < 4) {
      setError("비밀번호는 4자 이상 입력해 주세요.");
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
        <Button type="button" variant="outline" onClick={handleLogout} className="h-12 rounded-full border-2 border-primary bg-background px-6 text-base font-extrabold text-primary hover:bg-secondary">
          <LogOut /> {LOGOUT_LABEL}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="relative z-10 h-12 self-end rounded-full border-2 border-primary bg-background px-7 text-lg font-extrabold text-primary hover:bg-secondary">
        {LOGIN_LABEL}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary"><UserRound className="h-5 w-5" />{LOGIN_LABEL}</DialogTitle>
            <DialogDescription>로그인하면 이 브라우저에 행사 계획이 저장됩니다.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><label htmlFor="login-email" className="text-sm font-semibold">아이디</label><Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일 주소를 입력해 주세요" autoComplete="email" required /></div>
            <div className="space-y-2"><label htmlFor="login-password" className="text-sm font-semibold">비밀번호</label><Input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="4자 이상 입력해 주세요" autoComplete="current-password" required /></div>
            {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
            <DialogFooter><Button type="submit" className="w-full rounded-xl font-bold sm:w-auto">{LOGIN_LABEL}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
