// Utility functions for schedule management

export const minutesToTime = (minutes) => {
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${hour.toString().padStart(2, "0")}:${min
    .toString()
    .padStart(2, "0")}`;
};

export const convertScheduleToRanges = (weekSchedule) => {
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

export const convertExceptionSlotsToRanges = (exceptionSlots) => {
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

export const convertDateExpression = (dateFromServer) => {
  const arr = dateFromServer.split("-");
  return `${arr[0]}年${arr[1]}月${arr[2]}日`;
};

export const createMessageFromWillBeDeletedOrModified = (
  willBeDeleted,
  willBeModified
) => {
  let message;
  if (willBeDeleted.length === 0 && willBeModified.length === 0) {
    message = "この変更で削除や変更される生徒の予約はありません。";
  } else {
    message =
      willBeDeleted.length > 0
        ? "以下の予約が削除されます\n" +
          willBeDeleted
            .map(
              (res) =>
                `${res.studentName}の${convertDateExpression(res.date)}:${
                  res.startHour
                }から${res.endHour}までの予約(${res.studyRoomName})`
            )
            .join("\n")
        : "";

    message +=
      willBeModified.length > 0
        ? "\n以下の予約が変更されます\n" +
          willBeModified
            .map(
              (res) =>
                `${res.studentName}の${convertDateExpression(res.date)}:${
                  res.startHour
                }から${res.endHour}までの予約(${res.studyRoomName})`
            )
            .join("\n")
        : "";
  }
  return message;
};

export const alertNotificationResult = (_notificationResult) => {
  const { successCount, failedStudents } = _notificationResult;
  let notificationResultMessage = "例外スケジュールを保存しました\n";

  notificationResultMessage +=
    successCount > 0
      ? `${successCount}人への変更あるいは削除の通知が成功しました。`
      : "";

  notificationResultMessage +=
    failedStudents.length > 0
      ? "以下の生徒への変更あるいは通知メッセージの送信は失敗しました。\n" +
        failedStudents.join("\n")
      : "";

  alert(notificationResultMessage);
};

export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month - 1, 1).getDay();
};

export const DAYS = [
  { key: "MONDAY", label: "月" },
  { key: "TUESDAY", label: "火" },
  { key: "WEDNESDAY", label: "水" },
  { key: "THURSDAY", label: "木" },
  { key: "FRIDAY", label: "金" },
  { key: "SATURDAY", label: "土" },
  { key: "SUNDAY", label: "日" },
];

export const buildWeekSchedule = (schedules, DAYS) => {
  const weekData = DAYS.map((day) => {
    const daySchedules = schedules.filter((s) => s.dayOfWeek === day.key);

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

  return weekData;
};

export const initializeExceptionSlots = () => {
  const slots = [];
  // 7:00から23:30まで = 66スロット
  for (let hour = 7; hour <= 23; hour++) {
    for (const minute of [0, 15, 30, 45]) {
      if (hour === 23 && minute === 45) break;
      slots.push({ hour, minute, isOpen: false });
    }
  }
  return slots;
};

export const buildExceptionSlots = (dayExceptions) => {
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
  return slots;
};
