import { supabase } from "@/integrations/supabase/client";

export type AuthResult = { ok: true; email: string; userId: string } | { ok: false; error: string };

export type AuthAccount = { email: string; userId: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateCredentials(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email)) return "올바른 이메일 주소를 입력해 주세요.";
  if (password.length < 6) return "비밀번호를 6자 이상 입력해 주세요.";
  return null;
}

function accountFromUser(user: { id: string; email?: string | null }): AuthAccount | null {
  return user.email ? { email: user.email, userId: user.id } : null;
}

function authErrorMessage(message: string, mode: "login" | "signup", code?: string) {
  const normalized = message.toLowerCase();
  if (code === "email_provider_disabled" || normalized.includes("email provider is disabled")) {
    return "이메일 회원가입이 아직 활성화되지 않았어요. 관리자 설정이 필요해요.";
  }
  if (code === "signup_disabled" || normalized.includes("signups not allowed")) {
    return "현재 신규 회원가입이 잠시 중단되어 있어요.";
  }
  if (code === "email_address_invalid") return "사용할 수 없는 이메일 주소예요.";
  if (code === "over_email_send_rate_limit") {
    return "인증 이메일을 너무 여러 번 요청했어요. 잠시 후 다시 시도해 주세요.";
  }
  if (code === "over_request_rate_limit") {
    return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  }
  if (code === "weak_password") return "더 안전한 비밀번호를 입력해 주세요.";
  if (normalized.includes("invalid login credentials"))
    return "아이디 또는 비밀번호가 맞지 않아요.";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "이미 가입된 이메일이에요. 로그인해 주세요.";
  }
  if (normalized.includes("email not confirmed")) return "이메일 인증을 완료한 뒤 로그인해 주세요.";
  if (normalized.includes("password")) return "비밀번호는 6자 이상 입력해 주세요.";
  return mode === "signup"
    ? "회원가입을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."
    : "로그인하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export async function createAccount(emailInput: string, password: string): Promise<AuthResult> {
  const email = normalizeEmail(emailInput);
  const validationError = validateCredentials(email, password);
  if (validationError) return { ok: false, error: validationError };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: authErrorMessage(error.message, "signup", error.code) };

  const account = data.user ? accountFromUser(data.user) : null;
  if (!account) return { ok: false, error: "회원가입 정보를 확인하지 못했어요." };
  if (!data.session) {
    return { ok: false, error: "가입 확인 이메일을 보냈어요. 인증을 완료한 뒤 로그인해 주세요." };
  }
  return { ok: true, ...account };
}

export async function authenticateAccount(
  emailInput: string,
  password: string,
): Promise<AuthResult> {
  const email = normalizeEmail(emailInput);
  const validationError = validateCredentials(email, password);
  if (validationError) return { ok: false, error: validationError };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: authErrorMessage(error.message, "login", error.code) };

  const account = data.user ? accountFromUser(data.user) : null;
  return account
    ? { ok: true, ...account }
    : { ok: false, error: "로그인 정보를 확인하지 못했어요." };
}

export async function getCurrentAccount(): Promise<AuthAccount | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ? accountFromUser(data.session.user) : null;
}

export function observeAuthAccount(onChange: (account: AuthAccount | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session?.user ? accountFromUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signOutAccount() {
  await supabase.auth.signOut();
}
