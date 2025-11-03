"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_URL } from "../constants/urls.js";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login_name: name, password }),
    });

    if (response.ok) {
      const data = await response.json();
      const user = data.user;
      // this token contains information about the user
      // so use this
      const token = data.token;
      localStorage.setItem("jwt-token", token);

      if (user.role === "teacher") {
        router.push("/teacher-dashboard");
      } else if (user.role === "student") {
        router.push("/student-dashboard");
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="col-md-4">
        <h2 className="text-center mb-4">ログイン</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="loginName" className="form-label">
              ユーザー名
            </label>
            <input
              id="loginName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ユーザー名"
              className="form-control"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              className="form-control"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
