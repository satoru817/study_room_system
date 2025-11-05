"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doGet } from "../elfs/WebserviceElf";

export default function TeacherDashboard() {
  const router = useRouter();
  const [cramSchoolId, setCramSchoolId] = useState(null);
  const [cramSchools, setCramSchools] = useState([]);

  useEffect(() => {
    const fetchCramSchools = async () => {
      const _cramSchools = await doGet("/api/cramschool/get");
      setCramSchools(_cramSchools);
    };

    fetchCramSchools();
  }, []);

  const handleSubmit = () => {
    if (cramSchoolId) {
      const selectedSchool = cramSchools.find(
        (school) => school.cramSchoolId === cramSchoolId
      );

      if (selectedSchool) {
        router.push(
          `/teacher-dashboard/cramschool/?cramSchoolId=${encodeURIComponent(
            cramSchoolId
          )}&name=${encodeURIComponent(selectedSchool.name)}`
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
                disabled={!cramSchoolId}
              >
                Go
              </button>
            </div>
            <div className="card-body">
              <div className="list-group">
                {cramSchools.map((school) => (
                  <button
                    key={school.cramSchoolId}
                    type="button"
                    className={`list-group-item list-group-item-action ${
                      cramSchoolId === school.cramSchoolId ? "active" : ""
                    }`}
                    onClick={() => setCramSchoolId(school.cramSchoolId)}
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
