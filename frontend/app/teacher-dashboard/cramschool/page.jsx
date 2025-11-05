"use client";
import { doGet, doPost } from "@/app/elfs/WebserviceElf";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StudyRoomCreate from "../../components/StudyRoomCreate";
import StudyRoomEdit from "../../components/StudyRoomEdit";
import { create } from "domain";

export default function CramSchoolDetailPage() {
  const searchParams = useSearchParams();
  const cramSchoolId = searchParams.get("cramSchoolId");
  const cramSchoolName = searchParams.get("name");
  const router = useRouter();

  const [studyRooms, setStudyRooms] = useState([]);
  const [studyRoomId, setstudyRoomId] = useState(-1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLimit, setNewRoomLimit] = useState(30);
  const [editingRoom, setEditingRoom] = useState(null);

  const fetchStudyRooms = async () => {
    try {
      const url = `/api/studyRoom/get/${cramSchoolId}`;
      const _studyRooms = await doGet(url);
      setStudyRooms(_studyRooms);
    } catch (error) {
      console.error("自習室の取得に失敗:", error);
    }
  };

  useEffect(() => {
    fetchStudyRooms();
  }, [cramSchoolId]);

  const handleGoToRoom = () => {
    if (studyRoomId) {
      const selectedRoom = studyRooms.find(
        (room) => room.studyRoomId === studyRoomId
      );
      if (selectedRoom) {
        router.push(
          // TODO: change this!!!
          `/teacher-dashboard/cramschool/study-room/?studyRoomId=${encodeURLComponent(
            studyRoomId
          )}&name=${encodeURIComponent(selectedRoom.name)}`
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
      await doPost(`/api/studyRoom/create/${cramSchoolId}`, {
        name: newRoomName,
        roomLimit: newRoomLimit,
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
    const room = studyRooms.find((r) => r.studyRoomId === studyRoomId);
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

    if (editingRoom.roomLimit < 1) {
      alert("有効な人数を入力してください");
      return;
    }

    try {
      const createdStudyRoom = await doPost("/api/studyRoom/edit", {
        studyRoomId: editingRoom.studyRoomId,
        name: editingRoom.name,
        roomLimit: editingRoom.roomLimit,
      });

      setShowEditModal(false);
      setEditingRoom(null);

      //await fetchStudyRooms();
      setStudyRooms([
        createdStudyRoom,
        ...studyRooms.filter((sr) => sr.studyRoomId !== studyRoomId),
      ]);

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
                {studyRooms.map((room) => (
                  <button
                    key={room.studyRoomId}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      studyRoomId === room.studyRoomId ? "active" : ""
                    }`}
                    onClick={() => setstudyRoomId(room.studyRoomId)}
                  >
                    <div>
                      <h6 className="mb-1">{room.name}</h6>
                      <small>定員: {room.roomLimit}名</small>
                    </div>
                    {room.currentStudents !== undefined && (
                      <span className="badge bg-info rounded-pill">
                        在室: {room.currentStudents}名
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
        <StudyRoomCreate
          setShowCreateModal={setShowCreateModal}
          newRoomName={newRoomName}
          newRoomLimit={newRoomLimit}
          setNewRoomLimit={setNewRoomLimit}
          setNewRoomName={setNewRoomName}
          handleCreateRoom={handleCreateRoom}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingRoom && (
        <StudyRoomEdit
          setShowEditModal={setShowEditModal}
          setEditingRoom={setEditingRoom}
          editingRoom={editingRoom}
          handleEditRoom={handleEditRoom}
        />
      )}
    </div>
  );
}
