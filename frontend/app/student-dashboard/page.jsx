"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { doGet, doPost, doLogout } from "../elfs/WebserviceElf";
import { Html5QrcodeScanner } from "html5-qrcode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 学習時間グラフコンポーネント
function StudyTimeChart() {
  const [chartData, setChartData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("4weeks");
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [averageHours, setAverageHours] = useState(0);

  const periodOptions = [
    { value: "4weeks", label: "1ヶ月", weeks: 4 },
    { value: "12weeks", label: "3ヶ月", weeks: 12 },
    { value: "24weeks", label: "半年", weeks: 24 },
    { value: "all", label: "全期間", weeks: 0 },
  ];

  useEffect(() => {
    fetchStudyHistory();
  }, [selectedPeriod]);

  const fetchStudyHistory = async () => {
    setLoading(true);
    try {
      const selectedOption = periodOptions.find(
        (opt) => opt.value === selectedPeriod
      );
      const requestBody = {
        isAll: selectedPeriod === "all",
        weeks: selectedOption.weeks,
      };

      const response = await doPost("/api/attendance/histories", requestBody);

      const formattedData = response.histories.map((record) => {
        const date = new Date(record.weekStartDay);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = (record.totalMinutes / 60).toFixed(1);

        return {
          weekStart: `${month}/${day}`,
          hours: parseFloat(hours),
          fullDate: record.weekStartDay,
        };
      });

      setChartData(formattedData);

      const total = formattedData.reduce(
        (sum, record) => sum + record.hours,
        0
      );
      const average =
        formattedData.length > 0 ? total / formattedData.length : 0;

      setTotalHours(total.toFixed(1));
      setAverageHours(average.toFixed(1));
    } catch (error) {
      console.error("学習履歴の取得に失敗:", error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].payload.weekStart}の週
          </p>
          <p className="text-lg font-bold text-blue-600">
            {payload[0].value}時間
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
        📊 学習時間の推移
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedPeriod(option.value)}
            className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              selectedPeriod === option.value
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">累計時間</p>
          <p className="text-2xl font-bold text-blue-600">{totalHours}h</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">週平均</p>
          <p className="text-2xl font-bold text-green-600">{averageHours}h</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="weekStart"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                stroke="#9ca3af"
                label={{
                  value: "時間",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12, fill: "#6b7280" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: "#2563eb", r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg
            className="w-16 h-16 mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-center">この期間のデータがありません</p>
          <p className="text-sm text-center mt-2">
            自習室を利用すると記録されます
          </p>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <p className="text-sm text-gray-700">
            {totalHours > 0 ? (
              <>
                <span className="font-bold text-blue-600">すばらしい！</span>
                {` ${
                  selectedPeriod === "all"
                    ? "今まで"
                    : periodOptions.find((opt) => opt.value === selectedPeriod)
                        ?.label
                }で${totalHours}時間も学習しました！`}
                {averageHours > 10 && " この調子で頑張りましょう🔥"}
              </>
            ) : (
              "これから頑張りましょう！💪"
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function StudentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentName = searchParams.get("username");
  const [todaysReservations, setTodaysReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isValidTime, setIsValidTime] = useState(false);
  const [qrButtonState, setQrButtonState] = useState(null);
  const scannerRef = useRef(null);
  const qrScannerInstanceRef = useRef(null);

  const handleLogout = async () => {
    try {
      await doLogout();
      router.push("/user-login");
    } catch (error) {
      console.error("ログアウトに失敗:", error);
      alert("ログアウトに失敗しました");
    }
  };

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

    if (reservation.hasCheckedIn && !reservation.hasCheckedOut) {
      const checkoutDeadline = endTimeInMinutes + 30;
      if (currentTimeInMinutes <= checkoutDeadline) {
        return "checkout";
      }
    }

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

        if (Array.isArray(reservationsOfThisStudent)) {
          setTodaysReservations(reservationsOfThisStudent);
        } else {
          console.error(
            "予約データが配列ではありません:",
            reservationsOfThisStudent
          );
          setTodaysReservations([]);
        }
      } catch (error) {
        console.error("予約の取得に失敗しました:", error);
        setTodaysReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysReservations();
  }, []);

  useEffect(() => {
    const checkValidTime = () => {
      const buttonState = getQRButtonState();
      setQrButtonState(buttonState);
      setIsValidTime(buttonState !== null);
    };

    checkValidTime();
    const interval = setInterval(checkValidTime, 60000);

    return () => clearInterval(interval);
  }, [todaysReservations]);

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
        // スキャン中のエラーは無視
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
        await doPost("/api/attendance/record", {
          studyRoomId: scannedData.studyRoomId,
        });
        alert("入室を記録しました！");
      } else if (actionType === "checkout") {
        await doPost("/api/attendance/checkout", {
          studyRoomId: scannedData.studyRoomId,
        });
        alert("退室を記録しました！");
      }

      handleCloseQRScanner();

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              ようこそ、{studentName}さん
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">今日の予約状況</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2 px-4 rounded-full transition duration-200 ease-in-out flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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
      <div className="max-w-4xl mx-auto mb-6">
        {todaysReservations && todaysReservations.length > 0 ? (
          <div className="space-y-4">
            {todaysReservations.map((reservation, index) => {
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

      {/* 学習時間グラフ - 予約リストの下に配置 */}
      <div className="max-w-4xl mx-auto">
        <StudyTimeChart />
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

            {!scannedData ? (
              <div>
                <div id="qr-reader" ref={scannerRef} className="mb-4"></div>
                <p className="text-center text-gray-600 text-sm">
                  カメラでQRコードをスキャンしてください
                </p>
              </div>
            ) : (
              <div className="space-y-4">
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
