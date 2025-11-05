export default function StudyRoomCreate({
  setShowCreateModal,
  newRoomName,
  setNewRoomName,
  newRoomLimit,
  setNewRoomLimit,
  handleCreateRoom,
}) {
  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block" }}
        tabIndex={-1}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">自習室を追加</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="roomName" className="form-label">
                  自習室名
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="例: A教室"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="roomLimit" className="form-label">
                  定員
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="roomLimit"
                  value={newRoomLimit}
                  onChange={(e) => setNewRoomLimit(Number(e.target.value))}
                  min="1"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateRoom}
              >
                追加
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
