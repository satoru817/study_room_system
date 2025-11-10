"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { doGet, doPost } from "../../../elfs/WebserviceElf.js";
import { useSearchParams } from "next/navigation";
// TODO: add name, grade filtering...
const Students = () => {
  const searchParams = useSearchParams();
  const cramSchoolId = searchParams.get("cramSchoolId");
  const cramSchoolName = searchParams.get("cramSchoolName");
  const [pageData, setPageData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");

  // チェックボックス用の状態
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [showEmailResultModal, setShowEmailResultModal] = useState(false);

  // メールアドレス登録モーダル用の状態
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/student/getStatuses/${cramSchoolId}?page=${currentPage}&size=${pageSize}&sort=el1&direction=DESC`;
      const data = await doGet(url);
      setPageData(data);
    } catch (e) {
      console.error("Failed to fetch students:", e);
      setError("生徒情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [cramSchoolId, currentPage, pageSize]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setSelectedStudentIds(new Set());
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const handleCheckboxChange = (studentId) => {
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
    const unregisteredStudents = filteredStudents.filter(
      (s) => !s.isRegistered
    );
    if (selectedStudentIds.size === unregisteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(
        new Set(unregisteredStudents.map((s) => s.studentId))
      );
    }
  };

  // 登録リンクメール送信
  const handleSendRegisterLink = async () => {
    if (selectedStudentIds.size === 0) {
      setError("生徒を選択してください");
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
      const result = await doPost(
        "/api/student/send-register-link",
        Array.from(selectedStudentIds)
      );

      setEmailResult(result);
      setSelectedStudentIds(new Set());

      // リストを更新
      await fetchStudents();
    } catch (e) {
      console.error("Failed to send registration emails:", e);
      setEmailResult({
        successCount: 0,
        failedStudent: ["通信エラーが発生しました"],
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
  const handleRowDoubleClick = (student) => {
    setSelectedStudent(student);
    setNewEmail(student.mail || "");
    setModalError(null);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedStudent(null);
    setNewEmail("");
    setModalError(null);
  };

  const handleRegisterEmail = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      return;
    }

    if (!newEmail.trim()) {
      setModalError("メールアドレスを入力してください");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setModalError("有効なメールアドレスを入力してください");
      return;
    }

    setIsRegistering(true);
    setModalError(null);

    try {
      await doPost("/api/student/register-email", {
        studentId: selectedStudent.studentId,
        email: newEmail,
      });

      await fetchStudents();
      handleCloseEditModal();
    } catch (e) {
      console.error("Failed to register email:", e);
      setModalError("メールアドレスの登録に失敗しました");
    } finally {
      setIsRegistering(false);
    }
  };

  const students = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;

  const filteredStudents = students.filter((student) => {
    switch (filterType) {
      case "attending":
        return student.isAttending;
      case "problem":
        return !student.valid;
      case "unregistered":
        return !student.isRegistered;
      default:
        return true;
    }
  });

  const unregisteredCount = filteredStudents.filter(
    (s) => !s.isRegistered
  ).length;

  const getStatusBadge = (student) => {
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

  const getRowClass = (student) => {
    if (!student.isRegistered) return "table-secondary";
    if (!student.valid) return "table-danger";
    if (student.isAttending) return "table-success";
    return "";
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1400px" }}>
      {/* ヘッダー */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="bi bi-people-fill me-2 text-primary"></i>
                {cramSchoolName}
              </h2>
              {!isLoading && (
                <p className="text-muted mb-0">
                  <small>全{totalElements}名の生徒</small>
                </p>
              )}
            </div>
            <button
              className="btn btn-outline-primary"
              onClick={fetchStudents}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              {isLoading ? "更新中..." : "更新"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="row mb-3">
          <div className="col">
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* 一括メール送信バー */}
      {unregisteredCount > 0 && (
        <div className="row mb-3">
          <div className="col">
            <div className="card border-primary shadow-sm">
              <div className="card-body py-3">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h6 className="mb-1 fw-bold">
                      <i className="bi bi-envelope-fill me-2 text-primary"></i>
                      登録案内メール一括送信
                    </h6>
                    <small className="text-muted">
                      {selectedStudentIds.size > 0
                        ? `${selectedStudentIds.size}名を選択中`
                        : "未登録の生徒を選択してください"}
                    </small>
                  </div>
                  <div className="col-md-6 text-md-end mt-2 mt-md-0">
                    <button
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={handleSelectAll}
                      disabled={isSendingEmail}
                    >
                      {selectedStudentIds.size === unregisteredCount
                        ? "全解除"
                        : "全選択"}
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSendRegisterLink}
                      disabled={selectedStudentIds.size === 0 || isSendingEmail}
                    >
                      <i className="bi bi-send-fill me-1"></i>
                      メール送信
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* フィルターと表示件数 */}
      <div className="row mb-3">
        <div className="col">
          <div className="card shadow-sm">
            <div className="card-body py-3">
              <div className="row align-items-center g-3">
                <div className="col-lg-8">
                  <div className="btn-group w-100" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="filter"
                      id="filter-all"
                      checked={filterType === "all"}
                      onChange={() => setFilterType("all")}
                    />
                    <label
                      className="btn btn-outline-primary"
                      htmlFor="filter-all"
                    >
                      <i className="bi bi-list-ul me-1"></i>
                      全て
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="filter"
                      id="filter-attending"
                      checked={filterType === "attending"}
                      onChange={() => setFilterType("attending")}
                    />
                    <label
                      className="btn btn-outline-success"
                      htmlFor="filter-attending"
                    >
                      <i className="bi bi-check-circle me-1"></i>
                      出席中
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="filter"
                      id="filter-problem"
                      checked={filterType === "problem"}
                      onChange={() => setFilterType("problem")}
                    />
                    <label
                      className="btn btn-outline-danger"
                      htmlFor="filter-problem"
                    >
                      <i className="bi bi-exclamation-circle me-1"></i>
                      要確認
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="filter"
                      id="filter-unregistered"
                      checked={filterType === "unregistered"}
                      onChange={() => setFilterType("unregistered")}
                    />
                    <label
                      className="btn btn-outline-secondary"
                      htmlFor="filter-unregistered"
                    >
                      <i className="bi bi-person-x me-1"></i>
                      未登録 ({unregisteredCount})
                    </label>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="d-flex align-items-center justify-content-lg-end">
                    <label className="me-2 text-nowrap small">表示件数:</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "auto" }}
                      value={pageSize}
                      onChange={(e) =>
                        handlePageSizeChange(Number(e.target.value))
                      }
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
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="row mb-3">
        <div className="col">
          <div className="alert alert-info mb-0 py-2">
            <div className="row g-2 small">
              <div className="col-6 col-md-3">
                <span className="badge bg-success me-1">出席中</span>
                予約あり・出席済
              </div>
              <div className="col-6 col-md-3">
                <span className="badge bg-warning text-dark me-1">未出席</span>
                予約あり・未出席
              </div>
              <div className="col-6 col-md-3">
                <span className="badge bg-danger me-1">要確認</span>
                出席すべきだが未出席
              </div>
              <div className="col-6 col-md-3">
                <span className="badge bg-secondary me-1">未登録</span>
                システム未登録
              </div>
            </div>
            <hr className="my-2" />
            <p className="mb-0 small">
              <i className="bi bi-info-circle me-1"></i>
              行をダブルクリックでメールアドレスを登録できます
            </p>
          </div>
        </div>
      </div>

      {/* 生徒リスト */}
      <div className="row">
        <div className="col">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">読み込み中...</span>
              </div>
              <p className="text-muted mt-2">生徒情報を読み込んでいます...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="alert alert-warning text-center py-4">
              <i className="bi bi-info-circle fs-3 d-block mb-2"></i>
              該当する生徒が見つかりませんでした
            </div>
          ) : (
            <>
              <div className="card shadow-sm">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "40px" }}>
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
                        <th style={{ width: "180px" }}>名前</th>
                        <th style={{ width: "100px" }}>学年</th>
                        <th>メールアドレス</th>
                        <th style={{ width: "100px" }}>状態</th>
                        <th className="text-center" style={{ width: "60px" }}>
                          登録
                        </th>
                        <th className="text-center" style={{ width: "60px" }}>
                          予約
                        </th>
                        <th className="text-center" style={{ width: "60px" }}>
                          出席
                        </th>
                        <th className="text-center" style={{ width: "100px" }}>
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr
                          key={index}
                          className={getRowClass(student)}
                          onDoubleClick={() => handleRowDoubleClick(student)}
                          style={{ cursor: "pointer" }}
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
                          <td>
                            <small className="text-muted">
                              {student.gradeStr}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {student.mail || (
                                <span className="text-danger">未設定</span>
                              )}
                            </small>
                          </td>
                          <td>{getStatusBadge(student)}</td>
                          <td className="text-center">
                            {student.isRegistered ? (
                              <i className="bi bi-check-circle-fill text-success fs-5"></i>
                            ) : (
                              <i className="bi bi-x-circle-fill text-secondary fs-5"></i>
                            )}
                          </td>
                          <td className="text-center">
                            {student.shouldBeAttending ? (
                              <i className="bi bi-calendar-check-fill text-primary fs-5"></i>
                            ) : (
                              <i className="bi bi-dash text-muted"></i>
                            )}
                          </td>
                          <td className="text-center">
                            {student.isAttending ? (
                              <i className="bi bi-person-check-fill text-success fs-5"></i>
                            ) : student.shouldBeAttending ? (
                              <i className="bi bi-person-x-fill text-danger fs-5"></i>
                            ) : (
                              <i className="bi bi-dash text-muted"></i>
                            )}
                          </td>
                          <td
                            className="text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={`/student-dashboard?studentId=${student.studentId}`}
                              className="btn btn-sm btn-outline-primary"
                              title="生徒用ダッシュボードを表示"
                            >
                              <i className="bi bi-speedometer2"></i>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <nav aria-label="Page navigation" className="mt-3">
                  <ul className="pagination justify-content-center mb-0">
                    {/* Prev */}
                    <li
                      className={`page-item ${
                        currentPage === 0 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        disabled={currentPage === 0}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>

                    {/* Page Numbers */}
                    {Array.from(
                      { length: Math.min(totalPages, 10) },
                      (_, i) => {
                        const page = currentPage < 5 ? i : currentPage - 5 + i;
                        if (page >= totalPages) return null;

                        return (
                          <li
                            key={page}
                            className={`page-item ${
                              currentPage === page ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(page)}
                            >
                              {page + 1}
                            </button>
                          </li>
                        );
                      }
                    )}

                    {/* Next */}
                    <li
                      className={`page-item ${
                        currentPage === totalPages - 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        disabled={currentPage === totalPages - 1}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* メール送信結果モーダル */}
      {showEmailResultModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
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
                        style={{ width: "3rem", height: "3rem" }}
                      >
                        <span className="visually-hidden">送信中...</span>
                      </div>
                      <p className="text-muted">
                        登録案内メールを送信しています...
                      </p>
                    </div>
                  ) : emailResult ? (
                    <>
                      {emailResult.successCount > 0 && (
                        <div className="alert alert-success d-flex align-items-center mb-3">
                          <i className="bi bi-check-circle-fill fs-4 me-3"></i>
                          <div>
                            <strong>{emailResult.successCount}名</strong>
                            に送信成功しました
                          </div>
                        </div>
                      )}

                      {emailResult.failedStudent.length > 0 && (
                        <div className="alert alert-danger mb-0">
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
                          <ul className="mb-0 ps-3">
                            {emailResult.failedStudent.map((name, index) => (
                              <li key={index} className="text-danger">
                                {name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {emailResult.successCount === 0 &&
                        emailResult.failedStudent.length > 0 && (
                          <p className="text-muted mb-0 mt-2">
                            メールアドレスが未設定、または無効な可能性があります。
                          </p>
                        )}
                    </>
                  ) : null}
                </div>
                {!isSendingEmail && (
                  <div className="modal-footer border-0">
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
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title">
                    <i className="bi bi-envelope-at me-2"></i>
                    メールアドレス登録
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
                      <div className="alert alert-danger">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {modalError}
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label fw-bold small">生徒名</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedStudent.name}
                        disabled
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold small">学年</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedStudent.gradeStr}
                        disabled
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="emailInput"
                        className="form-label fw-bold"
                      >
                        メールアドレス <span className="text-danger">*</span>
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
                        <i className="bi bi-info-circle me-1"></i>
                        このメールアドレスに登録情報が送信されます
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-0">
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
                        <>
                          <i className="bi bi-check-lg me-1"></i>
                          登録
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            onClick={handleCloseEditModal}
          ></div>
        </>
      )}
    </div>
  );
};

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">読み込み中...</span>
          </div>
        </div>
      }
    >
      <Students />
    </Suspense>
  );
}
