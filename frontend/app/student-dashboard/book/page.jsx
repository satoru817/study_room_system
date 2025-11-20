"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doGet, doPost } from "@/app/elfs/WebserviceElf";

function Booking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const [studyRooms, setStudyRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ドラッグ選択用
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState("select");
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  useEffect(() => {
    const fetchStudyRoomsOfThisStudent = async () => {
      const studyRooms = await doGet(`/api/studyRoom/ofStudent/${studentId}`);
      setStudyRooms(studyRooms);
      if (studyRooms.length > 0) {
        setSelectedRoomId(studyRooms[0].studyRoomId);
      }
    };

    fetchStudyRoomsOfThisStudent();
  }, [studentId]);

  useEffect(() => {
    const fetchWeeklyAvailability = async () => {
      setLoading(true);
      try {
        const data = await doGet(
          `/api/reservation/weekly/${studentId}?studyRoomId=${selectedRoomId}&offset=${weekOffset}`
        );
        setWeeklyData(data);
        //既存の予約をselectedSlotsに追加
        const bookedSlots = new Set();
        data.dailyAvailabilities.forEach((day) => {
          day.timeSlots.forEach((slot) => {
            if (slot.isBookedByThisStudentThisRoom) {
              const key = `${day.date}_${slot.startTime}`;
              bookedSlots.add(key);
            }
          });
        });
        setSelectedSlots(bookedSlots);
      } catch (error) {
        console.error("週間データの取得に失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedRoomId !== null) {
      fetchWeeklyAvailability();
    }
  }, [selectedRoomId, weekOffset, studentId]);

  const handleRoomChange = (e) => {
    setSelectedRoomId(parseInt(e.target.value));
    setSelectedSlots(new Set());
  };

  const handlePrevWeek = () => {
    setWeekOffset(weekOffset - 1);
    setSelectedSlots(new Set());
  };

  const handleNextWeek = () => {
    setWeekOffset(weekOffset + 1);
    setSelectedSlots(new Set());
  };

  const getSlotKey = (date, startTime) => {
    return `${date}_${startTime}`;
  };

  const isSlotSelectable = (day, slot) => {
    if (!slot) return false;

    if (slot.isBookedByThisStudentOtherRoom) return false;

    if (slot.isBookedByThisStudentThisRoom) return true;

    return day.isBookable && slot.isOpen && slot.availableSeats > 0;
  };

  const handleMouseDown = (day, slot) => {
    if (!slot || !isSlotSelectable(day, slot)) return;

    setIsDragging(true);
    const key = getSlotKey(day.date, slot.startTime);
    const isCurrentlySelected = selectedSlots.has(key);
    setDragMode(isCurrentlySelected ? "deselect" : "select");
    toggleSlot(key, !isCurrentlySelected);
  };

  const handleMouseEnter = (day, slot) => {
    if (!slot || !isDragging || !isSlotSelectable(day, slot)) return;

    const key = getSlotKey(day.date, slot.startTime);
    toggleSlot(key, dragMode === "select");
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // タッチイベント用のハンドラ
  const handleTouchStart = (e, day, slot) => {
    if (!slot || !isSlotSelectable(day, slot)) return;

    e.preventDefault();
    setIsDragging(true);
    const key = getSlotKey(day.date, slot.startTime);
    const isCurrentlySelected = selectedSlots.has(key);
    setDragMode(isCurrentlySelected ? "deselect" : "select");
    toggleSlot(key, !isCurrentlySelected);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const cellData = element.closest("[data-slot]");
    if (!cellData) return;

    const [date, startTime] = cellData.dataset.slot.split("_");
    const day = weeklyData.dailyAvailabilities.find((d) => d.date === date);
    const slot = day?.timeSlots.find((s) => s.startTime === startTime);

    if (day && slot && isSlotSelectable(day, slot)) {
      const key = getSlotKey(date, startTime);
      toggleSlot(key, dragMode === "select");
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const toggleSlot = (key, shouldSelect) => {
    setSelectedSlots((prev) => {
      const newSet = new Set(prev);
      if (shouldSelect) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  };

  const getSlotColor = (day, slot) => {
    if (!slot) return "#e9ecef";

    const key = getSlotKey(day.date, slot.startTime);

    // 別の部屋で予約済み（選択不可・オレンジ系）
    if (slot.isBookedByThisStudentOtherRoom) {
      return "#ffe0b2"; // オレンジ系
    }

    // この部屋で予約済み＋選択中
    if (slot.isBookedByThisStudentThisRoom && selectedSlots.has(key)) {
      return "#c3e6cb"; // 薄い緑
    }

    // 選択中
    if (selectedSlots.has(key)) {
      return "#007bff"; // 青
    }

    // 予約不可（過去・閉室・満席）
    if (!day.isBookable || !slot.isOpen) {
      return "#e9ecef"; // グレー
    }

    if (slot.availableSeats === 0) {
      return "#f8d7da"; // 赤系
    }

    // 予約可能
    return "white";
  };

  const handleReservation = async () => {
    // selectedSlotsから予約データを構築（既存予約も含む全て）
    const reservations = [];
    selectedSlots.forEach((key) => {
      const [date, startTime] = key.split("_");
      reservations.push({
        date: date,
        startTime: startTime,
      });
    });

    // 連続した時間帯をまとめる
    const grouped = groupConsecutiveSlots(reservations);

    // 確認メッセージを表示
    const confirmMessage =
      selectedSlots.size === 0
        ? "この週の予約を全て削除しますか？"
        : "予約しますか？";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const updatedWeeklyData = await doPost(
        `/api/reservation/create/${studentId}`,
        {
          studyRoomId: selectedRoomId,
          reservations: grouped,
          offset: weekOffset,
        }
      );
      alert("予約が完了しました！");
      setWeeklyData(updatedWeeklyData);

      // 予約後、選択状態を更新
      const bookedSlots = new Set();
      updatedWeeklyData.dailyAvailabilities.forEach((day) => {
        day.timeSlots.forEach((slot) => {
          if (slot.isBookedByThisStudentThisRoom) {
            const key = `${day.date}_${slot.startTime}`;
            bookedSlots.add(key);
          }
        });
      });
      setSelectedSlots(bookedSlots);
    } catch (error) {
      console.error("予約の作成に失敗:", error);

      // エラーレスポンスから詳細なメッセージを取得
      const errorMessage =
        error.response?.data?.message || "予約の作成に失敗しました";
      const errorCode = error.response?.data?.error;

      // エラーコードに応じたメッセージ表示
      switch (errorCode) {
        case "NO_AVAILABLE_SEATS":
          alert("選択した時間帯に空き席がありません");
          break;
        case "STUDY_ROOM_NOT_FOUND":
          alert("指定された学習室が見つかりません");
          break;
        case "VALIDATION_ERROR":
          alert(`入力内容に誤りがあります: ${errorMessage}`);
          break;
        default:
          alert(errorMessage);
      }

      // エラー時は週間データを再取得
      fetchWeeklyAvailability();
    }
  };

  const groupConsecutiveSlots = (reservations) => {
    // 日付ごとにグループ化
    const byDate = {};
    reservations.forEach((res) => {
      if (!byDate[res.date]) {
        byDate[res.date] = [];
      }
      byDate[res.date].push(res.startTime);
    });

    // 各日付で連続した時間帯をまとめる
    const result = [];
    Object.entries(byDate).forEach(([date, times]) => {
      times.sort();

      let startTime = times[0];
      let currentTime = times[0];

      for (let i = 1; i < times.length; i++) {
        const [prevHour, prevMin] = currentTime.split(":").map(Number);
        const [currHour, currMin] = times[i].split(":").map(Number);

        const prevMinutes = prevHour * 60 + prevMin + 15;
        const currMinutes = currHour * 60 + currMin;

        if (prevMinutes === currMinutes) {
          // 連続している
          currentTime = times[i];
        } else {
          // 連続していない → 1つの予約として追加
          const [endHour, endMin] = currentTime.split(":").map(Number);
          const endMinutes = endHour * 60 + endMin + 15;
          const endTime = `${Math.floor(endMinutes / 60)
            .toString()
            .padStart(2, "0")}:${(endMinutes % 60)
            .toString()
            .padStart(2, "0")}`;

          result.push({
            date: date,
            startHour: startTime,
            endHour: endTime,
          });

          startTime = times[i];
          currentTime = times[i];
        }
      }

      // 最後の予約を追加
      const [endHour, endMin] = currentTime.split(":").map(Number);
      const endMinutes = endHour * 60 + endMin + 15;
      const endTime = `${Math.floor(endMinutes / 60)
        .toString()
        .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

      result.push({
        date: date,
        startHour: startTime,
        endHour: `${endTime}:00`,
      });
    });

    return result;
  };

  const getDayLabel = (dayOfWeek) => {
    const labels = {
      monday: "月",
      tuesday: "火",
      wednesday: "水",
      thursday: "木",
      friday: "金",
      saturday: "土",
      sunday: "日",
    };
    return labels[dayOfWeek] || dayOfWeek;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading && !weeklyData) {
    return <div className="p-4 text-center">読み込み中...</div>;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 pb-20"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <div className="max-w-full">
        {/* ヘッダー - スマホ最適化 */}
        <div
          className="bg-white shadow-md p-3 mb-3 sticky top-0 z-20"
          id="main-header"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 p-2 -ml-2"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">予約作成</h1>
            <div style={{ width: "40px" }}></div>
          </div>

          {/* 自習室選択 - コンパクト */}
          <select
            value={selectedRoomId || ""}
            onChange={handleRoomChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3"
          >
            {studyRooms.map((room) => (
              <option key={room.studyRoomId} value={room.studyRoomId}>
                {room.name}
              </option>
            ))}
          </select>

          {/* 週選択 - コンパクト */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrevWeek}
              disabled={weekOffset === 0}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg text-sm flex-shrink-0"
            >
              ← 前週
            </button>
            <div className="text-sm font-semibold text-center">
              {weeklyData && formatDate(weeklyData.weekStartDate)} の週
            </div>
            <button
              onClick={handleNextWeek}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm flex-shrink-0"
            >
              次週 →
            </button>
          </div>
        </div>

        {/* 凡例 - コンパクト */}
        <div className="bg-white shadow-md p-3 mx-2 mb-3 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded flex-shrink-0"></div>
              <span>選択中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-200 border border-green-400 rounded flex-shrink-0"></div>
              <span>この部屋で予約済</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-200 border border-orange-400 rounded flex-shrink-0"></div>
              <span>別の部屋で予約済</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded flex-shrink-0"></div>
              <span>予約可能</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-100 rounded flex-shrink-0"></div>
              <span>満席</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0"></div>
              <span>予約不可</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            📌 スライドで連続選択できます
            <br />
            💡 左の青い列で上下スクロール
          </p>
        </div>

        {/* スケジュール表 - スマホ最適化 */}
        {weeklyData && (
          <div className="bg-white shadow-md mx-2 mb-3 rounded-lg overflow-hidden">
            <div
              className="overflow-x-auto"
              style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}
            >
              <table
                className="w-full border-collapse"
                style={{
                  userSelect: "none",
                  minWidth: "100%",
                  tableLayout: "fixed",
                }}
              >
                <thead className="sticky top-0 z-10 bg-white">
                  <tr>
                    <th className="border border-gray-300 bg-blue-50 p-1 text-xs w-12 sticky left-0 z-20 relative">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="w-3 h-3 text-blue-600 mb-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                        <span
                          className="text-blue-600 font-semibold"
                          style={{ fontSize: "9px" }}
                        >
                          スクロール
                        </span>
                      </div>
                    </th>
                    {weeklyData.dailyAvailabilities.map((day) => (
                      <th
                        key={day.date}
                        className="border border-gray-300 bg-gray-100 p-1 text-xs"
                        style={{
                          backgroundColor:
                            getDayLabel(day.dayOfWeek) === "土"
                              ? "#e3f2fd"
                              : getDayLabel(day.dayOfWeek) === "日"
                              ? "#ffe0e0"
                              : "#f8f9fa",
                          width: `${100 / 7}%`,
                        }}
                      >
                        <div className="font-bold">
                          {getDayLabel(day.dayOfWeek)}
                        </div>
                        <div className="text-[10px] font-normal">
                          {formatDate(day.date)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.dailyAvailabilities.length > 0 &&
                    weeklyData.dailyAvailabilities[0].timeSlots.map(
                      (_, index) => {
                        const slot =
                          weeklyData.dailyAvailabilities[0].timeSlots[index];
                        if (!slot) return null;

                        const [hour, minute] = slot.startTime
                          .split(":")
                          .map(Number);
                        const isHourStart = minute === 0;

                        return (
                          <tr
                            key={index}
                            style={{
                              borderTop: isHourStart
                                ? "3px solid #28a745"
                                : "none",
                            }}
                          >
                            {/* 00分の時だけ時間を表示して4行分を結合 */}
                            {isHourStart && (
                              <td
                                rowSpan={4}
                                className="border border-gray-300 bg-blue-50 text-center text-[10px] font-semibold align-middle sticky left-0 z-10"
                                style={{ top: "auto" }}
                              >
                                {hour.toString().padStart(2, "0")}:00
                              </td>
                            )}

                            {weeklyData.dailyAvailabilities.map((day) => {
                              const slot = day.timeSlots[index];
                              if (!slot) {
                                return (
                                  <td
                                    key={day.date}
                                    className="p-0"
                                    style={{
                                      backgroundColor: "#e9ecef",
                                      height: "24px",
                                      border: "1px solid #dee2e6",
                                    }}
                                  />
                                );
                              }

                              const key = getSlotKey(day.date, slot.startTime);
                              const selectable = isSlotSelectable(day, slot);

                              return (
                                <td
                                  key={day.date}
                                  className="p-0"
                                  data-slot={key}
                                  onMouseDown={() => handleMouseDown(day, slot)}
                                  onMouseEnter={() =>
                                    handleMouseEnter(day, slot)
                                  }
                                  onTouchStart={(e) =>
                                    handleTouchStart(e, day, slot)
                                  }
                                  style={{
                                    backgroundColor: getSlotColor(day, slot),
                                    cursor: selectable
                                      ? "pointer"
                                      : "not-allowed",
                                    height: "24px",
                                    touchAction: "none",
                                    border: "1px solid #dee2e6",
                                  }}
                                >
                                  <div className="flex items-center justify-center h-full text-[10px]">
                                    {slot.isOpen && (
                                      <span
                                        className={
                                          selectedSlots.has(key) ||
                                          slot.isBookedByThisStudent
                                            ? "font-semibold"
                                            : slot.availableSeats === 0
                                            ? "text-red-600"
                                            : "text-gray-600"
                                        }
                                      >
                                        {slot.availableSeats}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 予約ボタン - 固定フッター */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-3 flex gap-2">
          <button
            onClick={() => setSelectedSlots(new Set())}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-sm"
          >
            クリア
          </button>
          <button
            onClick={handleReservation}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm"
          >
            {selectedSlots.size === 0
              ? "予約全削除"
              : `予約 (${selectedSlots.size}枠)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentBooking() {
  return (
    <Suspense fallback={<div className="p-6">読み込み中</div>}>
      <Booking></Booking>
    </Suspense>
  );
}
