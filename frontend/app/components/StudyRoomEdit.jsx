export default function StudyRoomEdit({
  setShowEditModal,
  setEditingRoom,
  editingRoom,
  handleEditRoom,
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
              <h5 className="modal-title">自習室を編集</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowEditModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="editRoomName" className="form-label">
                  自習室名
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="editRoomName"
                  value={editingRoom.name}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      name: e.target.value,
                    })
                  }
                  placeholder="例: A教室"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editRoomLimit" className="form-label">
                  定員
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="editRoomLimit"
                  value={editingRoom.roomLimit}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      roomLimit: Number(e.target.value),
                    })
                  }
                  min="1"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEditRoom}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
