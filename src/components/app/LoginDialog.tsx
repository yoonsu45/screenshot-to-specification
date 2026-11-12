import { type FormEvent, useEffect, useState } from "react";
import { LoaderCircle, LogOut, UserRound, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";

type Mode = "login" | "signup";

export function LoginDialog() {
  const {
    userEmail,
    authOpen,
    setAuthOpen,
    authPromptOpen,
    setAuthPromptOpen,
    login,
    signup,
    logout,
  } = useAppStore();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (authOpen) return;
    setPassword("");
    setPasswordConfirm("");
    setError("");
    setPending(false);
    setMode("login");
  }, [authOpen]);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setPassword("");
    setPasswordConfirm("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "signup" && password !== passwordConfirm) {
      setError("비밀번호가 서로 일치하지 않아요.");
      return;
    }

    setPending(true);
    const result = mode === "signup"
      ? await signup(email, password)
      : await login(email, password);
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    toast.success(mode === "signup" ? "회원가입이 완료됐어요." : "로그인했어요.");
  }

  function handleLogout() {
    logout();
    toast.success("로그아웃했어요.");
  }

  if (userEmail) {
    return (
      <div className="relative z-10 flex items-center gap-2 self-end">
        <span className="hidden max-w-36 truncate rounded-full bg-background/90 px-3 py-2 text-xs font-semibold text-primary shadow-sm sm:inline-block">
          {userEmail}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          className="h-12 rounded-full border-2 border-primary bg-background px-5 text-base font-extrabold text-primary hover:bg-secondary"
        >
          <LogOut /> 로그아웃
        </Button>
      </div>
    );
  }

  const isSignup = mode === "signup";
  const title = isSignup ? "회원가입" : "로그인";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setAuthOpen(true)}
        className="relative z-10 h-12 self-end rounded-full border-2 border-primary bg-background px-7 text-lg font-extrabold text-primary hover:bg-secondary"
      >
        로그인
      </Button>

      <Dialog open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
        <DialogContent className="max-w-sm rounded-[1.75rem]" onOpenAutoFocus={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-primary">
              <UserRound className="h-6 w-6" /> 로그인 필요
            </DialogTitle>
            <DialogDescription className="pt-1 text-base leading-6 text-foreground">
              로그인이 필요한 서비스입니다. 로그인하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              onClick={() => {
                setAuthPromptOpen(false);
                setAuthOpen(true);
              }}
              className="rounded-xl font-extrabold"
            >
              예
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAuthPromptOpen(false)}
              className="rounded-xl font-extrabold"
            >
              아니요
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-md rounded-[1.75rem]" onOpenAutoFocus={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-primary">
              {isSignup ? <UserRoundPlus className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
              {title}
            </DialogTitle>
            <DialogDescription>
              {isSignup
                ? "계정을 만들면 나만의 방문 일정을 저장할 수 있어요."
                : <>
                    일정을 담으려면 로그인해 주세요.
                    <br />
                    다른 기능은 비회원도 이용할 수 있어요.
                  </>}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="auth-email" className="text-sm font-extrabold text-primary">아이디</label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="이메일 주소를 입력해 주세요"
                autoComplete="email"
                disabled={pending}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="auth-password" className="text-sm font-extrabold text-primary">비밀번호</label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="4자 이상 입력해 주세요"
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={4}
                disabled={pending}
                required
              />
            </div>

            {isSignup && (
              <div className="space-y-2">
                <label htmlFor="auth-password-confirm" className="text-sm font-extrabold text-primary">비밀번호 확인</label>
                <Input
                  id="auth-password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="비밀번호를 한 번 더 입력해 주세요"
                  autoComplete="new-password"
                  minLength={4}
                  disabled={pending}
                  required
                />
              </div>
            )}

            {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">{error}</p>}

            <Button type="submit" disabled={pending} className="w-full rounded-xl font-extrabold">
              {pending && <LoaderCircle className="animate-spin" />}
              {isSignup ? "계정 만들기" : "로그인"}
            </Button>

            <div className="border-t border-border pt-4 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                {isSignup ? "이미 계정이 있나요?" : "아직 계정이 없으신가요?"}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => changeMode(isSignup ? "login" : "signup")}
                className="w-full rounded-xl border-primary font-extrabold text-primary"
              >
                {isSignup ? "로그인으로 돌아가기" : "회원가입"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
