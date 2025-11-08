"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { doGet, doPost } from "../elfs/WebserviceElf";
import { Html5QrcodeScanner } from "html5-qrcode";

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
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const [actionType, setActionType] = useState(null); // "checkin" or "checkout"
  const [isValidTime, setIsValidTime] = useState(false);
  const [qrButtonState, setQrButtonState] = useState(null);
  const scannerRef = useRef(null);
  const qrScannerInstanceRef = useRef(null);

  // 入室・退室を判定する関数
  const determineAction = (reservation) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const startParts = reservation.startHour.split(":");
    const endParts = reservation.endHour.split(":");

    const startTimeInMinutes =
      parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endTimeInMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

    // 退室可能：入室済み & 予約終了時刻+30分以内
    if (reservation.hasCheckedIn && !reservation.hasCheckedOut) {
      const checkoutDeadline = endTimeInMinutes + 30;
      if (currentTimeInMinutes <= checkoutDeadline) {
        return "checkout";
      }
    }

    // 入室可能：未入室 & 開始5分前〜終了5分前
    if (!reservation.hasCheckedIn) {
      const validStartTime = startTimeInMinutes - 5;
      const validEndTime = endTimeInMinutes - 5;

      if (
        currentTimeInMinutes >= validStartTime &&
        currentTimeInMinutes <= validEndTime
      ) {
        return "checkin";
      }
    }

    return null;
  };

  // 現在時刻が予約時間の有効範囲内かチェック（入室 or 退室可能か）
  const isWithinValidTimeRange = () => {
    if (!todaysReservations || todaysReservations.length === 0) {
      return false;
    }

    for (const reservation of todaysReservations) {
      const action = determineAction(reservation);
      if (action !== null) {
        return true;
      }
    }

    return false;
  };

  // QRボタンの状態を判定（入室 or 退室）
  const getQRButtonState = () => {
    if (!todaysReservations || todaysReservations.length === 0) {
      return null;
    }

    for (const reservation of todaysReservations) {
      const action = determineAction(reservation);
      if (action === "checkout") {
        return "checkout";
      }
      if (action === "checkin") {
        return "checkin";
      }
    }

    return null;
  };

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

  // 時間の有効性を1分ごとにチェック
  useEffect(() => {
    const checkValidTime = () => {
      const buttonState = getQRButtonState();
      setQrButtonState(buttonState);
      setIsValidTime(buttonState !== null);
    };

    checkValidTime(); // 初回チェック
    const interval = setInterval(checkValidTime, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [todaysReservations]);

  // QRスキャナーのクリーンアップ
  useEffect(() => {
    return () => {
      if (qrScannerInstanceRef.current) {
        qrScannerInstanceRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const handleBookReservation = () => {
    router.push("/student-dashboard/book");
  };

  const handleOpenQRScanner = () => {
    if (!isValidTime) {
      alert("QRコードスキャンは予約時間内のみ利用可能です");
      return;
    }
    setShowQRScanner(true);
    setScannedData(null);
    setActionType(null);
  };

  const handleCloseQRScanner = () => {
    if (qrScannerInstanceRef.current) {
      qrScannerInstanceRef.current.clear().catch(console.error);
      qrScannerInstanceRef.current = null;
    }
    setShowQRScanner(false);
    setQrScannerActive(false);
    setActionType(null);
  };

  const startScanner = () => {
    if (qrScannerActive || !scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText, decodedResult) => {
        try {
          const qrData = JSON.parse(decodedText);

          // 現在の予約を見つけて、アクションを判定
          const currentReservation = todaysReservations.find((reservation) => {
            return reservation.studyRoomId === qrData.studyRoomId;
          });

          if (!currentReservation) {
            alert("この自習室の予約が見つかりません");
            return;
          }

          const action = determineAction(currentReservation);

          if (action === null) {
            alert("現在、入室・退室できる時間ではありません");
            return;
          }

          setScannedData(qrData);
          setActionType(action);
          scanner.clear();
          setQrScannerActive(false);
          qrScannerInstanceRef.current = null;
        } catch (error) {
          console.error("QRコードの解析に失敗:", error);
          alert("無効なQRコードです");
        }
      },
      (errorMessage) => {
        // スキャン中のエラーは無視（カメラが読み取り中の場合に発生）
      }
    );

    qrScannerInstanceRef.current = scanner;
    setQrScannerActive(true);
  };

  useEffect(() => {
    if (showQRScanner && !qrScannerActive) {
      setTimeout(() => {
        startScanner();
      }, 100);
    }
  }, [showQRScanner]);

  const handleSubmitAttendance = async () => {
    if (!scannedData || !actionType) {
      alert("QRコードをスキャンしてください");
      return;
    }

    try {
      if (actionType === "checkin") {
        // 入室処理
        await doPost("/api/attendance/record", {
          studyRoomId: scannedData.studyRoomId,
        });
        alert("入室を記録しました！");
      } else if (actionType === "checkout") {
        // 退室処理
        await doPost("/api/attendance/checkout", {
          studyRoomId: scannedData.studyRoomId,
        });
        alert("退室を記録しました！");
      }

      handleCloseQRScanner();

      // 予約情報を再取得
      const updatedReservations = await doGet("/api/reservation/getTodays");
      setTodaysReservations(updatedReservations);
    } catch (error) {
      console.error("記録に失敗:", error);
      alert("記録に失敗しました");
    }
  };

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* ヘッダー部分 */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            ようこそ、{studentName}さん
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">今日の予約状況</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* QRコードスキャンボタン - 入室・退室で色分け */}
          <button
            onClick={handleOpenQRScanner}
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

          {/* 予約ボタン */}
          <button
            onClick={handleBookReservation}
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

      {/* 予約リスト */}
      <div className="max-w-4xl mx-auto">
        {todaysReservations && todaysReservations.length > 0 ? (
          <div className="space-y-4">
            {todaysReservations.map((reservation, index) => {
              // ステータスに応じた表示を決定
              let statusColor = "border-blue-500";
              let statusBadge = {
                text: "予約済み",
                bgColor: "bg-blue-100",
                textColor: "text-blue-800",
              };

              if (reservation.hasCheckedOut) {
                statusColor = "border-gray-400";
                statusBadge = {
                  text: "退室済み",
                  bgColor: "bg-gray-100",
                  textColor: "text-gray-800",
                };
              } else if (reservation.hasCheckedIn) {
                statusColor = "border-green-500";
                statusBadge = {
                  text: "入室中",
                  bgColor: "bg-green-100",
                  textColor: "text-green-800",
                };
              }

              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${statusColor}`}
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
                      {/* チェックイン・チェックアウト情報 */}
                      <div className="mt-2 flex gap-2 text-sm">
                        {reservation.hasCheckedIn && (
                          <div className="flex items-center text-green-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            入室済み
                          </div>
                        )}
                        {reservation.hasCheckedOut && (
                          <div className="flex items-center text-gray-600">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            退室済み
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 ${statusBadge.bgColor} ${statusBadge.textColor} rounded-full text-sm font-medium`}
                      >
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
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
              className="bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-200"
            >
              予約を作成する
            </button>
          </div>
        )}
      </div>

      {/* QRスキャナーモーダル */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                QRコードをスキャン
              </h2>
              <button
                onClick={handleCloseQRScanner}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* QRスキャナー */}
            {!scannedData ? (
              <div>
                <div id="qr-reader" ref={scannerRef} className="mb-4"></div>
                <p className="text-center text-gray-600 text-sm">
                  カメラでQRコードをスキャンしてください
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 入室の場合 */}
                {actionType === "checkin" && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-6 h-6 text-green-600 mr-2"
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
                      <h3 className="text-lg font-semibold text-green-800">
                        入室確認
                      </h3>
                    </div>
                    <div className="text-gray-700">
                      <p>自習室: {scannedData.roomName}</p>
                      <p>座席番号: {scannedData.seatNumber}</p>
                    </div>
                  </div>
                )}

                {/* 退室の場合 */}
                {actionType === "checkout" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <svg
                        className="w-6 h-6 text-blue-600 mr-2"
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
                      <h3 className="text-lg font-semibold text-blue-800">
                        退室確認
                      </h3>
                    </div>
                    <div className="text-gray-700">
                      <p>自習室: {scannedData.roomName}</p>
                      <p>座席番号: {scannedData.seatNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSubmitAttendance}
                    className={`flex-1 ${
                      actionType === "checkin"
                        ? "bg-green-600 active:bg-green-700"
                        : "bg-blue-600 active:bg-blue-700"
                    } text-white font-semibold py-3 px-6 rounded-full transition duration-200`}
                  >
                    {actionType === "checkin" ? "入室を記録" : "退室を記録"}
                  </button>
                  <button
                    onClick={() => {
                      setScannedData(null);
                      setActionType(null);
                      setTimeout(() => startScanner(), 100);
                    }}
                    className="flex-1 bg-gray-300 active:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-full transition duration-200"
                  >
                    再スキャン
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
