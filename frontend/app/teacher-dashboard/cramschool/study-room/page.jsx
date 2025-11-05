"use client";
import {
  GET_STUDY_ROOM_REGULAR_SCHEDULE_URL,
  SAVE_STUDY_ROOM_REGULAR_SCHEDULES_URL,
  GET_STUDY_ROOM_SCHEDULE_EXCEPTIONS_URL,
  SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL,
  DELETE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL,
} from "@/app/constants/urls";
import { doGet, doPost, doDelete } from "@/app/elfs/WebserviceElf";
import { useSearchParams, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function StudyRoomDetailPage({ params }) {
  const { studyRoomId } = use(params);
  const searchParams = useSearchParams();
  const studyRoomName = searchParams.get("name") || "";
  const router = useRouter();

  // Regular schedule state
  const [weekSchedule, setWeekSchedule] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState("open");

  // Exception schedule state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [exceptions, setExceptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionType, setExceptionType] = useState("closed");
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionSlots, setExceptionSlots] = useState([]);
  const [isExceptionDragging, setIsExceptionDragging] = useState(false);
  const [exceptionDragMode, setExceptionDragMode] = useState("open");

  const daysOfWeek = [
    { day: "MONDAY", label: "月曜日" },
    { day: "TUESDAY", label: "火曜日" },
    { day: "WEDNESDAY", label: "水曜日" },
    { day: "THURSDAY", label: "木曜日" },
    { day: "FRIDAY", label: "金曜日" },
    { day: "SATURDAY", label: "土曜日" },
    { day: "SUNDAY", label: "日曜日" },
  ];

  // Initialize regular schedule
  useEffect(() => {
    const initialSchedule = daysOfWeek.map((d) => ({
      dayOfWeek: d.day,
      dayLabel: d.label,
      slots: Array.from({ length: 17 * 4 }, (_, i) => {
        const hour = Math.floor(i / 4) + 7;
        const minute = (i % 4) * 15;
        return { hour, minute, isOpen: false };
      }),
    }));
    setWeekSchedule(initialSchedule);
    fetchRegularSchedule();
  }, [studyRoomId]);

  // Fetch exceptions when month changes
  useEffect(() => {
    fetchExceptions();
  }, [currentMonth, studyRoomId]);

  const fetchRegularSchedule = async () => {
    try {
      const response = await doGet(
        `${GET_STUDY_ROOM_REGULAR_SCHEDULE_URL}?study_room_id=${studyRoomId}`
      );
      if (response && Array.isArray(response)) {
        const schedules = response;
        setWeekSchedule((prev) =>
          prev.map((day) => {
            const daySchedules = schedules.filter(
              (s) => s.day_of_week === day.dayOfWeek
            );
            if (daySchedules.length === 0) return day;

            return {
              ...day,
              slots: day.slots.map((slot) => {
                const timeStr = `${slot.hour
                  .toString()
                  .padStart(2, "0")}:${slot.minute
                  .toString()
                  .padStart(2, "0")}:00`;
                const isOpen = daySchedules.some(
                  (s) => timeStr >= s.open_time && timeStr < s.close_time
                );
                return { ...slot, isOpen };
              }),
            };
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    }
  };

  const fetchExceptions = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await doGet(
        `${GET_STUDY_ROOM_SCHEDULE_EXCEPTIONS_URL}?study_room_id=${studyRoomId}&year=${year}&month=${month}`
      );
      if (response && Array.isArray(response)) {
        setExceptions(response);
      }
    } catch (error) {
      console.error("Failed to fetch exceptions:", error);
    }
  };

  const handleMouseDown = (dayIndex, slotIndex) => {
    setIsDragging(true);
    const currentSlot = weekSchedule[dayIndex].slots[slotIndex];
    setDragMode(currentSlot.isOpen ? "close" : "open");
    toggleSlot(dayIndex, slotIndex, !currentSlot.isOpen);
  };

  const handleMouseEnter = (dayIndex, slotIndex) => {
    if (!isDragging) return;
    toggleSlot(dayIndex, slotIndex, dragMode === "open");
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleSlot = (dayIndex, slotIndex, isOpen) => {
    setWeekSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        slots: newSchedule[dayIndex].slots.map((slot, i) =>
          i === slotIndex ? { ...slot, isOpen } : slot
        ),
      };
      return newSchedule;
    });
  };

  const handleSaveRegularSchedule = async () => {
    const schedules = [];

    weekSchedule.forEach((day) => {
      let openTime = null;
      let closeTime = null;

      day.slots.forEach((slot, index) => {
        const timeStr = `${slot.hour.toString().padStart(2, "0")}:${slot.minute
          .toString()
          .padStart(2, "0")}:00`;

        if (slot.isOpen && openTime === null) {
          openTime = timeStr;
        } else if (!slot.isOpen && openTime !== null) {
          closeTime = timeStr;
          schedules.push({
            study_room_id: parseInt(studyRoomId),
            day_of_week: day.dayOfWeek,
            open_time: openTime,
            close_time: closeTime,
          });
          openTime = null;
          closeTime = null;
        }

        if (index === day.slots.length - 1 && openTime !== null) {
          closeTime = "23:59:59";
          schedules.push({
            study_room_id: parseInt(studyRoomId),
            day_of_week: day.dayOfWeek,
            open_time: openTime,
            close_time: closeTime,
          });
        }
      });
    });

    try {
      await doPost(SAVE_STUDY_ROOM_REGULAR_SCHEDULES_URL, { schedules });
      alert("スケジュールを保存しました");
      fetchRegularSchedule();
    } catch (error) {
      console.error("Failed to save schedule:", error);
      alert("保存に失敗しました");
    }
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getExceptionForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return exceptions.filter((e) => e.date === dateStr);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dateExceptions = getExceptionForDate(date);

    if (dateExceptions.length > 0 && !dateExceptions[0].is_open) {
      setExceptionType("closed");
      setExceptionReason(dateExceptions[0].reason);
    } else if (dateExceptions.length > 0) {
      setExceptionType("custom");
      setExceptionReason(dateExceptions[0].reason);
      initializeExceptionSlots(dateExceptions);
    } else {
      setExceptionType("closed");
      setExceptionReason("");
      initializeExceptionSlots([]);
    }

    setShowExceptionModal(true);
  };

  const initializeExceptionSlots = (dateExceptions) => {
    const slots = Array.from({ length: 17 * 4 }, (_, i) => {
      const hour = Math.floor(i / 4) + 7;
      const minute = (i % 4) * 15;
      return { hour, minute, isOpen: false };
    });

    dateExceptions.forEach((exc) => {
      if (exc.is_open && exc.open_time && exc.close_time) {
        slots.forEach((slot) => {
          const timeStr = `${slot.hour
            .toString()
            .padStart(2, "0")}:${slot.minute.toString().padStart(2, "0")}:00`;
          if (timeStr >= exc.open_time && timeStr < exc.close_time) {
            slot.isOpen = true;
          }
        });
      }
    });

    setExceptionSlots(slots);
  };

  const handleExceptionMouseDown = (slotIndex) => {
    setIsExceptionDragging(true);
    const currentSlot = exceptionSlots[slotIndex];
    setExceptionDragMode(currentSlot.isOpen ? "close" : "open");
    toggleExceptionSlot(slotIndex, !currentSlot.isOpen);
  };

  const handleExceptionMouseEnter = (slotIndex) => {
    if (!isExceptionDragging) return;
    toggleExceptionSlot(slotIndex, exceptionDragMode === "open");
  };

  const handleExceptionMouseUp = () => {
    setIsExceptionDragging(false);
  };

  const toggleExceptionSlot = (slotIndex, isOpen) => {
    setExceptionSlots((prev) =>
      prev.map((slot, i) => (i === slotIndex ? { ...slot, isOpen } : slot))
    );
  };

  const handleSaveException = async () => {
    if (!selectedDate) return;

    const dateStr = selectedDate.toISOString().split("T")[0];

    if (exceptionType === "closed") {
      try {
        await doPost(SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL, {
          study_room_id: parseInt(studyRoomId),
          date: dateStr,
          is_open: false,
          reason: exceptionReason,
        });
        alert("例外スケジュールを保存しました");
        setShowExceptionModal(false);
        fetchExceptions();
      } catch (error) {
        console.error("Failed to save exception:", error);
        alert("保存に失敗しました");
      }
    } else {
      const schedules = [];

      let openTime = null;

      exceptionSlots.forEach((slot, index) => {
        const timeStr = `${slot.hour.toString().padStart(2, "0")}:${slot.minute
          .toString()
          .padStart(2, "0")}:00`;

        if (slot.isOpen && openTime === null) {
          openTime = timeStr;
        } else if (!slot.isOpen && openTime !== null) {
          schedules.push({
            study_room_id: parseInt(studyRoomId),
            date: dateStr,
            is_open: true,
            open_time: openTime,
            close_time: timeStr,
            reason: exceptionReason,
          });
          openTime = null;
        }

        if (index === exceptionSlots.length - 1 && openTime !== null) {
          schedules.push({
            study_room_id: parseInt(studyRoomId),
            date: dateStr,
            is_open: true,
            open_time: openTime,
            close_time: "23:59:59",
            reason: exceptionReason,
          });
        }
      });

      try {
        for (const schedule of schedules) {
          await doPost(SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL, schedule);
        }
        alert("例外スケジュールを保存しました");
        setShowExceptionModal(false);
        fetchExceptions();
      } catch (error) {
        console.error("Failed to save exception:", error);
        alert("保存に失敗しました");
      }
    }
  };

  const handleDeleteException = async () => {
    if (!selectedDate) return;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const dateExceptions = getExceptionForDate(selectedDate);

    try {
      for (const exc of dateExceptions) {
        await doDelete(
          `${DELETE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL}?id=${exc.study_room_schedule_exception_id}`
        );
      }
      alert("例外スケジュールを削除しました");
      setShowExceptionModal(false);
      fetchExceptions();
    } catch (error) {
      console.error("Failed to delete exception:", error);
      alert("削除に失敗しました");
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const dateExceptions = getExceptionForDate(date);

      let bgColor = "bg-white hover:bg-gray-100";
      if (dateExceptions.length > 0) {
        if (!dateExceptions[0].is_open) {
          bgColor = "bg-red-200 hover:bg-red-300";
        } else {
          bgColor = "bg-yellow-200 hover:bg-yellow-300";
        }
      }

      days.push(
        <div
          key={day}
          className={`p-2 border cursor-pointer text-center ${bgColor}`}
          onClick={() => handleDateClick(date)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="container mt-4" onMouseUp={handleMouseUp}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{studyRoomName} - スケジュール管理</h2>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          戻る
        </button>
      </div>

      <div className="row">
        {/* Left column: Regular Schedule */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h4>通常スケジュール</h4>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <small>📌 ドラッグして開室時間を設定してください</small>
              </div>
              <div
                className="table-responsive"
                style={{ maxHeight: "600px", overflowY: "auto" }}
              >
                <table
                  className="table table-bordered text-center"
                  style={{ userSelect: "none" }}
                >
                  <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ backgroundColor: "#f8f9fa" }}>時間</th>
                      {daysOfWeek.map((d) => (
                        <th
                          key={d.day}
                          style={{
                            backgroundColor: "#f8f9fa",
                            writingMode: "vertical-rl",
                            textOrientation: "upright",
                          }}
                        >
                          {d.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 17 }, (_, index) => {
                      const hour = index + 7;
                      return (
                        <tr key={hour}>
                          <td
                            className="align-middle fw-bold"
                            style={{ backgroundColor: "#f8f9fa" }}
                          >
                            {hour.toString().padStart(2, "0")}:00
                          </td>
                          {weekSchedule.map((day, dayIndex) => (
                            <td key={day.dayOfWeek} style={{ padding: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                {[0, 15, 30, 45].map((minute) => {
                                  const slotIndex = hour * 4 + minute / 15;
                                  const slot = day.slots[slotIndex];
                                  const isHourStart = minute === 0;
                                  return (
                                    <div
                                      key={`${hour}-${minute}`}
                                      onMouseDown={() =>
                                        handleMouseDown(dayIndex, slotIndex)
                                      }
                                      onMouseEnter={() =>
                                        handleMouseEnter(dayIndex, slotIndex)
                                      }
                                      style={{
                                        height: "10px",
                                        backgroundColor: slot?.isOpen
                                          ? "#d4edda"
                                          : "white",
                                        borderTop: isHourStart
                                          ? "1px solid #dee2e6"
                                          : "1px dashed #e0e0e0",
                                        cursor: "pointer",
                                        transition: "background-color 0.1s",
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                className="btn btn-primary w-100 mt-3"
                onClick={handleSaveRegularSchedule}
              >
                保存
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Exception Schedule Calendar */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1
                    )
                  )
                }
              >
                ← 前月
              </button>
              <h4>
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </h4>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1
                    )
                  )
                }
              >
                次月 →
              </button>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <small>
                  📅 日付をクリックして例外スケジュールを設定
                  <br />
                  🟨 黄色: 特別営業 / 🟥 赤: 休室
                </small>
              </div>
              <div
                className="grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "2px",
                }}
              >
                {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                  <div
                    key={day}
                    className="text-center fw-bold p-2"
                    style={{ backgroundColor: "#f8f9fa" }}
                  >
                    {day}
                  </div>
                ))}
                {renderCalendar()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exception Modal */}
      {showExceptionModal && selectedDate && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onMouseUp={handleExceptionMouseUp}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedDate.toLocaleDateString("ja-JP")} の例外設定
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowExceptionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">例外タイプ</label>
                  <select
                    className="form-select"
                    value={exceptionType}
                    onChange={(e) => setExceptionType(e.target.value)}
                  >
                    <option value="closed">完全休室</option>
                    <option value="custom">特別営業時間</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">理由</label>
                  <input
                    type="text"
                    className="form-control"
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    placeholder="例: 年末年始休業、特別イベント開催"
                  />
                </div>

                {exceptionType === "custom" && (
                  <>
                    <div className="alert alert-info">
                      <small>📌 ドラッグして開室時間を設定してください</small>
                    </div>
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      <table
                        className="table table-bordered text-center"
                        style={{ userSelect: "none" }}
                      >
                        <tbody>
                          {Array.from({ length: 17 }, (_, index) => {
                            const hour = index + 7;
                            return (
                              <tr key={hour}>
                                <td
                                  className="align-middle fw-bold"
                                  style={{
                                    backgroundColor: "#f8f9fa",
                                    width: "80px",
                                  }}
                                >
                                  {hour.toString().padStart(2, "0")}:00
                                </td>
                                <td style={{ padding: 0 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                    }}
                                  >
                                    {[0, 15, 30, 45].map((minute) => {
                                      const slotIndex = hour * 4 + minute / 15;
                                      const slot = exceptionSlots[slotIndex];
                                      const isHourStart = minute === 0;
                                      return (
                                        <div
                                          key={`${hour}-${minute}`}
                                          onMouseDown={() =>
                                            handleExceptionMouseDown(slotIndex)
                                          }
                                          onMouseEnter={() =>
                                            handleExceptionMouseEnter(slotIndex)
                                          }
                                          style={{
                                            height: "10px",
                                            backgroundColor: slot?.isOpen
                                              ? "#d4edda"
                                              : "white",
                                            borderTop: isHourStart
                                              ? "1px solid #dee2e6"
                                              : "1px dashed #e0e0e0",
                                            cursor: "pointer",
                                            transition: "background-color 0.1s",
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {getExceptionForDate(selectedDate).length > 0 && (
                  <button
                    type="button"
                    className="btn btn-danger me-auto"
                    onClick={handleDeleteException}
                  >
                    削除
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowExceptionModal(false)}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveException}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
