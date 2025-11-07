"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkMe, doLogin, getCsrfToken } from "../elfs/WebserviceElf.js";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const navigateBasedOnRole = useCallback(
    async (role: string, username: string) => {
      const navigateTo =
        role === "ROLE_STUDENT"
          ? `/student-dashboard?username=${encodeURIComponent(username)}`
          : "/teacher-dashboard";
      router.push(navigateTo);
    },
    [router]
  );

  useEffect(() => {
    const init = async () => {
      await getCsrfToken();

      const principal = await checkMe();
      if (principal.authenticated) {
        navigateBasedOnRole(principal.role, principal.username);
      }
    };

    init();
  }, [navigateBasedOnRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    const response = await doLogin(username, password);

    if (response.success) {
      setIsSubmitting(false);
      const role = response.role;
      await getCsrfToken();
      navigateBasedOnRole(role, username);
    } else {
      setIsSubmitting(false);
      alert(response.error || "ログインに失敗しました");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card mx-auto" style={{ maxWidth: "400px" }}>
        <div className="card-body">
          <h2 className="card-title">ログイン</h2>
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
