import { useState, useEffect, useCallback } from 'react';
import type { CramSchool, StudentStatus, PageResponse } from '../../constant/types';
import { doGet, doPost } from '../../elfs/WebElf';
import {
    STUDENT_EMAIL_REGISTER_URL,
    SEND_REGISTRATION_REQUEST_URL,
    FETCH_STUDENT_STATUSES_OF_CRAMSCHOOL,
} from '../../constant/urls';

type Props = {
    cramSchool: CramSchool | null;
};

type EmailSuccessStatus = {
    successCount: number;
    failedStudent: string[];
};

const Students: React.FC<Props> = ({ cramSchool }) => {
    const [pageData, setPageData] = useState<PageResponse<StudentStatus> | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'attending' | 'problem' | 'unregistered'>(
        'all'
    );

    // チェックボックス用の状態
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailResult, setEmailResult] = useState<EmailSuccessStatus | null>(null);
    const [showEmailResultModal, setShowEmailResultModal] = useState(false);

    // メールアドレス登録モーダル用の状態
    const [selectedStudent, setSelectedStudent] = useState<StudentStatus | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        if (!cramSchool) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const url = `${FETCH_STUDENT_STATUSES_OF_CRAMSCHOOL}/${cramSchool.cramSchoolId}?page=${currentPage}&size=${pageSize}&sort=name&direction=ASC`;
            const data: PageResponse<StudentStatus> = await doGet(url);
            setPageData(data);
        } catch (e) {
            console.error('Failed to fetch students:', e);
            setError('生徒情報の取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, [cramSchool, currentPage, pageSize]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        setSelectedStudentIds(new Set());
    }, [currentPage]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(0);
    };

    const handleCheckboxChange = (studentId: number) => {
        setSelectedStudentIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const unregisteredStudents = filteredStudents.filter((s) => !s.isRegistered);
        if (selectedStudentIds.size === unregisteredStudents.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(unregisteredStudents.map((s) => s.studentId)));
        }
    };

    // 登録リンクメール送信
    const handleSendRegisterLink = async () => {
        if (selectedStudentIds.size === 0) {
            setError('生徒を選択してください');
            return;
        }

        const confirmed = window.confirm(
            `選択した${selectedStudentIds.size}名に登録案内メールを送信しますか？`
        );

        if (!confirmed) {
            return;
        }

        setIsSendingEmail(true);
        setShowEmailResultModal(true);
        setEmailResult(null);
        setError(null);

        try {
            const result: EmailSuccessStatus = await doPost(
                SEND_REGISTRATION_REQUEST_URL,
                Array.from(selectedStudentIds)
            );

            setEmailResult(result);
            setSelectedStudentIds(new Set());

            // リストを更新
            await fetchStudents();
        } catch (e) {
            console.error('Failed to send registration emails:', e);
            setEmailResult({
                successCount: 0,
                failedStudent: ['通信エラーが発生しました'],
            });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleCloseEmailResultModal = () => {
        setShowEmailResultModal(false);
        setEmailResult(null);
    };

    // メールアドレス編集モーダル
    const handleRowDoubleClick = (student: StudentStatus) => {
        setSelectedStudent(student);
        setNewEmail(student.mail || '');
        setModalError(null);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedStudent(null);
        setNewEmail('');
        setModalError(null);
    };

    const handleRegisterEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedStudent || !cramSchool) {
            return;
        }

        if (!newEmail.trim()) {
            setModalError('メールアドレスを入力してください');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            setModalError('有効なメールアドレスを入力してください');
            return;
        }

        setIsRegistering(true);
        setModalError(null);

        try {
            await doPost(STUDENT_EMAIL_REGISTER_URL, {
                studentId: selectedStudent.studentId,
                email: newEmail,
            });

            await fetchStudents();
            handleCloseEditModal();
        } catch (e) {
            console.error('Failed to register email:', e);
            setModalError('メールアドレスの登録に失敗しました');
        } finally {
            setIsRegistering(false);
        }
    };

    if (!cramSchool) {
        return <div className="alert alert-info">塾を選択してください</div>;
    }

    const students = pageData?.content || [];
    const totalPages = pageData?.totalPages || 0;
    const totalElements = pageData?.totalElements || 0;

    const filteredStudents = students.filter((student) => {
        switch (filterType) {
            case 'attending':
                return student.isAttending;
            case 'problem':
                return !student.valid;
            case 'unregistered':
                return !student.isRegistered;
            default:
                return true;
        }
    });

    const unregisteredCount = filteredStudents.filter((s) => !s.isRegistered).length;

    const getStatusBadge = (student: StudentStatus) => {
        if (!student.isRegistered) {
            return <span className="badge bg-secondary">未登録</span>;
        }
        if (!student.valid) {
            return <span className="badge bg-danger">要確認</span>;
        }
        if (student.isAttending) {
            return <span className="badge bg-success">出席中</span>;
        }
        if (student.shouldBeAttending) {
            return <span className="badge bg-warning text-dark">未出席</span>;
        }
        return <span className="badge bg-light text-dark">予約なし</span>;
    };

    const getRowClass = (student: StudentStatus) => {
        if (!student.isRegistered) return 'table-secondary';
        if (!student.valid) return 'table-danger';
        if (student.isAttending) return 'table-success';
        return '';
    };

    return (
        <div className="students">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>
                    {cramSchool.name} の生徒一覧
                    {!isLoading && <small className="text-muted ms-2">({totalElements}名)</small>}
                </h3>
                <button className="btn btn-primary" onClick={fetchStudents} disabled={isLoading}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    更新
                </button>
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

            {/* 一括メール送信バー */}
            {unregisteredCount > 0 && (
                <div className="card mb-3 border-primary">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-1">
                                    <i className="bi bi-envelope me-2"></i>
                                    登録案内メール一括送信
                                </h6>
                                <small className="text-muted">
                                    {selectedStudentIds.size > 0
                                        ? `${selectedStudentIds.size}名を選択中`
                                        : '未登録の生徒を選択してください'}
                                </small>
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={handleSelectAll}
                                    disabled={isSendingEmail}
                                >
                                    {selectedStudentIds.size === unregisteredCount
                                        ? '全解除'
                                        : '全選択'}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSendRegisterLink}
                                    disabled={selectedStudentIds.size === 0 || isSendingEmail}
                                >
                                    <i className="bi bi-send me-2"></i>
                                    メール送信
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* フィルター */}
            <div className="card mb-3">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="btn-group" role="group">
                                <input
                                    type="radio"
                                    className="btn-check"
                                    name="filter"
                                    id="filter-all"
                                    checked={filterType === 'all'}
                                    onChange={() => setFilterType('all')}
                                />
                                <label className="btn btn-outline-primary" htmlFor="filter-all">
                                    全て
                                </label>

                                <input
                                    type="radio"
                                    className="btn-check"
                                    name="filter"
                                    id="filter-attending"
                                    checked={filterType === 'attending'}
                                    onChange={() => setFilterType('attending')}
                                />
                                <label
                                    className="btn btn-outline-success"
                                    htmlFor="filter-attending"
                                >
                                    出席中
                                </label>

                                <input
                                    type="radio"
                                    className="btn-check"
                                    name="filter"
                                    id="filter-problem"
                                    checked={filterType === 'problem'}
                                    onChange={() => setFilterType('problem')}
                                />
                                <label className="btn btn-outline-danger" htmlFor="filter-problem">
                                    要確認
                                </label>

                                <input
                                    type="radio"
                                    className="btn-check"
                                    name="filter"
                                    id="filter-unregistered"
                                    checked={filterType === 'unregistered'}
                                    onChange={() => setFilterType('unregistered')}
                                />
                                <label
                                    className="btn btn-outline-secondary"
                                    htmlFor="filter-unregistered"
                                >
                                    未登録 ({unregisteredCount})
                                </label>
                            </div>
                        </div>
                        <div className="col-md-6 text-end">
                            <label className="me-2">表示件数:</label>
                            <select
                                className="form-select form-select-sm d-inline-block w-auto"
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            >
                                <option value="10">10名</option>
                                <option value="20">20名</option>
                                <option value="50">50名</option>
                                <option value="100">100名</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 凡例 */}
            <div className="alert alert-info mb-3">
                <div className="row small">
                    <div className="col-md-3">
                        <span className="badge bg-success me-2">出席中</span>
                        予約があり出席済み
                    </div>
                    <div className="col-md-3">
                        <span className="badge bg-warning text-dark me-2">未出席</span>
                        予約があるが未出席
                    </div>
                    <div className="col-md-3">
                        <span className="badge bg-danger me-2">要確認</span>
                        出席すべきだが未出席
                    </div>
                    <div className="col-md-3">
                        <span className="badge bg-secondary me-2">未登録</span>
                        システム未登録
                    </div>
                </div>
                <div className="mt-2 small">
                    <i className="bi bi-info-circle me-2"></i>
                    行をダブルクリックでメールアドレスを登録できます
                </div>
            </div>

            {/* 生徒リスト */}
            {isLoading ? (
                <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">読み込み中...</span>
                    </div>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="alert alert-warning">
                    <i className="bi bi-info-circle me-2"></i>
                    該当する生徒が見つかりませんでした
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>
                                        {unregisteredCount > 0 && (
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={
                                                    selectedStudentIds.size === unregisteredCount &&
                                                    unregisteredCount > 0
                                                }
                                                onChange={handleSelectAll}
                                            />
                                        )}
                                    </th>
                                    <th>名前</th>
                                    <th>学年</th>
                                    <th>メールアドレス</th>
                                    <th>状態</th>
                                    <th className="text-center">登録</th>
                                    <th className="text-center">予約</th>
                                    <th className="text-center">出席</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student, index) => (
                                    <tr
                                        key={index}
                                        className={getRowClass(student)}
                                        onDoubleClick={() => handleRowDoubleClick(student)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td onClick={(e) => e.stopPropagation()}>
                                            {!student.isRegistered && (
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selectedStudentIds.has(
                                                        student.studentId
                                                    )}
                                                    onChange={() =>
                                                        handleCheckboxChange(student.studentId)
                                                    }
                                                />
                                            )}
                                        </td>
                                        <td>
                                            <strong>{student.name}</strong>
                                        </td>
                                        <td>{student.gradeStr}</td>
                                        <td>
                                            <small className="text-muted">
                                                {student.mail || '未設定'}
                                            </small>
                                        </td>
                                        <td>{getStatusBadge(student)}</td>
                                        <td className="text-center">
                                            {student.isRegistered ? (
                                                <i className="bi bi-check-circle-fill text-success"></i>
                                            ) : (
                                                <i className="bi bi-x-circle-fill text-secondary"></i>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            {student.shouldBeAttending ? (
                                                <i className="bi bi-calendar-check-fill text-primary"></i>
                                            ) : (
                                                <i className="bi bi-dash text-muted"></i>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            {student.isAttending ? (
                                                <i className="bi bi-person-check-fill text-success"></i>
                                            ) : student.shouldBeAttending ? (
                                                <i className="bi bi-person-x-fill text-danger"></i>
                                            ) : (
                                                <i className="bi bi-dash text-muted"></i>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ページネーション */}
                    {totalPages > 1 && (
                        <nav aria-label="Page navigation">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 0}
                                    >
                                        前へ
                                    </button>
                                </li>

                                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                                    const page = currentPage < 5 ? i : currentPage - 5 + i;
                                    if (page >= totalPages) return null;
                                    return (
                                        <li
                                            key={page}
                                            className={`page-item ${currentPage === page ? 'active' : ''}`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page + 1}
                                            </button>
                                        </li>
                                    );
                                })}

                                <li
                                    className={`page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages - 1}
                                    >
                                        次へ
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}

            {/* メール送信結果モーダル */}
            {showEmailResultModal && (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {isSendingEmail ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                メール送信中...
                                            </>
                                        ) : emailResult ? (
                                            emailResult.failedStudent.length === 0 ? (
                                                <>
                                                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                    送信完了
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                                                    送信結果
                                                </>
                                            )
                                        ) : null}
                                    </h5>
                                    {!isSendingEmail && (
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={handleCloseEmailResultModal}
                                        ></button>
                                    )}
                                </div>
                                <div className="modal-body">
                                    {isSendingEmail ? (
                                        <div className="text-center py-4">
                                            <div
                                                className="spinner-border text-primary mb-3"
                                                style={{ width: '3rem', height: '3rem' }}
                                            >
                                                <span className="visually-hidden">送信中...</span>
                                            </div>
                                            <p className="text-muted">
                                                登録案内メールを送信しています...
                                            </p>
                                        </div>
                                    ) : emailResult ? (
                                        <>
                                            {/* 成功の表示 */}
                                            {emailResult.successCount > 0 && (
                                                <div className="alert alert-success d-flex align-items-center mb-3">
                                                    <i className="bi bi-check-circle-fill fs-4 me-3"></i>
                                                    <div>
                                                        <strong>
                                                            {emailResult.successCount}名
                                                        </strong>
                                                        に送信成功しました
                                                    </div>
                                                </div>
                                            )}

                                            {/* 失敗の表示 */}
                                            {emailResult.failedStudent.length > 0 && (
                                                <div className="alert alert-danger">
                                                    <div className="d-flex align-items-start mb-2">
                                                        <i className="bi bi-x-circle-fill fs-4 me-3"></i>
                                                        <div>
                                                            <strong>
                                                                {emailResult.failedStudent.length}名
                                                            </strong>
                                                            への送信に失敗しました
                                                        </div>
                                                    </div>
                                                    <hr />
                                                    <ul className="mb-0">
                                                        {emailResult.failedStudent.map(
                                                            (name, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="text-danger"
                                                                >
                                                                    <i className="bi bi-x me-2"></i>
                                                                    {name}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* 全て失敗した場合 */}
                                            {emailResult.successCount === 0 &&
                                                emailResult.failedStudent.length > 0 && (
                                                    <p className="text-muted mb-0">
                                                        メールアドレスが未設定、または無効な可能性があります。
                                                    </p>
                                                )}
                                        </>
                                    ) : null}
                                </div>
                                {!isSendingEmail && (
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleCloseEmailResultModal}
                                        >
                                            閉じる
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {!isSendingEmail && (
                        <div
                            className="modal-backdrop fade show"
                            onClick={handleCloseEmailResultModal}
                        ></div>
                    )}
                </>
            )}

            {/* メールアドレス登録モーダル */}
            {showEditModal && selectedStudent && (
                <>
                    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        メールアドレス登録 - {selectedStudent.name}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={handleCloseEditModal}
                                        disabled={isRegistering}
                                    ></button>
                                </div>
                                <form onSubmit={handleRegisterEmail}>
                                    <div className="modal-body">
                                        {modalError && (
                                            <div className="alert alert-danger">{modalError}</div>
                                        )}

                                        <div className="mb-3">
                                            <label className="form-label">生徒名</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={selectedStudent.name}
                                                disabled
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">学年</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={selectedStudent.gradeStr}
                                                disabled
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="emailInput" className="form-label">
                                                メールアドレス{' '}
                                                <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="emailInput"
                                                className="form-control"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                placeholder="example@email.com"
                                                required
                                                disabled={isRegistering}
                                                autoFocus
                                            />
                                            <div className="form-text">
                                                このメールアドレスに登録情報が送信されます
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCloseEditModal}
                                            disabled={isRegistering}
                                        >
                                            キャンセル
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isRegistering}
                                        >
                                            {isRegistering ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    登録中...
                                                </>
                                            ) : (
                                                '登録'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={handleCloseEditModal}></div>
                </>
            )}
        </div>
    );
};

export default Students;
