"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doGet } from "../elfs/WebserviceElf";
import { CramSchool } from "../constants/types";

export default function TeacherDashboard() {
  const router = useRouter();
  const [cramschoolId, setcramschoolId] = useState(null);
  const [cramSchools, setCramSchools] = useState([]);

  // 所属校舎一覧を取得
  useEffect(() => {
    const fetchCramSchools = async () => {
      const _cramSchools = await doGet("/api/cramschool/get");
      setCramSchools(_cramSchools);
    };

    fetchCramSchools();
  }, []);

  // OKボタンで校舎ページに遷移
  const handleSubmit = () => {
    if (cramschoolId) {
      const selectedSchool = cramSchools.find(
        (school) => school.cramschoolId === cramschoolId
      );

      if (selectedSchool) {
        router.push(
          `/teacher-dashboard/${cramschoolId}?name=${encodeURIComponent(
            selectedSchool.name
          )}`
        );
      }
    } else {
      alert("校舎を選択してください");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">校舎選択</h4>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!cramschoolId}
              >
                Go
              </button>
            </div>
            <div className="card-body">
              <div className="list-group">
                {cramSchools.map((school) => (
                  <button
                    key={school.cramschoolId}
                    type="button"
                    className={`list-group-item list-group-item-action ${
                      cramschoolId === school.cramschoolId ? "active" : ""
                    }`}
                    onClick={() => setcramschoolId(school.cramschoolId)}
                  >
                    {school.name}
                  </button>
                ))}
              </div>
              {cramSchools.length === 0 && (
                <p className="text-center text-muted mt-3">読み込み中...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
