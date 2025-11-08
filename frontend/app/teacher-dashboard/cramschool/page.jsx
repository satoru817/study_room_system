"use client";
import { doDelete, doGet, doPost } from "@/app/elfs/WebserviceElf";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import StudyRoomCreate from "../../components/StudyRoomCreate";
import StudyRoomEdit from "../../components/StudyRoomEdit";
import QRCode from "qrcode";
import jsPDF from "jspdf";

function CramSchoolDetailContent() {
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
          `/teacher-dashboard/cramschool/study-room/?studyRoomId=${encodeURIComponent(
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

  const handleGoToStudentSetting = () => {
    router.push(
      `/teacher-dashboard/cramschool/students/?cramSchoolId=${encodeURIComponent(
        cramSchoolId
      )}&cramSchoolName=${encodeURIComponent(cramSchoolName)}`
    );
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

  const handlePrintQRCodes = async () => {
    if (!studyRoomId) {
      alert("QRコードを印刷する自習室を選択してください");
      return;
    }

    const selectedRoom = studyRooms.find(
      (room) => room.studyRoomId === studyRoomId
    );
    if (!selectedRoom) {
      alert("自習室が見つかりません");
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const qrSize = 50; // QRコードのサイズ
      const margin = 20;
      const cols = 3; // 1ページあたり3列
      const rows = 4; // 1ページあたり4行
      const qrPerPage = cols * rows;

      for (let i = 0; i < selectedRoom.roomLimit; i++) {
        const pageNum = Math.floor(i / qrPerPage);
        const posInPage = i % qrPerPage;
        const col = posInPage % cols;
        const row = Math.floor(posInPage / cols);

        // 新しいページが必要な場合
        if (i > 0 && posInPage === 0) {
          pdf.addPage();
        }

        // QRコードのデータ（studyRoomIdを埋め込み）
        const qrData = JSON.stringify({
          studyRoomId: selectedRoom.studyRoomId,
          seatNumber: i + 1,
          roomName: selectedRoom.name,
        });

        // QRコードを生成
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1,
        });

        // QRコードの配置位置を計算
        const xPos = margin + col * ((pageWidth - 2 * margin) / cols);
        const yPos = 25 + row * ((pageHeight - 35) / rows);

        // QRコードを追加
        pdf.addImage(qrCodeDataUrl, "PNG", xPos + 10, yPos, qrSize, qrSize);

        // 座席番号を追加（数字なら文字化けしない）
        pdf.setFontSize(12);
        pdf.text(`Seat ${i + 1}`, xPos + 35, yPos + qrSize + 8, {
          align: "center",
        });
      }

      // PDFをダウンロード
      const fileName = `StudyRoom_${selectedRoom.studyRoomId}_QR.pdf`;
      pdf.save(fileName);
      alert("QRコードPDFを生成しました");
    } catch (error) {
      console.error("QRコード生成に失敗:", error);
      alert("QRコード生成に失敗しました");
    }
  };

  // CramSchoolDetailContent コンポーネント内に追加

  const handleDeleteRoom = async () => {
    if (!studyRoomId) {
      alert("削除する自習室を選択してください");
      return;
    }

    const selectedRoom = studyRooms.find(
      (room) => room.studyRoomId === studyRoomId
    );

    if (!selectedRoom) {
      alert("自習室が見つかりません");
      return;
    }

    // 確認ダイアログ
    const confirmMessage = `本当に「${selectedRoom.name}」を削除しますか？\n\nこの操作は取り消せません。`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await doDelete(`/api/studyRoom/${studyRoomId}`);

      setStudyRooms(
        studyRooms.filter((room) => room.studyRoomId !== studyRoomId)
      );
      setstudyRoomId(-1);
      alert("自習室を削除しました");
    } catch (error) {
      console.error("自習室の削除に失敗:", error);
      alert("自習室の削除に失敗しました");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-outline-secondary me-3"
                    onClick={() => router.back()}
                  >
                    ← 戻る
                  </button>
                  <h4 className="mb-0">{cramSchoolName} - 自習室管理</h4>
                </div>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleGoToStudentSetting}
                >
                  生徒管理
                </button>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-success"
                  onClick={() => setShowCreateModal(true)}
                >
                  <i className="fa fa-plus me-1"></i> 自習室を追加
                </button>
                <button
                  className="btn btn-info"
                  onClick={handlePrintQRCodes}
                  disabled={!studyRoomId}
                >
                  <i className="fa fa-qrcode me-1"></i> QR印刷
                </button>
                <button
                  className="btn btn-warning"
                  onClick={handleOpenEditModal}
                  disabled={!studyRoomId}
                >
                  <i className="fa fa-edit me-1"></i> 編集
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteRoom}
                  disabled={!studyRoomId}
                >
                  <i className="fa fa-trash me-1"></i> 削除
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleGoToRoom}
                  disabled={!studyRoomId}
                >
                  <i className="fa fa-cog me-1"></i> 詳細設定
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

export default function CramSchoolDetailPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <CramSchoolDetailContent />
    </Suspense>
  );
}
