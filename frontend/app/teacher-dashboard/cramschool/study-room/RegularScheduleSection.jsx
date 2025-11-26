"use client";
import { useRouter } from "next/navigation";
import TimeSlotGrid from "./TimeSlotGrid";

/**
 * Regular schedule section - shows weekly schedule with drag-to-edit
 */
export default function RegularScheduleSection({
  studyRoomName,
  weekSchedule,
  hasChanges,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onTouchStart,
  onSave,
  onReset,
  onOpenCopyModal,
}) {
  const router = useRouter();

  return (
    <div className="col-12 col-lg-6">
      <div className="card">
        <div className="card-header">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2">
            <div className="d-flex align-items-center w-100 w-sm-auto">
              <button
                className="btn btn-outline-secondary btn-sm me-2"
                onClick={() => router.back()}
              >
                ← 戻る
              </button>
              <div>
                <h5 className="mb-0 fs-6">デフォルト週間スケジュール</h5>
                <small className="text-muted">{studyRoomName}</small>
              </div>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-info btn-sm flex-fill flex-sm-grow-0"
              onClick={onOpenCopyModal}
            >
              <span className="d-none d-sm-inline">📋 他の自習室にコピー</span>
              <span className="d-inline d-sm-none">📋 コピー</span>
            </button>
            {hasChanges && (
              <>
                <button
                  className="btn btn-warning btn-sm flex-fill flex-sm-grow-0"
                  onClick={onReset}
                >
                  リセット
                </button>
                <button
                  className="btn btn-success btn-sm flex-fill flex-sm-grow-0"
                  onClick={onSave}
                >
                  💾 保存
                </button>
              </>
            )}
          </div>
        </div>
        <div className="card-body p-2 p-sm-3">
          <div className="alert alert-info mb-2 py-2 px-2">
            <small>📌 ドラッグ/スライドで開室時間を設定</small>
          </div>

          <TimeSlotGrid
            weekSchedule={weekSchedule}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onTouchStart={onTouchStart}
            singleColumn={false}
          />

          {/* 開室時間の文字表示 */}
          <div className="mt-2 p-2 p-sm-3 bg-light rounded">
            <h6 className="mb-2 fs-6">現在の開室時間</h6>
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
  );
}
