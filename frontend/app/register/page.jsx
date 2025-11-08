"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doPost } from "../elfs/WebserviceElf.js";

function StudentRegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await doPost("/api/student/register", {
        token: token,
        loginName: loginName,
        password: password,
      });

      alert("登録が完了しました！");
      router.push("/student/login");
    } catch (e) {
      console.error("Registration failed:", e);
      setError("登録に失敗しました。トークンが無効か、既に使用されています。");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          無効なリンクです。正しい登録リンクからアクセスしてください。
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card mx-auto" style={{ maxWidth: "500px" }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">
            <i className="bi bi-person-plus-fill me-2"></i>
            生徒登録
          </h2>

          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError("")}
              ></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">
                <i className="bi bi-person me-2"></i>
                ログイン名
              </label>
              <input
                type="text"
                className="form-control"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="ログイン名を入力"
                required
                disabled={isLoading}
              />
              <div className="form-text">この名前でログインします</div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">
                <i className="bi bi-lock me-2"></i>
                パスワード
              </label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上のパスワード"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">
                <i className="bi bi-lock-fill me-2"></i>
                パスワード確認
              </label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度パスワードを入力"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  登録中...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  登録
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StudentStatusPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <StudentRegisterPage />
    </Suspense>
  );
}
