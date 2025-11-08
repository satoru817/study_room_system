"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doGet, doLogout } from "../elfs/WebserviceElf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function TeacherDashboard() {
  const router = useRouter();
  const [cramSchoolId, setCramSchoolId] = useState(null);
  const [cramSchools, setCramSchools] = useState([]);

  const handleLogout = async () => {
    try {
      await doLogout();
      router.push("/user-login");
    } catch (error) {
      console.error("ログアウトに失敗:", error);
      alert("ログアウトに失敗しました");
    }
  };

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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            校舎選択
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2 px-4 rounded-full transition duration-200 ease-in-out flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>

        {/* 校舎リスト */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {cramSchools.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {cramSchools.map((school) => (
                <button
                  key={school.cramSchoolId}
                  type="button"
                  onClick={() => setCramSchoolId(school.cramSchoolId)}
                  className={`w-full px-6 py-4 flex items-center justify-between transition duration-200 ${
                    cramSchoolId === school.cramSchoolId
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`text-lg font-medium ${
                      cramSchoolId === school.cramSchoolId
                        ? "text-blue-700"
                        : "text-gray-800"
                    }`}
                  >
                    {school.name}
                  </span>
                  {cramSchoolId === school.cramSchoolId && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Goボタン */}
        {cramSchools.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={!cramSchoolId}
              className={`w-full py-4 rounded-full font-semibold text-lg transition duration-200 flex items-center justify-center gap-2 ${
                cramSchoolId
                  ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              選択した校舎に進む
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
