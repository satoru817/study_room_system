"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import { doGet, doPost, doLogout } from "../elfs/WebserviceElf";
import { Html5QrcodeScanner } from "html5-qrcode";
import DashboardHeader from "./components/DashboardHeader";
import ReservationList from "./components/ReservationList";
import StudyTimeChart from "./components/StudyTimeChart";
import QRScannerModal from "./components/QRScannerModal";

function StudentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const [studentName, setStudentName] = useState(null);
  const [todaysReservations, setTodaysReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isValidTime, setIsValidTime] = useState(false);
  const [qrButtonState, setQrButtonState] = useState(null);
  const scannerRef = useRef(null);
  const qrScannerInstanceRef = useRef(null);

  const handleLogout = async () => {
    try {
      await doLogout();
      router.push("/user-login");
    } catch (error) {
      console.error("ログアウトに失敗:", error);
      alert("ログアウトに失敗しました");
    }
  };

  const determineAction = (reservation) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const startParts = reservation.startHour.split(":");
    const endParts = reservation.endHour.split(":");

    const startTimeInMinutes =
      parseInt(startParts[0]) * 60 + parseInt(startParts[1]);

    const endTimeInMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

    if (reservation.hasCheckedIn && !reservation.hasCheckedOut) {
      const checkoutDeadline = endTimeInMinutes + 30;
      if (currentTimeInMinutes <= checkoutDeadline) {
        return "checkout";
      }
    }

    if (!reservation.hasCheckedIn) {
      const validStartTime = startTimeInMinutes - 5;
      const validEndTime = endTimeInMinutes - 5;

      if (
        currentTimeInMinutes >= validStartTime &&
        currentTimeInMinutes <= validEndTime
      ) {
        return "checkin";
      }
    }

    return null;
  };

  const getQRButtonState = () => {
    if (!todaysReservations || todaysReservations.length === 0) {
      return null;
    }

    for (const reservation of todaysReservations) {
      const action = determineAction(reservation);
      if (action === "checkout") {
        return "checkout";
      }
      if (action === "checkin") {
        return "checkin";
      }
    }

    return null;
  };

  useEffect(() => {
    const fetchStudentName = async () => {
      const _studentName = await doGet(`/api/student/get/${studentId}`);
      setStudentName(_studentName);
    };
    fetchStudentName();
  }, [studentId]);

  useEffect(() => {
    const fetchTodaysReservations = async () => {
      try {
        const reservationsOfThisStudent = await doGet(
          `/api/reservation/getTodays/${studentId}`
        );

        if (Array.isArray(reservationsOfThisStudent)) {
          setTodaysReservations(reservationsOfThisStudent);
        } else {
          console.error(
            "予約データが配列ではありません:",
            reservationsOfThisStudent
          );
          setTodaysReservations([]);
        }
      } catch (error) {
        console.error("予約の取得に失敗しました:", error);
        setTodaysReservations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysReservations();
  }, [studentId]);

  useEffect(() => {
    const checkValidTime = () => {
      const buttonState = getQRButtonState();
      setQrButtonState(buttonState);
      setIsValidTime(buttonState !== null);
    };

    checkValidTime();
    const interval = setInterval(checkValidTime, 60000);

    return () => clearInterval(interval);
  }, [todaysReservations, getQRButtonState]);

  useEffect(() => {
    return () => {
      if (qrScannerInstanceRef.current) {
        qrScannerInstanceRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const handleBookReservation = () => {
    router.push(
      `/student-dashboard/book?studentId=${encodeURIComponent(studentId)}`
    );
  };

  const handleOpenQRScanner = () => {
    if (!isValidTime) {
      alert("QRコードスキャンは予約時間内のみ利用可能です");
      return;
    }
    setShowQRScanner(true);
    setScannedData(null);
    setActionType(null);
  };

  const handleCloseQRScanner = () => {
    if (qrScannerInstanceRef.current) {
      qrScannerInstanceRef.current.clear().catch(console.error);
      qrScannerInstanceRef.current = null;
    }
    setShowQRScanner(false);
    setQrScannerActive(false);
    setActionType(null);
  };

  const startScanner = () => {
    if (qrScannerActive || !scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText, decodedResult) => {
        try {
          const qrData = JSON.parse(decodedText);

          const currentReservation = todaysReservations.find((reservation) => {
            return reservation.studyRoomId === qrData.studyRoomId;
          });

          if (!currentReservation) {
            alert("この自習室の予約が見つかりません");
            return;
          }

          const action = determineAction(currentReservation);

          if (action === null) {
            alert("現在、入室・退室できる時間ではありません");
            return;
          }

          setScannedData(qrData);
          setActionType(action);
          scanner.clear();
          setQrScannerActive(false);
          qrScannerInstanceRef.current = null;
        } catch (error) {
          console.error("QRコードの解析に失敗:", error);
          alert("無効なQRコードです");
        }
      },
      (errorMessage) => {
        // スキャン中のエラーは無視
      }
    );

    qrScannerInstanceRef.current = scanner;
    setQrScannerActive(true);
  };

  useEffect(() => {
    if (showQRScanner && !qrScannerActive) {
      setTimeout(() => {
        startScanner();
      }, 100);
    }
  }, [showQRScanner, qrScannerActive]);

  const handleSubmitAttendance = async () => {
    if (!scannedData || !actionType) {
      alert("QRコードをスキャンしてください");
      return;
    }

    try {
      if (actionType === "checkin") {
        await doPost(`/api/attendance/record/${studentId}`, {
          studyRoomId: scannedData.studyRoomId,
        });
        alert("入室を記録しました！");
      } else if (actionType === "checkout") {
        await doPost(`/api/attendance/checkout/${studentId}`, {
          studyRoomId: scannedData.studyRoomId,
        });
        alert("退室を記録しました！");
      }

      handleCloseQRScanner();

      const updatedReservations = await doGet(
        `/api/reservation/getTodays/${studentId}`
      );
      setTodaysReservations(updatedReservations);
    } catch (error) {
      console.error("記録に失敗:", error);
      alert("記録に失敗しました");
    }
  };

  const handleRescan = () => {
    setScannedData(null);
    setActionType(null);
    setTimeout(() => startScanner(), 100);
  };

  if (loading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <DashboardHeader
        studentName={studentName}
        isValidTime={isValidTime}
        qrButtonState={qrButtonState}
        onOpenQRScanner={handleOpenQRScanner}
        onBookReservation={handleBookReservation}
        onLogout={handleLogout}
      />

      <ReservationList
        reservations={todaysReservations}
        onBookReservation={handleBookReservation}
      />

      <div className="max-w-4xl mx-auto">
        <StudyTimeChart studentId={studentId} />
      </div>

      <QRScannerModal
        isOpen={showQRScanner}
        scannedData={scannedData}
        actionType={actionType}
        onClose={handleCloseQRScanner}
        onSubmit={handleSubmitAttendance}
        onRescan={handleRescan}
        scannerRef={scannerRef}
      />
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="p-6">読み込み中...</div>}>
      <StudentContent />
    </Suspense>
  );
}
