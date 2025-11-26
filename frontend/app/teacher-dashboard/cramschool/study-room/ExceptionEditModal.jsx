"use client";
import TimeSlotGrid from "./TimeSlotGrid";

/**
 * Modal for editing exception schedules (special opening hours or closed days)
 */
export default function ExceptionEditModal({
  show,
  onClose,
  selectedDate,
  exceptionType,
  setExceptionType,
  exceptionReason,
  setExceptionReason,
  exceptionSlots,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  exceptions,
  onSave,
  onDelete,
}) {
  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex={-1}
      >
        <div
          className="modal-dialog modal-lg"
          onMouseUp={onMouseUp}
          onTouchEnd={onTouchEnd}
          onTouchMove={onTouchMove}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedDate} の例外スケジュール
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
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
                    <label className="form-check-label" htmlFor="typeClosed">
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
                    <label className="form-check-label" htmlFor="typeCustom">
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
                    <small>📌 ドラッグ/スライドで開室時間を設定してください</small>
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

                  <TimeSlotGrid
                    weekSchedule={[{ slots: exceptionSlots }]}
                    onMouseDown={onMouseDown}
                    onMouseEnter={onMouseEnter}
                    onTouchStart={onTouchStart}
                    singleColumn={true}
                  />
                </>
              )}
            </div>
            <div className="modal-footer">
              {exceptions.some((e) => e.date === selectedDate) && (
                <button
                  type="button"
                  className="btn btn-danger me-auto"
                  onClick={onDelete}
                >
                  削除
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSave}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
