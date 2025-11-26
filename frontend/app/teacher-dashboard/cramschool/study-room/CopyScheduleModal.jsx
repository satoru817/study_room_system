"use client";

/**
 * Modal for copying schedules to other study rooms
 * Used for both regular and exception schedules
 */
export default function CopyScheduleModal({
  show,
  onClose,
  title,
  description,
  studyRooms,
  selectedStudyRoomIds,
  onToggleStudyRoom,
  selectAll,
  onToggleSelectAll,
  onConfirm,
  isException = false,
}) {
  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex={-1}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <small>{description}</small>
              </div>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={isException ? "selectAllException" : "selectAllRegular"}
                  checked={selectAll}
                  onChange={onToggleSelectAll}
                />
                <label
                  className="form-check-label fw-bold"
                  htmlFor={isException ? "selectAllException" : "selectAllRegular"}
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
                {studyRooms.length === 0 ? (
                  <div className="text-muted text-center py-3">
                    コピー可能な自習室がありません
                  </div>
                ) : (
                  studyRooms.map((room) => (
                    <div key={room.studyRoomId} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`room-${isException ? "exception" : "regular"}-${
                          room.studyRoomId
                        }`}
                        checked={selectedStudyRoomIds.includes(
                          room.studyRoomId.toString()
                        )}
                        onChange={() =>
                          onToggleStudyRoom(room.studyRoomId.toString())
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`room-${isException ? "exception" : "regular"}-${
                          room.studyRoomId
                        }`}
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
                onClick={onClose}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onConfirm}
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
  );
}
