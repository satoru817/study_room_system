"use client";
import { StudyRoom } from "@/app/constants/types";
import {
  GET_STUDY_ROOMS_URL,
  CREATE_STUDY_ROOM_URL,
  EDIT_STUDY_ROOM_URL,
} from "@/app/constants/urls";
import { doGet, doPost } from "@/app/elfs/WebserviceElf";
import { useSearchParams, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function CramSchoolDetailPage({
  params,
}: {
  params: Promise<{ cramschoolId: string }>;
}) {
  const { cramschoolId } = use(params);
  const searchParams = useSearchParams();
  const cramSchoolName = searchParams.get("name") || "";
  const router = useRouter();

  const [studyRooms, setStudyRooms] = useState<Array<StudyRoom>>([]);
  const [studyRoomId, setstudyRoomId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLimit, setNewRoomLimit] = useState(30);
  const [editingRoom, setEditingRoom] = useState<StudyRoom | null>(null);

  const fetchStudyRooms = async () => {
    try {
      const url = `${GET_STUDY_ROOMS_URL}/${cramschoolId}`;
      const _studyRooms: Array<StudyRoom> = await doGet(url);
      setStudyRooms(_studyRooms);
    } catch (error) {
      console.error("自習室の取得に失敗:", error);
    }
  };

  useEffect(() => {
    fetchStudyRooms();
  }, [cramschoolId]);

  const handleGoToRoom = () => {
    if (studyRoomId) {
      const selectedRoom = studyRooms.find(
        (room) => room.study_room_id === studyRoomId
      );
      if (selectedRoom) {
        router.push(
          `/teacher-dashboard/${cramschoolId}/study-room/${studyRoomId}?name=${encodeURIComponent(
            selectedRoom.name
          )}`
        );
      }
    } else {
      alert("自習室を選択してください");
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert("自習室名を入力してください");
      return;
    }

    if (newRoomLimit < 1) {
      alert("有効な人数を入力してください");
      return;
    }

    try {
      await doPost(CREATE_STUDY_ROOM_URL, {
        cramschool_id: cramschoolId,
        name: newRoomName,
        room_limit: newRoomLimit,
      });

      setShowCreateModal(false);
      setNewRoomName("");
      setNewRoomLimit(30);

      await fetchStudyRooms();
      alert("自習室を追加しました");
    } catch (error) {
      console.error("自習室の追加に失敗:", error);
      alert("自習室の追加に失敗しました");
    }
  };

  const handleOpenEditModal = () => {
    if (!studyRoomId) {
      alert("編集する自習室を選択してください");
      return;
    }
    const room = studyRooms.find((r) => r.study_room_id === studyRoomId);
    if (room) {
      setEditingRoom(room);
      setShowEditModal(true);
    }
  };

  const handleEditRoom = async () => {
    if (!editingRoom) return;

    if (!editingRoom.name.trim()) {
      alert("自習室名を入力してください");
      return;
    }

    if (editingRoom.room_limit < 1) {
      alert("有効な人数を入力してください");
      return;
    }

    try {
      await doPost(EDIT_STUDY_ROOM_URL, {
        study_room_id: editingRoom.study_room_id,
        name: editingRoom.name,
        room_limit: editingRoom.room_limit,
      });

      setShowEditModal(false);
      setEditingRoom(null);

      await fetchStudyRooms();
      alert("自習室を更新しました");
    } catch (error) {
      console.error("自習室の更新に失敗:", error);
      alert("自習室の更新に失敗しました");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-secondary me-3"
                  onClick={() => router.back()}
                >
                  ← 戻る
                </button>
                <h4 className="mb-0">{cramSchoolName} - 自習室管理</h4>
              </div>
              <div>
                <button
                  className="btn btn-success me-2"
                  onClick={() => setShowCreateModal(true)}
                >
                  + 自習室を追加
                </button>
                <button
                  className="btn btn-warning me-2"
                  onClick={handleOpenEditModal}
                  disabled={!studyRoomId}
                >
                  編集
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleGoToRoom}
                  disabled={!studyRoomId}
                >
                  詳細設定
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="list-group">
                {studyRooms
                  .filter((r) => !!r)
                  .map((room) => (
                    <button
                      key={room.study_room_id}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                        studyRoomId === room.study_room_id ? "active" : ""
                      }`}
                      onClick={() => setstudyRoomId(room.study_room_id)}
                    >
                      <div>
                        <h6 className="mb-1">{room.name}</h6>
                        <small>定員: {room.room_limit}名</small>
                      </div>
                      {room.current_students !== undefined && (
                        <span className="badge bg-info rounded-pill">
                          在室: {room.current_students}名
                        </span>
                      )}
                    </button>
                  ))}
              </div>
              {studyRooms.length === 0 && (
                <p className="text-center text-muted mt-3">
                  自習室がありません。追加してください。
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
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
      )}

      {/* Edit Modal */}
      {showEditModal && editingRoom && (
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
                      value={editingRoom.room_limit}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          room_limit: Number(e.target.value),
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
      )}
    </div>
  );
}
