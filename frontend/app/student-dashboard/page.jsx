"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { doGet } from "../elfs/WebserviceElf";

/**
 * what should be done here?
 * student should be able to book study-room reservation(maybe we should make limit)
 * student should be able to scan qr code and send notification to their parents
 * student should be able to see how long he had studied in total
 */

function StudentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentName = searchParams.get("username");
  const [todaysReservations, setTodaysReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysReservations = async () => {
      try {
        const reservationsOfThisStudent = await doGet(
          "/api/reservation/getTodays"
        );
        setTodaysReservations(reservationsOfThisStudent);
      } catch (error) {
        console.error("予約の取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysReservations();
  }, []);

  const handleBookReservation = () => {
    router.push("/student-dashboard/book");
  };

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ヘッダー部分 */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              ようこそ、{studentName}さん
            </h1>
            <p className="text-gray-600">今日の予約状況</p>
          </div>

          {/* 予約ボタン */}
          <button
            onClick={handleBookReservation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 flex items-center gap-2"
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

      {/* 予約リスト */}
      <div className="max-w-4xl mx-auto">
        {todaysReservations && todaysReservations.length > 0 ? (
          <div className="space-y-4">
            {todaysReservations.map((reservation, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {reservation.studyRoomName}
                    </h3>
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-lg">
                        {reservation.startHour} - {reservation.endHour}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      予約済み
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-4">今日の予約はありません</p>
            <button
              onClick={handleBookReservation}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              予約を作成する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="p-6">読み込み中...</div>}>
      <StudentContent />
    </Suspense>
  );
}
