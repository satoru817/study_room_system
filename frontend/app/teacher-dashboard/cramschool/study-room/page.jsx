"use client";
import { SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL } from "@/app/constants/urls";
import { doGet, doPost } from "@/app/elfs/WebserviceElf";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import RegularScheduleSection from "./RegularScheduleSection";
import ExceptionScheduleSection from "./ExceptionScheduleSection";
import CopyScheduleModal from "./CopyScheduleModal";
import ExceptionEditModal from "./ExceptionEditModal";
import {
  DAYS,
  buildWeekSchedule,
  convertScheduleToRanges,
  convertExceptionSlotsToRanges,
  createMessageFromWillBeDeletedOrModified,
  alertNotificationResult,
  initializeExceptionSlots,
  buildExceptionSlots,
} from "./scheduleUtils";

function StudyRoomDetailContent() {
  const searchParams = useSearchParams();
  const studyRoomId = searchParams.get("studyRoomId");
  const studyRoomName = searchParams.get("name");

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

  useEffect(() => {
    const fetchStudyRoomRegularSchedules = async () => {
      try {
        const url = `/api/studyRoom/regularSchedule/get?studyRoomId=${encodeURIComponent(
          studyRoomId
        )}`;
        const _regularSchedules = await doGet(url);
        const weekData = buildWeekSchedule(_regularSchedules, DAYS);
        setWeekSchedule(weekData);
        setHasChanges(false);
      } catch (error) {
        console.error("自習室の通常スケジュールの取得に失敗", error);
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
    fetchStudyRoomRegularSchedules();
    fetchStudyRooms();
  }, [studyRoomId]);

  useEffect(() => {
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

  // Touch event handlers for regular schedule
  const handleTouchStart = (e, dayIndex, slotIndex) => {
    e.preventDefault();
    setIsDragging(true);
    const currentSlot = weekSchedule[dayIndex].slots[slotIndex];
    setDragMode(currentSlot.isOpen ? "close" : "open");
    toggleSlot(dayIndex, slotIndex, !currentSlot.isOpen);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const cellData = element.closest("[data-slot]");
    if (!cellData) return;

    const [dayIndex, slotIndex] = cellData.dataset.slot.split("_").map(Number);
    if (dayIndex !== undefined && slotIndex !== undefined) {
      toggleSlot(dayIndex, slotIndex, dragMode === "open");
    }
  };

  const handleTouchEnd = () => {
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

  const handleSaveSchedules = async () => {
    try {
      const schedules = convertScheduleToRanges(weekSchedule);
      const data = {
        studyRoomId,
        regularSchedules: schedules,
      };
      // まず消される、あるいは変更される予約をとってくる。そして確認をとった上で保存する。
      // 保存するときは予約の変更、削除及びその通知をして、その結果をfrontに返し表示する」
      const { willBeDeleted, willBeModified } = await doPost(
        "/api/reservation/regularScheduleChange/confirmBeforeSave",
        data
      );
      const message = createMessageFromWillBeDeletedOrModified(
        willBeDeleted,
        willBeModified
      );

      if (!confirm(message)) return;

      const { updatedRegularSchedule, notificationResult } = await doPost(
        "/api/studyRoom/regularSchedule/save",
        {
          studyRoomId: studyRoomId,
          regularSchedules: schedules,
        }
      );
      setHasChanges(false);
      alertNotificationResult(notificationResult);
      const weekData = buildWeekSchedule(updatedRegularSchedule, DAYS);
      setWeekSchedule(weekData);
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
  const getAvailableStudyRooms = useCallback(() => {
    return studyRooms.filter(
      (room) => room.studyRoomId.toString() !== studyRoomId
    );
  }, [studyRoomId, studyRooms]);

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
  }, [selectedStudyRoomIds, getAvailableStudyRooms, setSelectAll]);
  // TODO: update here to add confirmation!!
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
      // TODO* まずwillBeDeleted とwillBeModifiedをとってくる。
      // 気をつけないと行けないのは、表示するとき、自習室名も出さないと行けないことである。
      // あと、全体的に、通知送信するっていう言葉も書いたほうがいい。
      const data = {
        fromStudyRoomId: studyRoomId,
        toStudyRoomIds: selectedStudyRoomIds,
      };
      const { willBeDeleted, willBeModified } = await doPost(
        "/api/reservation/regularScheduleCopy/confirmBeforeSave",
        data
      );
      const message = createMessageFromWillBeDeletedOrModified(
        willBeDeleted,
        willBeModified
      );

      if (!confirm(message)) return;

      const notificationResult = await doPost(
        "/api/studyRoom/regularSchedule/copy",
        data
      );
      alertNotificationResult(notificationResult);
      setShowCopyRegularModal(false);
    } catch (error) {
      console.error("通常スケジュールのコピーに失敗:", error);
      alert("通常スケジュールのコピーに失敗しました");
    }
  };
  // TODO: update here to add confirmation!!
  // front-end: make it possible to check whose booking will be lost by the change
  // back-end: send e-mail or line to each student for the loss of the booking
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

    const message = `以下の${selectedStudyRoomIds.length}件の自習室に${currentYear}年${currentMonth}月の例外スケジュールをコピーしますか？\n\n${roomNames}`;
    if (!confirm(message)) return;

    try {
      //ここで何をすべきか。
      // まず、willBeDeletedとwillBeModifiedを持ってくる。
      // それでOKのときだけ、コピー操作を実行し、それにともなった、予約の更新も行う。
      // その更新作業の結果を受け取って、表示する。
      // 最終的にすべての表示はmodalできちんと行うようにしたいが、とりあえずはalertで動けばいい。
      const data = {
        fromStudyRoomId: studyRoomId,
        toStudyRoomIds: selectedStudyRoomIds,
        year: currentYear,
        month: currentMonth,
      };

      const { willBeDeleted, willBeModified } = await doPost(
        "/api/reservation/scheduleExceptionCopy/confirmBeforeSave",
        data
      );
      const message = createMessageFromWillBeDeletedOrModified(
        willBeDeleted,
        willBeModified
      );
      if (!confirm(message)) return;
      const notificationResult = await doPost(
        "/api/studyRoom/scheduleException/copy",
        data
      );
      alertNotificationResult(notificationResult);
      setShowCopyExceptionModal(false);
    } catch (error) {
      console.error("例外スケジュールのコピーに失敗:", error);
      alert("例外スケジュールのコピーに失敗しました");
    }
  };

  // Calendar navigation functions
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
      setExceptionSlots(buildExceptionSlots(dayExceptions));
    } else {
      // 新規作成
      setExceptionType("closed");
      setExceptionReason("");
      setExceptionSlots(initializeExceptionSlots());
    }

    setShowExceptionModal(true);
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

  // Touch event handlers for exception schedule
  const handleExceptionTouchStart = (e, dayIndex, slotIndex) => {
    e.preventDefault();
    setIsDraggingException(true);
    const currentSlot = exceptionSlots[slotIndex];
    setDragModeException(currentSlot.isOpen ? "close" : "open");
    toggleExceptionSlot(slotIndex, !currentSlot.isOpen);
  };

  const handleExceptionTouchMove = (e) => {
    if (!isDraggingException) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const cellData = element.closest("[data-slot]");
    if (!cellData) return;

    const [, slotIndex] = cellData.dataset.slot.split("_").map(Number);
    if (slotIndex !== undefined) {
      toggleExceptionSlot(slotIndex, dragModeException === "open");
    }
  };

  const handleExceptionTouchEnd = () => {
    setIsDraggingException(false);
  };

  const toggleExceptionSlot = (slotIndex, isOpen) => {
    setExceptionSlots((prev) =>
      prev.map((slot, idx) => (idx === slotIndex ? { ...slot, isOpen } : slot))
    );
  };

  // TODO: add confirmation of the change!!
  const handleSaveException = async () => {
    if (!exceptionReason.trim()) {
      alert("理由を入力してください");
      return;
    }
    let updatedExceptions;
    let _notificationResult; // this is the result of confirmation email or line to parents for the change of reservations
    try {
      if (exceptionType === "closed") {
        // 閉鎖日として保存
        //削除される予約をとってくる。
        const reservationsToBeDeleted = await doPost(
          "/api/reservation/confirm/deletedByClosingOneDay",
          {
            studyRoomId,
            date: selectedDate,
          }
        );

        let message;
        if (reservationsToBeDeleted.size > 0) {
          message =
            "以下の予約が削除され、生徒に連絡されます\n" +
            reservationsToBeDeleted
              .map(
                (res) =>
                  `${res.studentName}の${res.startHour}から${res.endHour}までの予約`
              )
              .join("\n");
        } else {
          message = "この変更で削除される予約はありません。";
        }

        if (confirm(message)) {
          const { scheduleExceptions, notificationResult } = await doPost(
            SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL,
            {
              studyRoomId: studyRoomId,
              date: selectedDate,
              isOpen: false,
              schedules: [],
              reason: exceptionReason,
            }
          );
          _notificationResult = notificationResult;
          updatedExceptions = scheduleExceptions;
        }
        // 特別開講予定を保存
      } else {
        const ranges = convertExceptionSlotsToRanges(exceptionSlots);

        const updateRequestData = {
          studyRoomId: studyRoomId,
          date: selectedDate,
          isOpen: true,
          schedules: ranges,
          reason: exceptionReason,
        };

        const { willBeDeleted, willBeModified } = await doPost(
          "/api/reservation/scheduleException/changeOneDay",
          updateRequestData
        );

        const message = createMessageFromWillBeDeletedOrModified(
          willBeDeleted,
          willBeModified
        );

        if (confirm(message)) {
          const { scheduleExceptions, notificationResult } = await doPost(
            SAVE_STUDY_ROOM_SCHEDULE_EXCEPTION_URL,
            updateRequestData
          );
          _notificationResult = notificationResult;
          updatedExceptions = scheduleExceptions;
        }
      }
      setShowExceptionModal(false);
      setExceptions(updatedExceptions);
      alertNotificationResult(_notificationResult);
    } catch (error) {
      console.error("例外スケジュールの保存に失敗:", error);
      alert("例外スケジュールの保存に失敗しました");
    }
  };
  // TODO: update this!!!

  const handleDeleteException = async () => {
    if (!confirm("この例外スケジュールを削除しますか？")) return;

    const selectedException = exceptions.find(
      (exception) => exception.date === selectedDate
    );

    try {
      if (!selectedException.isOpen) {
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
      } else {
        // first check if there's any reservations that will be deleted by this change(deletion of a schedule exception)
        const { willBeDeleted, willBeModified } = await doPost(
          "/api/reservation/scheduleExceptionChange/confirmBeforeDelete",
          { studyRoomId, selectedDate }
        );
        const message = createMessageFromWillBeDeletedOrModified(
          willBeDeleted,
          willBeModified
        );

        if (confirm(message)) {
          const { scheduleExceptions, notificationResult } = await doPost(
            "/api/studyRoom/scheduleExceptionOfOneDay/delete/withNotificationNeed",
            {
              studyRoomId,
              date: selectedDate,
            }
          );
          setShowExceptionModal(false);
          setExceptions(scheduleExceptions);
          alertNotificationResult(notificationResult);
        }
      }
    } catch (error) {
      console.error("例外スケジュールの削除に失敗:", error);
      alert("例外スケジュールの削除に失敗しました");
    }
  };

  return (
    <div
      className="container-fluid mt-3 mt-md-4 px-2 px-md-3"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <style jsx>{`
        .hover-cell:hover {
          background-color: #e9ecef !important;
        }
      `}</style>

      <div className="row g-3">
        {/* Left: Regular Schedule */}
        <RegularScheduleSection
          studyRoomName={studyRoomName}
          weekSchedule={weekSchedule}
          hasChanges={hasChanges}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onTouchStart={handleTouchStart}
          onSave={handleSaveSchedules}
          onReset={handleReset}
          onOpenCopyModal={handleOpenCopyRegularModal}
        />

        {/* Right: Exception Schedule */}
        <ExceptionScheduleSection
          studyRoomName={studyRoomName}
          currentYear={currentYear}
          currentMonth={currentMonth}
          exceptions={exceptions}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onDateClick={handleDateClick}
          onOpenCopyModal={handleOpenCopyExceptionModal}
        />
      </div>

      {/* Copy Regular Schedule Modal */}
      <CopyScheduleModal
        show={showCopyRegularModal}
        onClose={() => setShowCopyRegularModal(false)}
        title="通常スケジュールをコピー"
        description="コピー先の自習室を選択してください。選択した自習室の通常スケジュールが上書きされます。"
        studyRooms={getAvailableStudyRooms()}
        selectedStudyRoomIds={selectedStudyRoomIds}
        onToggleStudyRoom={handleToggleStudyRoom}
        selectAll={selectAll}
        onToggleSelectAll={handleToggleSelectAll}
        onConfirm={handleCopyRegularSchedule}
        isException={false}
      />

      {/* Copy Exception Schedule Modal */}
      <CopyScheduleModal
        show={showCopyExceptionModal}
        onClose={() => setShowCopyExceptionModal(false)}
        title={`例外スケジュールをコピー (${currentYear}年${currentMonth}月)`}
        description={`コピー先の自習室を選択してください。${currentYear}年${currentMonth}月の例外スケジュールが選択した自習室にコピーされます。`}
        studyRooms={getAvailableStudyRooms()}
        selectedStudyRoomIds={selectedStudyRoomIds}
        onToggleStudyRoom={handleToggleStudyRoom}
        selectAll={selectAll}
        onToggleSelectAll={handleToggleSelectAll}
        onConfirm={handleCopyExceptionSchedule}
        isException={true}
      />

      {/* Exception Modal */}
      <ExceptionEditModal
        show={showExceptionModal}
        onClose={() => setShowExceptionModal(false)}
        selectedDate={selectedDate}
        exceptionType={exceptionType}
        setExceptionType={setExceptionType}
        exceptionReason={exceptionReason}
        setExceptionReason={setExceptionReason}
        exceptionSlots={exceptionSlots}
        onMouseDown={handleExceptionMouseDown}
        onMouseEnter={handleExceptionMouseEnter}
        onMouseUp={handleExceptionMouseUp}
        onTouchStart={handleExceptionTouchStart}
        onTouchEnd={handleExceptionTouchEnd}
        onTouchMove={handleExceptionTouchMove}
        exceptions={exceptions}
        onSave={handleSaveException}
        onDelete={handleDeleteException}
      />
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
