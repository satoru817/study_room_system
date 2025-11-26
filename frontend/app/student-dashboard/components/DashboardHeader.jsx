"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

export default function DashboardHeader({
  studentName,
  isValidTime,
  qrButtonState,
  onOpenQRScanner,
  onBookReservation,
  onLogout,
}) {
  return (
    <div className="max-w-4xl mx-auto mb-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            ようこそ、{studentName}さん
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">今日の予約状況</p>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2 px-4 rounded-full transition duration-200 ease-in-out flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span className="hidden sm:inline">ログアウト</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onOpenQRScanner}
          disabled={!isValidTime}
          className={`${
            !isValidTime
              ? "bg-gray-400 cursor-not-allowed"
              : qrButtonState === "checkout"
              ? "bg-blue-600 active:bg-blue-700"
              : "bg-green-600 active:bg-green-700"
          } text-white font-semibold py-3 px-5 rounded-full transition duration-200 ease-in-out flex items-center justify-center gap-2 flex-1 sm:flex-initial`}
        >
          {qrButtonState === "checkout" ? (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              退室スキャン
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
              入室スキャン
            </>
          )}
        </button>

        <button
          onClick={onBookReservation}
          className="bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 px-5 rounded-full transition duration-200 ease-in-out flex items-center justify-center gap-2 flex-1 sm:flex-initial"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          新しい予約
        </button>
      </div>
    </div>
  );
}
