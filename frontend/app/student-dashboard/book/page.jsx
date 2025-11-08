"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doGet, doPost } from "@/app/elfs/WebserviceElf";

export default function Booking() {
  const router = useRouter();
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
      const studyRooms = await doGet("/api/studyRoom/ofStudent");
      setStudyRooms(studyRooms);
      if (studyRooms.length > 0) {
        setSelectedRoomId(studyRooms[0].studyRoomId);
      }
    };

    fetchStudyRoomsOfThisStudent();
  }, []);

  useEffect(() => {
    const fetchWeeklyAvailability = async () => {
      setLoading(true);
      try {
        const data = await doGet(
          `/api/reservation/weekly?studyRoomId=${selectedRoomId}&offset=${weekOffset}`
        );
        setWeeklyData(data);
        //既存の予約をselectedSlotsに追加
        const bookedSlots = new Set();
        data.dailyAvailabilities.forEach((day) => {
          day.timeSlots.forEach((slot) => {
            if (slot.isBookedByThisStudent) {
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
  }, [selectedRoomId, weekOffset]);

  const handleRoomChange = (e) => {
    setSelectedRoomId(parseInt(e.target.value));
    setWeekOffset(0);
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
    if (slot.isBookedByThisStudent) return true;
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
    // 既に予約済み（この生徒の予約）だが選択されていない場合
    if (slot.isBookedByThisStudent && selectedSlots.has(key)) {
      return "#c3e6cb"; // 薄い緑
    }

    // 選択中（既存予約より優先）
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
    if (selectedSlots.size === 0) {
      alert("予約する時間帯を選択してください");
      return;
    }

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
      "この週の既存予約を一度削除して、選択した内容で再保存します。よろしいですか？";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const updatedWeeklyData = await doPost("/api/reservation/create", {
        studyRoomId: selectedRoomId,
        reservations: grouped,
        offset: weekOffset,
      });
      alert("予約が完了しました！");
      setWeeklyData(updatedWeeklyData);

      // 予約後、選択状態を更新
      const bookedSlots = new Set();
      updatedWeeklyData.dailyAvailabilities.forEach((day) => {
        day.timeSlots.forEach((slot) => {
          if (slot.isBookedByThisStudent) {
            const key = `${day.date}_${slot.startTime}`;
            bookedSlots.add(key);
          }
        });
      });
      setSelectedSlots(bookedSlots);
    } catch (error) {
      console.error("予約の再作成に失敗:", error);

      // エラーレスポンスから詳細なメッセージを取得
      const errorMessage =
        error.response?.data?.message || "予約の再作成に失敗しました";
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
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" onMouseUp={handleMouseUp}>
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-800">予約作成</h1>
            <div style={{ width: "80px" }}></div>
          </div>

          {/* 自習室選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自習室を選択
            </label>
            <select
              value={selectedRoomId || ""}
              onChange={handleRoomChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {studyRooms.map((room) => (
                <option key={room.studyRoomId} value={room.studyRoomId}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* 週選択 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevWeek}
              disabled={weekOffset === 0}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition"
            >
              ← 前の週
            </button>
            <div className="text-lg font-semibold">
              {weeklyData && formatDate(weeklyData.weekStartDate)} の週
            </div>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              次の週 →
            </button>
          </div>
        </div>

        {/* 凡例 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
              <span>選択中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-200 border border-green-400 rounded"></div>
              <span>既存の予約</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
              <span>予約可能</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded"></div>
              <span>満席</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <span>予約不可</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            📌 ドラッグして予約したい時間帯を選択してください
          </p>
        </div>

        {/* スケジュール表 */}
        {weeklyData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse"
                style={{ userSelect: "none" }}
              >
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 p-2 w-20">
                      時間
                    </th>
                    {weeklyData.dailyAvailabilities.map((day) => (
                      <th
                        key={day.date}
                        className="border border-gray-300 bg-gray-100 p-2"
                        style={{
                          backgroundColor:
                            getDayLabel(day.dayOfWeek) === "土"
                              ? "#e3f2fd"
                              : getDayLabel(day.dayOfWeek) === "日"
                              ? "#ffe0e0"
                              : "#f8f9fa",
                        }}
                      >
                        <div>{getDayLabel(day.dayOfWeek)}</div>
                        <div className="text-xs font-normal">
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
                          <tr key={index}>
                            {/* 00分の時だけ時間を表示して4行分を結合 */}
                            {isHourStart && (
                              <td
                                rowSpan={4}
                                className="border border-gray-300 bg-gray-50 text-center font-semibold align-middle"
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
                                    className="border border-gray-300 p-0"
                                    style={{
                                      backgroundColor: "#e9ecef",
                                      height: "30px",
                                    }}
                                  />
                                );
                              }

                              const key = getSlotKey(day.date, slot.startTime);
                              const selectable = isSlotSelectable(day, slot);

                              return (
                                <td
                                  key={day.date}
                                  className="border border-gray-300 p-0"
                                  onMouseDown={() => handleMouseDown(day, slot)}
                                  onMouseEnter={() =>
                                    handleMouseEnter(day, slot)
                                  }
                                  style={{
                                    backgroundColor: getSlotColor(day, slot),
                                    cursor: selectable
                                      ? "pointer"
                                      : "not-allowed",
                                    height: "30px",
                                  }}
                                >
                                  <div className="flex items-center justify-center h-full text-xs">
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

            {/* 予約ボタン */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setSelectedSlots(new Set())}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              >
                選択をクリア
              </button>
              <button
                onClick={handleReservation}
                disabled={selectedSlots.size === 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                予約する ({selectedSlots.size}枠)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
