"use client";
import { getDaysInMonth, getFirstDayOfMonth } from "./scheduleUtils";

/**
 * Exception schedule section - shows calendar with special dates
 */
export default function ExceptionScheduleSection({
  studyRoomName,
  currentYear,
  currentMonth,
  exceptions,
  onPrevMonth,
  onNextMonth,
  onDateClick,
  onOpenCopyModal,
}) {
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
          onClick={() => onDateClick(day)}
          style={{
            cursor: "pointer",
            padding: "8px",
            backgroundColor: isClosed ? "#ffcccc" : hasEx ? "#fff3cd" : "white",
            border: "1px solid #dee2e6",
            textAlign: "center",
            minHeight: "50px",
          }}
          className="hover-cell"
        >
          <div
            style={{ fontSize: "1rem", fontWeight: hasEx ? "bold" : "normal" }}
          >
            {day}
          </div>
          {hasEx && (
            <small
              style={{
                color: isClosed ? "#dc3545" : "#856404",
                fontSize: "0.7rem",
              }}
            >
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
    <div className="col-12 col-lg-6">
      <style jsx>{`
        .hover-cell:hover {
          background-color: #e9ecef !important;
        }
      `}</style>

      <div className="card">
        <div className="card-header">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
            <div>
              <h5 className="mb-0 fs-6">例外スケジュール（特別営業・休室日）</h5>
              <small className="text-muted">{studyRoomName}</small>
            </div>
            <button
              className="btn btn-info btn-sm w-100 w-sm-auto"
              onClick={onOpenCopyModal}
            >
              <span className="d-none d-sm-inline">📋 他の自習室にコピー</span>
              <span className="d-inline d-sm-none">📋 コピー</span>
            </button>
          </div>
        </div>
        <div className="card-body p-2 p-sm-3">
          <div className="d-flex justify-content-between align-items-center mb-2 mb-sm-3">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onPrevMonth}
            >
              ← <span className="d-none d-sm-inline">前月</span>
            </button>
            <h5 className="mb-0 fs-6">
              {currentYear}年 {currentMonth}月
            </h5>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onNextMonth}
            >
              <span className="d-none d-sm-inline">次月</span> →
            </button>
          </div>

          <div className="alert alert-warning mb-2 py-2 px-2">
            <small>
              📅{" "}
              <span className="d-none d-sm-inline">
                カレンダーの日付をクリックして例外を設定
              </span>
              <span className="d-inline d-sm-none">日付タップで設定</span>
              <br />
              🟨{" "}
              <span className="d-none d-sm-inline">
                黄色: 特別営業日 /{" "}
              </span>
              🟥 <span className="d-none d-sm-inline">赤色: </span>休室日
            </small>
          </div>

          <div className="table-responsive">
            <table
              className="table table-bordered mb-0"
              style={{ fontSize: "0.85rem" }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "center",
                      color: "red",
                      padding: "8px",
                    }}
                  >
                    日
                  </th>
                  <th style={{ textAlign: "center", padding: "8px" }}>月</th>
                  <th style={{ textAlign: "center", padding: "8px" }}>火</th>
                  <th style={{ textAlign: "center", padding: "8px" }}>水</th>
                  <th style={{ textAlign: "center", padding: "8px" }}>木</th>
                  <th style={{ textAlign: "center", padding: "8px" }}>金</th>
                  <th
                    style={{
                      textAlign: "center",
                      color: "blue",
                      padding: "8px",
                    }}
                  >
                    土
                  </th>
                </tr>
              </thead>
              <tbody>{renderCalendar()}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
