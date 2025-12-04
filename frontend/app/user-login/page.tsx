"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { checkMe, doLogin, getCsrfToken } from "../elfs/WebserviceElf.js";
import { Eye, EyeOff } from "lucide-react";

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const _loginName = searchParams.get("loginName");
  const _password = searchParams.get("password");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigateBasedOnRole = useCallback(
    async (role: string, id: number) => {
      const navigateTo =
        role === "ROLE_STUDENT"
          ? `/student-dashboard?studentId=${encodeURIComponent(id)}`
          : "/teacher-dashboard";
      router.push(navigateTo);
    },
    [router]
  );

  const login = useCallback(
    async (_name: string, _password: string) => {
      setIsSubmitting(true);
      const response = await doLogin(_name, _password);

      if (response.success) {
        setIsSubmitting(false);
        const role = response.role;
        const id = response.id;
        await getCsrfToken();
        navigateBasedOnRole(role, id);
      } else {
        setIsSubmitting(false);
        alert(response.error || "ログインに失敗しました");
      }
    },
    [navigateBasedOnRole]
  );

  useEffect(() => {
    const init = async () => {
      await getCsrfToken();

      const principal = await checkMe();
      if (principal.authenticated) {
        navigateBasedOnRole(principal.role, principal.username);
      }
    };

    const _login = async (_name: string, _password: string) => {
      await login(_name, _password);
    };

    if (_loginName && _password) {
      _login(_loginName, _password);
    } else {
      init();
    }
  }, [_loginName, _password, login, navigateBasedOnRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await login(username, password);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100 px-3">
      <div className="card mx-auto w-100" style={{ maxWidth: "400px" }}>
        <div className="card-body p-3 p-sm-4">
          <h2 className="card-title mb-3 text-center">ログイン</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">
                ログイン名またはメールアドレス
              </label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">パスワード</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <span
                  className="input-group-text"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UserLoginPage() {
  return (
    <Suspense fallback={<div>読み込み中</div>}>
      <LoginPage />
    </Suspense>
  );
}
