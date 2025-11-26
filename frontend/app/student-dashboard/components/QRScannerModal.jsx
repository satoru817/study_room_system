"use client";

export default function QRScannerModal({
  isOpen,
  scannedData,
  actionType,
  onClose,
  onSubmit,
  onRescan,
  scannerRef,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">
            QRコードをスキャン
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {!scannedData ? (
          <div>
            <div id="qr-reader" ref={scannerRef} className="mb-4"></div>
            <p className="text-center text-gray-600 text-sm">
              カメラでQRコードをスキャンしてください
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {actionType === "checkin" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-6 h-6 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-800">
                    入室確認
                  </h3>
                </div>
                <div className="text-gray-700">
                  <p>自習室: {scannedData.roomName}</p>
                  <p>座席番号: {scannedData.seatNumber}</p>
                </div>
              </div>
            )}

            {actionType === "checkout" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <svg
                    className="w-6 h-6 text-blue-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16l-4-4m0 0l4-4m-4 4h18"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-blue-800">
                    退室確認
                  </h3>
                </div>
                <div className="text-gray-700">
                  <p>自習室: {scannedData.roomName}</p>
                  <p>座席番号: {scannedData.seatNumber}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onSubmit}
                className={`flex-1 ${
                  actionType === "checkin"
                    ? "bg-green-600 active:bg-green-700"
                    : "bg-blue-600 active:bg-blue-700"
                } text-white font-semibold py-3 px-6 rounded-full transition duration-200`}
              >
                {actionType === "checkin" ? "入室を記録" : "退室を記録"}
              </button>
              <button
                onClick={onRescan}
                className="flex-1 bg-gray-300 active:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-full transition duration-200"
              >
                再スキャン
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
