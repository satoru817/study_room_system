import { useState, useEffect, type SetStateAction, type Dispatch, useCallback } from 'react';
import type { CramSchool, StudyRoom, StudyRoomCreateRequest } from '../../constant/types';
import { doGet, doPost, doDelete } from '../../elfs/WebElf';
import { FETCH_STUDY_ROOMS_URL, STUDY_ROOM_BASE_URL } from '../../constant/urls';
import { Spinner } from 'react-bootstrap';
import { BiTrash } from 'react-icons/bi';
import StudyRoomQRCode from './StudyRoomQRCode.tsx';

type Props = {
    cramSchool: CramSchool | null;
    setStudyRoom: Dispatch<SetStateAction<StudyRoom | null>>;
};

const StudyRooms: React.FC<Props> = ({ cramSchool, setStudyRoom }) => {
    const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 新規作成用の状態
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomLimit, setNewRoomLimit] = useState<number>(30);
    const [isCreating, setIsCreating] = useState(false);

    // 削除用の状態
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchStudyRooms = useCallback(async () => {
        if (!cramSchool) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const url = `${FETCH_STUDY_ROOMS_URL}/${cramSchool.cramSchoolId}`;
            const data = await doGet(url);
            setStudyRooms(data);
        } catch (e) {
            console.error('Failed to fetch study rooms:', e);
            setError('自習室情報の取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, [cramSchool]);

    useEffect(() => {
        fetchStudyRooms();
    }, [fetchStudyRooms]);

    const handleSelectRoom = (studyRoomId: number) => {
        setSelectedRoomId(studyRoomId);
        const selected = studyRooms.find((room) => room.studyRoomId === studyRoomId);
        if (selected) {
            setStudyRoom(selected);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newRoomName.trim()) {
            setError('自習室名を入力してください');
            return;
        }

        if (newRoomLimit < 1) {
            setError('定員は1名以上で設定してください');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const url = `/api/studyRoom/create/${cramSchool && cramSchool.cramSchoolId}`;
            const request: StudyRoomCreateRequest = {
                name: newRoomName,
                limit: newRoomLimit,
            };

            const createdRoom = await doPost(url, request);

            setStudyRooms([...studyRooms, createdRoom]);
            setSelectedRoomId(createdRoom.studyRoomId);
            setStudyRoom(createdRoom);

            setNewRoomName('');
            setNewRoomLimit(30);
            setShowCreateForm(false);
        } catch (e) {
            console.error('Failed to create study room:', e);
            setError('自習室の作成に失敗しました');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteSelectedRoom = async () => {
        if (!selectedRoomId) return;

        const selectedRoom = studyRooms.find((room) => room.studyRoomId === selectedRoomId);
        if (!selectedRoom) return;

        // 確認ダイアログ
        if (
            !window.confirm(
                `「${selectedRoom.name}」を削除してもよろしいですか？\nこの操作は取り消せません。`
            )
        ) {
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            const url = `${STUDY_ROOM_BASE_URL}/${selectedRoomId}`;
            await doDelete(url);

            // リストから削除
            setStudyRooms(studyRooms.filter((room) => room.studyRoomId !== selectedRoomId));

            // 選択をクリア
            setSelectedRoomId(null);
            setStudyRoom(null);
        } catch (e) {
            console.error('Failed to delete study room:', e);
            setError('自習室の削除に失敗しました');
        } finally {
            setIsDeleting(false);
        }
    };

    // 選択中の自習室を取得
    const selectedRoom = studyRooms.find((room) => room.studyRoomId === selectedRoomId);

    if (!cramSchool) {
        return <div className="alert alert-info">塾を選択してください</div>;
    }

    return (
        <div className="study-rooms">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>{cramSchool.name} の自習室一覧</h3>
                <div className="d-flex gap-2">
                    {selectedRoomId && (
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteSelectedRoom}
                            disabled={!selectedRoomId || isDeleting || isLoading}
                        >
                            {isDeleting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    削除中...
                                </>
                            ) : (
                                <>
                                    <BiTrash className="me-2" style={{ fontSize: '1rem' }} />
                                    選択中の自習室を削除
                                </>
                            )}
                        </button>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        disabled={isLoading || isCreating}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        新規作成
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError(null)}
                    ></button>
                </div>
            )}

            {/* 新規作成フォーム */}
            {showCreateForm && (
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="card-title">新しい自習室を作成</h5>
                        <form onSubmit={handleCreateRoom}>
                            <div className="mb-3">
                                <label htmlFor="roomName" className="form-label">
                                    自習室名 <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="roomName"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder="例: A室"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="roomLimit" className="form-label">
                                    定員 <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="roomLimit"
                                    value={newRoomLimit}
                                    onChange={(e) => setNewRoomLimit(parseInt(e.target.value))}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            作成中...
                                        </>
                                    ) : (
                                        '作成'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setNewRoomName('');
                                        setNewRoomLimit(30);
                                    }}
                                    disabled={isCreating}
                                >
                                    キャンセル
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 自習室リスト */}
            {isLoading ? (
                <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">読み込み中...</span>
                    </div>
                </div>
            ) : studyRooms.length === 0 ? (
                <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    まだ自習室が登録されていません。上の「新規作成」ボタンから作成してください。
                </div>
            ) : (
                <div className="row">
                    {studyRooms.map((room) => (
                        <div key={room.studyRoomId} className="col-md-6 col-lg-4 mb-3">
                            <div
                                className={`card ${
                                    selectedRoomId === room.studyRoomId ? 'border-primary' : ''
                                }`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSelectRoom(room.studyRoomId)}
                            >
                                <div className="card-body">
                                    <h5 className="card-title">{room.name}</h5>
                                    <p className="card-text">
                                        <i className="bi bi-people-fill me-2"></i>
                                        定員: {room.roomLimit}名
                                    </p>
                                    {selectedRoomId === room.studyRoomId && (
                                        <span className="badge bg-primary">選択中</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* QRコード表示エリア（選択中の自習室がある場合のみ） */}
            {selectedRoom && (
                <div className="mt-4">
                    <StudyRoomQRCode studyRoom={selectedRoom} />
                </div>
            )}
        </div>
    );
};

export default StudyRooms;
