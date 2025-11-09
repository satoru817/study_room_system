"use client";
import { SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL } from "@/app/constants/urls";
import { doGet, doPost, doDelete } from "@/app/elfs/WebserviceElf";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";

function StudyRoomDetailContent() {
  const searchParams = useSearchParams();
  const studyRoomId = searchParams.get("studyRoomId");
  const studyRoomName = searchParams.get("name");
  const router = useRouter();

  // Regular schedule state
  const [weekSchedule, setWeekSchedule] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState("open");
  const [hasChanges, setHasChanges] = useState(false);

  // Exception schedule state
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [exceptions, setExceptions] = useState([]);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [exceptionType, setExceptionType] = useState("closed");
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionSlots, setExceptionSlots] = useState([]);
  const [isDraggingException, setIsDraggingException] = useState(false);
  const [dragModeException, setDragModeException] = useState("open");

  // Copy functionality state
  const [studyRooms, setStudyRooms] = useState([]);
  const [showCopyRegularModal, setShowCopyRegularModal] = useState(false);
  const [showCopyExceptionModal, setShowCopyExceptionModal] = useState(false);
  const [selectedStudyRoomIds, setSelectedStudyRoomIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const DAYS = [
    { key: "monday", label: "月" },
    { key: "tuesday", label: "火" },
    { key: "wednesday", label: "水" },
    { key: "thursday", label: "木" },
    { key: "friday", label: "金" },
    { key: "saturday", label: "土" },
    { key: "sunday", label: "日" },
  ];

  const fetchStudyRoomRegularSchedules = async () => {
    try {
      const url = `/api/studyRoom/regularSchedule/get?studyRoomId=${encodeURIComponent(
        studyRoomId
      )}`;
      const _regularSchedules = await doGet(url);
      buildWeekSchedule(_regularSchedules);
    } catch (error) {
      console.error("自習室の通常スケジュールの取得に失敗", error);
    }
  };

  const fetchExceptions = async (year, month) => {
    try {
      const url = `/api/studyRoom/scheduleException/get?studyRoomId=${encodeURIComponent(
        studyRoomId
      )}&year=${year}&month=${month}`;
      const _exceptions = await doGet(url);
      setExceptions(_exceptions);
    } catch (error) {
      console.error("例外スケジュールの取得に失敗", error);
    }
  };

  const fetchStudyRooms = async () => {
    try {
      const url = `/api/studyRoom/get/thisTeachers`;
      const _studyRooms = await doGet(url);
      setStudyRooms(_studyRooms);
    } catch (error) {
      console.error("自習室リストの取得に失敗", error);
    }
  };

  const buildWeekSchedule = (schedules) => {
    const weekData = DAYS.map((day) => {
      const daySchedules = schedules.filter(
        (s) => s.dayOfWeek.toLowerCase() === day.key
      );

      const slots = [];
      // 7:00から23:30まで = 66スロット
      // 7:00-7:15, 7:15-7:30, ..., 23:15-23:30, 23:30-23:45
      for (let hour = 7; hour <= 23; hour++) {
        for (const minute of [0, 15, 30, 45]) {
          // 23:45以降は作らない
          if (hour === 23 && minute === 45) break;

          const currentMinutes = hour * 60 + minute;
          const isOpen = daySchedules.some((schedule) => {
            const [openHour, openMin] = schedule.openTime
              .split(":")
              .map(Number);
            const [closeHour, closeMin] = schedule.closeTime
              .split(":")
              .map(Number);
            const openMinutes = openHour * 60 + openMin;
            const closeMinutes = closeHour * 60 + closeMin;
            return (
              currentMinutes >= openMinutes && currentMinutes < closeMinutes
            );
          });
          slots.push({ hour, minute, isOpen });
        }
      }

      return {
        dayOfWeek: day.key,
        dayLabel: day.label,
        slots,
        schedules: daySchedules, // 元のスケジュール情報を保持
      };
    });

    setWeekSchedule(weekData);
    setHasChanges(false);
  };

  useEffect(() => {
    fetchStudyRoomRegularSchedules();
    fetchStudyRooms();
  }, [studyRoomId]);

  useEffect(() => {
    fetchExceptions(currentYear, currentMonth);
  }, [studyRoomId, currentYear, currentMonth]);

  // Regular schedule functions
  const handleMouseDown = (dayIndex, slotIndex) => {
    setIsDragging(true);
    const currentSlot = weekSchedule[dayIndex].slots[slotIndex];
    setDragMode(currentSlot.isOpen ? "close" : "open");
    toggleSlot(dayIndex, slotIndex, !currentSlot.isOpen);
  };

  const handleMouseEnter = (dayIndex, slotIndex) => {
    if (isDragging) {
      toggleSlot(dayIndex, slotIndex, dragMode === "open");
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleSlot = (dayIndex, slotIndex, isOpen) => {
    setWeekSchedule((prev) => {
      const newSchedule = [...prev];
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        slots: newSchedule[dayIndex].slots.map((slot, idx) =>
          idx === slotIndex ? { ...slot, isOpen } : slot
        ),
      };
      return newSchedule;
    });
    setHasChanges(true);
  };

  const convertScheduleToRanges = () => {
    const schedules = [];

    weekSchedule.forEach((day) => {
      let rangeStart = null;
      day.slots.forEach((slot, index) => {
        const slotMinutes = slot.hour * 60 + slot.minute;
        if (slot.isOpen && rangeStart === null) {
          rangeStart = slotMinutes;
        } else if (!slot.isOpen && rangeStart !== null) {
          schedules.push({
            dayOfWeek: day.dayOfWeek,
            openTime: minutesToTime(rangeStart),
            closeTime: minutesToTime(slotMinutes),
          });
          rangeStart = null;
        }
        // 最後のスロット(23:30)で開いている場合は23:45で閉じる
        if (
          index === day.slots.length - 1 &&
          slot.isOpen &&
          rangeStart !== null
        ) {
          schedules.push({
            dayOfWeek: day.dayOfWeek,
            openTime: minutesToTime(rangeStart),
            closeTime: "23:45",
          });
        }
      });
    });

    return schedules;
  };

  const minutesToTime = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    return `${hour.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSaveSchedules = async () => {
    try {
      const schedules = convertScheduleToRanges();
      const _updatedSchedules = await doPost(
        "/api/studyRoom/regularSchedule/save",
        {
          studyRoomId: studyRoomId,
          regularSchedules: schedules,
        }
      );
      setHasChanges(false);
      alert("スケジュールを保存しました");
      buildWeekSchedule(_updatedSchedules);
    } catch (error) {
      console.error("スケジュールの保存に失敗:", error);
      alert("スケジュールの保存に失敗しました");
    }
  };

  const handleReset = () => {
    if (confirm("変更を破棄して、元に戻しますか？")) {
      fetchStudyRoomRegularSchedules();
    }
  };

  // Copy functions
  const getAvailableStudyRooms = () => {
    return studyRooms.filter(
      (room) => room.studyRoomId.toString() !== studyRoomId
    );
  };

  const handleOpenCopyRegularModal = () => {
    setSelectedStudyRoomIds([]);
    setSelectAll(false);
    setShowCopyRegularModal(true);
  };

  const handleOpenCopyExceptionModal = () => {
    setSelectedStudyRoomIds([]);
    setSelectAll(false);
    setShowCopyExceptionModal(true);
  };

  const handleToggleStudyRoom = (studyRoomId) => {
    setSelectedStudyRoomIds((prev) => {
      if (prev.includes(studyRoomId)) {
        return prev.filter((id) => id !== studyRoomId);
      } else {
        return [...prev, studyRoomId];
      }
    });
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudyRoomIds([]);
    } else {
      const availableRooms = getAvailableStudyRooms();
      setSelectedStudyRoomIds(
        availableRooms.map((room) => room.studyRoomId.toString())
      );
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    const availableRooms = getAvailableStudyRooms();
    if (
      availableRooms.length > 0 &&
      selectedStudyRoomIds.length === availableRooms.length
    ) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudyRoomIds]);

  const handleCopyRegularSchedule = async () => {
    if (selectedStudyRoomIds.length === 0) {
      alert("コピー先の自習室を選択してください");
      return;
    }

    const selectedRooms = studyRooms.filter((room) =>
      selectedStudyRoomIds.includes(room.studyRoomId.toString())
    );
    const roomNames = selectedRooms
      .map((room) => `${room.cramSchoolName} - ${room.studyRoomName}`)
      .join("\n");

    if (
      !confirm(
        `以下の${selectedStudyRoomIds.length}件の自習室に通常スケジュールをコピーしますか？\n\n${roomNames}`
      )
    ) {
      return;
    }

    try {
      await doPost("/api/studyRoom/regularSchedule/copy", {
        fromStudyRoomId: studyRoomId,
        toStudyRoomIds: selectedStudyRoomIds,
      });
      setShowCopyRegularModal(false);
      alert("通常スケジュールをコピーしました");
    } catch (error) {
      console.error("通常スケジュールのコピーに失敗:", error);
      alert("通常スケジュールのコピーに失敗しました");
    }
  };

  const handleCopyExceptionSchedule = async () => {
    if (selectedStudyRoomIds.length === 0) {
      alert("コピー先の自習室を選択してください");
      return;
    }

    const selectedRooms = studyRooms.filter((room) =>
      selectedStudyRoomIds.includes(room.studyRoomId.toString())
    );
    const roomNames = selectedRooms
      .map((room) => `${room.cramSchoolName} - ${room.studyRoomName}`)
      .join("\n");

    if (
      !confirm(
        `以下の${selectedStudyRoomIds.length}件の自習室に${currentYear}年${currentMonth}月の例外スケジュールをコピーしますか？\n\n${roomNames}`
      )
    ) {
      return;
    }

    try {
      await doPost("/api/studyRoom/scheduleException/copy", {
        fromStudyRoomId: studyRoomId,
        toStudyRoomIds: selectedStudyRoomIds,
        year: currentYear,
        month: currentMonth,
      });
      setShowCopyExceptionModal(false);
      alert("例外スケジュールをコピーしました");
    } catch (error) {
      console.error("例外スケジュールのコピーに失敗:", error);
      alert("例外スケジュールのコピーに失敗しました");
    }
  };

  // Calendar functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day) => {
    const dateStr = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    setSelectedDate(dateStr);

    // その日の例外スケジュールを取得
    const dayExceptions = exceptions.filter((e) => e.date === dateStr);

    if (dayExceptions.length > 0 && !dayExceptions[0].isOpen) {
      // 閉鎖日
      setExceptionType("closed");
      setExceptionReason(dayExceptions[0].reason || "");
    } else if (dayExceptions.length > 0) {
      // カスタムスケジュール
      setExceptionType("custom");
      setExceptionReason(dayExceptions[0].reason || "");
      buildExceptionSlots(dayExceptions);
    } else {
      // 新規作成
      setExceptionType("closed");
      setExceptionReason("");
      initializeExceptionSlots();
    }

    setShowExceptionModal(true);
  };

  const initializeExceptionSlots = () => {
    const slots = [];
    // 7:00から23:30まで = 66スロット
    for (let hour = 7; hour <= 23; hour++) {
      for (const minute of [0, 15, 30, 45]) {
        if (hour === 23 && minute === 45) break;
        slots.push({ hour, minute, isOpen: false });
      }
    }
    setExceptionSlots(slots);
  };

  const buildExceptionSlots = (dayExceptions) => {
    const slots = [];
    // 7:00から23:30まで = 66スロット
    for (let hour = 7; hour <= 23; hour++) {
      for (const minute of [0, 15, 30, 45]) {
        if (hour === 23 && minute === 45) break;

        const currentMinutes = hour * 60 + minute;
        const isOpen = dayExceptions.some((exception) => {
          if (!exception.openTime || !exception.closeTime) return false;
          const [openHour, openMin] = exception.openTime.split(":").map(Number);
          const [closeHour, closeMin] = exception.closeTime
            .split(":")
            .map(Number);
          const openMinutes = openHour * 60 + openMin;
          const closeMinutes = closeHour * 60 + closeMin;
          return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        });
        slots.push({ hour, minute, isOpen });
      }
    }
    setExceptionSlots(slots);
  };

  // Exception drag functions
  const handleExceptionMouseDown = (slotIndex) => {
    setIsDraggingException(true);
    const currentSlot = exceptionSlots[slotIndex];
    setDragModeException(currentSlot.isOpen ? "close" : "open");
    toggleExceptionSlot(slotIndex, !currentSlot.isOpen);
  };

  const handleExceptionMouseEnter = (slotIndex) => {
    if (isDraggingException) {
      toggleExceptionSlot(slotIndex, dragModeException === "open");
    }
  };

  const handleExceptionMouseUp = () => {
    setIsDraggingException(false);
  };

  const toggleExceptionSlot = (slotIndex, isOpen) => {
    setExceptionSlots((prev) =>
      prev.map((slot, idx) => (idx === slotIndex ? { ...slot, isOpen } : slot))
    );
  };

  const convertExceptionSlotsToRanges = () => {
    const ranges = [];
    let rangeStart = null;

    exceptionSlots.forEach((slot, index) => {
      const slotMinutes = slot.hour * 60 + slot.minute;
      if (slot.isOpen && rangeStart === null) {
        rangeStart = slotMinutes;
      } else if (!slot.isOpen && rangeStart !== null) {
        ranges.push({
          openTime: minutesToTime(rangeStart),
          closeTime: minutesToTime(slotMinutes),
        });
        rangeStart = null;
      }
      // 最後のスロット(23:30)で開いている場合は23:45で閉じる
      if (
        index === exceptionSlots.length - 1 &&
        slot.isOpen &&
        rangeStart !== null
      ) {
        ranges.push({
          openTime: minutesToTime(rangeStart),
          closeTime: "23:45",
        });
      }
    });

    return ranges;
  };

  const handleSaveException = async () => {
    if (!exceptionReason.trim()) {
      alert("理由を入力してください");
      return;
    }
    let updatedExceptions;
    try {
      if (exceptionType === "closed") {
        // 閉鎖日として保存
        updatedExceptions = await doPost(
          SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL,
          {
            studyRoomId: studyRoomId,
            date: selectedDate,
            isOpen: false,
            schedules: [],
            reason: exceptionReason,
          }
        );
      } else {
        // カスタムスケジュールとして保存
        const ranges = convertExceptionSlotsToRanges();
        updatedExceptions = await doPost(
          SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL,
          {
            studyRoomId: studyRoomId,
            date: selectedDate,
            isOpen: true,
            schedules: ranges,
            reason: exceptionReason,
          }
        );
      }

      setShowExceptionModal(false);
      setExceptions(updatedExceptions);
      alert("例外スケジュールを保存しました");
    } catch (error) {
      console.error("例外スケジュールの保存に失敗:", error);
      alert("例外スケジュールの保存に失敗しました");
    }
  };

  const handleDeleteException = async () => {
    if (!confirm("この例外スケジュールを削除しますか？")) return;

    try {
      const updatedExceptions = await doPost(
        "/api/studyRoom/scheduleException/delete",
        {
          studyRoomId: studyRoomId,
          date: selectedDate,
        }
      );

      setShowExceptionModal(false);
      setExceptions(updatedExceptions);
      alert("例外スケジュールを削除しました");
    } catch (error) {
      console.error("例外スケジュールの削除に失敗:", error);
      alert("例外スケジュールの削除に失敗しました");
    }
  };

  const hasException = (day) => {
    const dateStr = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return exceptions.some((e) => e.date === dateStr);
  };

  const isClosedDay = (day) => {
    const dateStr = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const dayExceptions = exceptions.filter((e) => e.date === dateStr);
    return dayExceptions.length > 0 && !dayExceptions[0].isOpen;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // 空白セル
    for (let i = 0; i < firstDay; i++) {
      days.push(<td key={`empty-${i}`}></td>);
    }

    // 日付セル
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEx = hasException(day);
      const isClosed = isClosedDay(day);

      days.push(
        <td
          key={day}
          onClick={() => handleDateClick(day)}
          style={{
            cursor: "pointer",
            padding: "10px",
            backgroundColor: isClosed ? "#ffcccc" : hasEx ? "#fff3cd" : "white",
            border: "1px solid #dee2e6",
            textAlign: "center",
          }}
          className="hover-cell"
        >
          <div>{day}</div>
          {hasEx && (
            <small style={{ color: isClosed ? "#dc3545" : "#856404" }}>
              {isClosed ? "休室" : "特別"}
            </small>
          )}
        </td>
      );
    }

    // 週ごとに分割
    const weeks = [];
    let week = [];
    days.forEach((day, index) => {
      week.push(day);
      if ((index + 1) % 7 === 0 || index === days.length - 1) {
        weeks.push(<tr key={`week-${weeks.length}`}>{week}</tr>);
        week = [];
      }
    });

    return weeks;
  };

  return (
    <div className="container-fluid mt-4" onMouseUp={handleMouseUp}>
      <style jsx>{`
        .hover-cell:hover {
          background-color: #e9ecef !important;
        }
      `}</style>

      <div className="row">
        {/* Left: Regular Schedule */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-secondary me-3"
                  onClick={() => router.back()}
                >
                  ← 戻る
                </button>
                <div>
                  <h5 className="mb-0">デフォルト週間スケジュール</h5>
                  <small className="text-muted">{studyRoomName}</small>
                </div>
              </div>
              <div>
                <button
                  className="btn btn-info btn-sm me-2"
                  onClick={handleOpenCopyRegularModal}
                >
                  📋 他の自習室にコピー
                </button>
                {hasChanges && (
                  <>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={handleReset}
                    >
                      リセット
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleSaveSchedules}
                    >
                      💾 保存
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <small>📌 ドラッグして開室時間を設定</small>
              </div>

              <div className="table-responsive">
                <table
                  className="table table-bordered text-center"
                  style={{ userSelect: "none", fontSize: "0.8rem" }}
                >
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>時/曜</th>
                      {weekSchedule.map((day) => (
                        <th
                          key={day.dayOfWeek}
                          style={{
                            backgroundColor:
                              day.dayLabel === "土"
                                ? "#e3f2fd"
                                : day.dayLabel === "日"
                                ? "#ffe0e0"
                                : "white",
                          }}
                        >
                          {day.dayLabel}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 7:00から23:00まで = 17時間 (23:30までの最後のスロットを含む) */}
                    {Array.from({ length: 17 }, (_, index) => {
                      const hour = index + 7;
                      return (
                        <tr key={hour}>
                          <td
                            className="align-middle fw-bold"
                            style={{
                              backgroundColor: "#f8f9fa",
                              fontSize: "0.7rem",
                            }}
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
                                  // 23:45は表示しない
                                  if (hour === 23 && minute === 45)
                                    return (
                                      <div
                                        key={`${hour}-${minute}`}
                                        style={{
                                          height: "8px",
                                          backgroundColor: "gray",
                                          borderTop: "1px dashed #e0e0e0",
                                        }}
                                      />
                                    );

                                  const slotIndex =
                                    (hour - 7) * 4 + minute / 15;
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
                                        height: "8px",
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

              {/* 開室時間の文字表示 */}
              <div className="mb-3 p-3 bg-light rounded">
                <h6 className="mb-2">現在の開室時間</h6>
                {weekSchedule.map((day) => (
                  <div key={day.dayOfWeek} className="mb-1">
                    <strong>{day.dayLabel}曜日: </strong>
                    {day.schedules && day.schedules.length > 0 ? (
                      day.schedules.map((schedule, index) => (
                        <span key={index}>
                          {schedule.openTime} - {schedule.closeTime}
                          {index < day.schedules.length - 1 && ", "}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">休室</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Exception Schedule */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">例外スケジュール（特別営業・休室日）</h5>
                <small className="text-muted">{studyRoomName}</small>
              </div>
              <button
                className="btn btn-info btn-sm"
                onClick={handleOpenCopyExceptionModal}
              >
                📋 他の自習室にコピー
              </button>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={handlePrevMonth}
                >
                  ← 前月
                </button>
                <h5 className="mb-0">
                  {currentYear}年 {currentMonth}月
                </h5>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleNextMonth}
                >
                  次月 →
                </button>
              </div>

              <div className="alert alert-warning">
                <small>
                  📅 カレンダーの日付をクリックして例外を設定
                  <br />
                  🟨 黄色: 特別営業日 / 🟥 赤色: 休室日
                </small>
              </div>

              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th style={{ textAlign: "center", color: "red" }}>日</th>
                    <th style={{ textAlign: "center" }}>月</th>
                    <th style={{ textAlign: "center" }}>火</th>
                    <th style={{ textAlign: "center" }}>水</th>
                    <th style={{ textAlign: "center" }}>木</th>
                    <th style={{ textAlign: "center" }}>金</th>
                    <th style={{ textAlign: "center", color: "blue" }}>土</th>
                  </tr>
                </thead>
                <tbody>{renderCalendar()}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Regular Schedule Modal */}
      {showCopyRegularModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">通常スケジュールをコピー</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCopyRegularModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <small>
                      コピー先の自習室を選択してください。選択した自習室の通常スケジュールが上書きされます。
                    </small>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="selectAllRegular"
                      checked={selectAll}
                      onChange={handleToggleSelectAll}
                    />
                    <label
                      className="form-check-label fw-bold"
                      htmlFor="selectAllRegular"
                    >
                      すべて選択
                    </label>
                  </div>

                  <div
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                      padding: "10px",
                    }}
                  >
                    {getAvailableStudyRooms().length === 0 ? (
                      <div className="text-muted text-center py-3">
                        コピー可能な自習室がありません
                      </div>
                    ) : (
                      getAvailableStudyRooms().map((room) => (
                        <div key={room.studyRoomId} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`room-regular-${room.studyRoomId}`}
                            checked={selectedStudyRoomIds.includes(
                              room.studyRoomId.toString()
                            )}
                            onChange={() =>
                              handleToggleStudyRoom(room.studyRoomId.toString())
                            }
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`room-regular-${room.studyRoomId}`}
                          >
                            {room.cramSchoolName} - {room.studyRoomName}
                          </label>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3">
                    <small className="text-muted">
                      選択中: {selectedStudyRoomIds.length}件
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCopyRegularModal(false)}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCopyRegularSchedule}
                    disabled={selectedStudyRoomIds.length === 0}
                  >
                    コピー実行
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Copy Exception Schedule Modal */}
      {showCopyExceptionModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    例外スケジュールをコピー ({currentYear}年{currentMonth}月)
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCopyExceptionModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <small>
                      コピー先の自習室を選択してください。{currentYear}年
                      {currentMonth}
                      月の例外スケジュールが選択した自習室にコピーされます。
                    </small>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="selectAllException"
                      checked={selectAll}
                      onChange={handleToggleSelectAll}
                    />
                    <label
                      className="form-check-label fw-bold"
                      htmlFor="selectAllException"
                    >
                      すべて選択
                    </label>
                  </div>

                  <div
                    style={{
                      maxHeight: "400px",
                      overflowY: "auto",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                      padding: "10px",
                    }}
                  >
                    {getAvailableStudyRooms().length === 0 ? (
                      <div className="text-muted text-center py-3">
                        コピー可能な自習室がありません
                      </div>
                    ) : (
                      getAvailableStudyRooms().map((room) => (
                        <div key={room.studyRoomId} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`room-exception-${room.studyRoomId}`}
                            checked={selectedStudyRoomIds.includes(
                              room.studyRoomId.toString()
                            )}
                            onChange={() =>
                              handleToggleStudyRoom(room.studyRoomId.toString())
                            }
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`room-exception-${room.studyRoomId}`}
                          >
                            {room.cramSchoolName} - {room.studyRoomName}
                          </label>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3">
                    <small className="text-muted">
                      選択中: {selectedStudyRoomIds.length}件
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCopyExceptionModal(false)}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCopyExceptionSchedule}
                    disabled={selectedStudyRoomIds.length === 0}
                  >
                    コピー実行
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Exception Modal */}
      {showExceptionModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
          >
            <div
              className="modal-dialog modal-lg"
              onMouseUp={handleExceptionMouseUp}
            >
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedDate} の例外スケジュール
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
                    <div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="typeClosed"
                          checked={exceptionType === "closed"}
                          onChange={() => setExceptionType("closed")}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="typeClosed"
                        >
                          完全休室
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          id="typeCustom"
                          checked={exceptionType === "custom"}
                          onChange={() => setExceptionType("custom")}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="typeCustom"
                        >
                          特別営業時間
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="exceptionReason" className="form-label">
                      理由
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exceptionReason"
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      placeholder="例: 年末年始休業、特別開校日"
                    />
                  </div>

                  {exceptionType === "custom" && (
                    <>
                      <div className="alert alert-info">
                        <small>📌 ドラッグして開室時間を設定してください</small>
                      </div>

                      {/* 開室時間の文字表示 */}
                      <div className="mb-3 p-3 bg-light rounded">
                        <h6 className="mb-2">設定されている開室時間</h6>
                        {(() => {
                          const dayExceptions = exceptions.filter(
                            (e) => e.date === selectedDate
                          );
                          if (
                            dayExceptions.length > 0 &&
                            dayExceptions.some(
                              (ex) => ex.openTime && ex.closeTime
                            )
                          ) {
                            return dayExceptions.map(
                              (exception, index) =>
                                exception.openTime &&
                                exception.closeTime && (
                                  <div key={index}>
                                    {exception.openTime} - {exception.closeTime}
                                    {index < dayExceptions.length - 1 && ", "}
                                  </div>
                                )
                            );
                          } else {
                            return (
                              <span className="text-muted">
                                開室時間が設定されていません
                              </span>
                            );
                          }
                        })()}
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
                            {/* 7:00から23:00まで = 17時間 (23:30までの最後のスロットを含む) */}
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
                                        // 23:45は表示しない
                                        if (hour === 23 && minute === 45)
                                          return (
                                            <div
                                              key={`${hour}-${minute}`}
                                              style={{
                                                height: "10px",
                                                backgroundColor: "gray",
                                                borderTop: "1px dashed #e0e0e0",
                                              }}
                                            />
                                          );

                                        const slotIndex =
                                          (hour - 7) * 4 + minute / 15;
                                        const slot = exceptionSlots[slotIndex];
                                        const isHourStart = minute === 0;
                                        return (
                                          <div
                                            key={`${hour}-${minute}`}
                                            onMouseDown={() =>
                                              handleExceptionMouseDown(
                                                slotIndex
                                              )
                                            }
                                            onMouseEnter={() =>
                                              handleExceptionMouseEnter(
                                                slotIndex
                                              )
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
                                              transition:
                                                "background-color 0.1s",
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
                  {exceptions.some((e) => e.date === selectedDate) && (
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
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}

export default function StudyRoomDetailPage() {
  return (
    <Suspense fallback={<div>読み込み中</div>}>
      <StudyRoomDetailContent></StudyRoomDetailContent>
    </Suspense>
  );
}
