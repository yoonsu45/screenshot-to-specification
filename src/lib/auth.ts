export type AuthResult = { ok: true; email: string } | { ok: false; error: string };

type StoredAccount = {
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
};

const ACCOUNTS_KEY = "thecheck-accounts-v1";
export const AUTH_SESSION_KEY = "thecheck-session-v1";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createSalt() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

function validateCredentials(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email)) return "올바른 이메일 주소를 입력해 주세요.";
  if (password.length < 4) return "비밀번호를 4자 이상 입력해 주세요.";
  return null;
}

export async function createAccount(emailInput: string, password: string): Promise<AuthResult> {
  const email = normalizeEmail(emailInput);
  const validationError = validateCredentials(email, password);
  if (validationError) return { ok: false, error: validationError };

  try {
    const accounts = loadAccounts();
    if (accounts.some((account) => account.email === email)) {
      return { ok: false, error: "이미 가입된 이메일이에요. 로그인해 주세요." };
    }

    const salt = createSalt();
    accounts.push({
      email,
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    });
    saveAccounts(accounts);
    localStorage.setItem(AUTH_SESSION_KEY, email);
    return { ok: true, email };
  } catch {
    return { ok: false, error: "이 브라우저에 계정을 저장할 수 없어요. 저장 공간 설정을 확인해 주세요." };
  }
}

export async function authenticateAccount(emailInput: string, password: string): Promise<AuthResult> {
  const email = normalizeEmail(emailInput);
  const validationError = validateCredentials(email, password);
  if (validationError) return { ok: false, error: validationError };

  try {
    const account = loadAccounts().find((item) => item.email === email);
    if (!account) return { ok: false, error: "가입되지 않은 이메일이에요. 먼저 회원가입해 주세요." };

    const passwordHash = await hashPassword(password, account.salt);
    if (passwordHash !== account.passwordHash) {
      return { ok: false, error: "비밀번호가 일치하지 않아요." };
    }

    localStorage.setItem(AUTH_SESSION_KEY, email);
    return { ok: true, email };
  } catch {
    return { ok: false, error: "로그인 정보를 확인할 수 없어요. 잠시 후 다시 시도해 주세요." };
  }
}
