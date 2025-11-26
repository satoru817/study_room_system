"use client";

export default function ReservationList({
  reservations,
  onBookReservation,
}) {
  if (!reservations || reservations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-600 text-lg mb-4">今日の予約はありません</p>
          <button
            onClick={onBookReservation}
            className="bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-200"
          >
            予約を作成する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mb-6">
      <div className="space-y-4">
        {reservations.map((reservation, index) => {
          let statusColor = "border-blue-500";
          let statusBadge = {
            text: "予約済み",
            bgColor: "bg-blue-100",
            textColor: "text-blue-800",
          };

          if (reservation.hasCheckedOut) {
            statusColor = "border-gray-400";
            statusBadge = {
              text: "退室済み",
              bgColor: "bg-gray-100",
              textColor: "text-gray-800",
            };
          } else if (reservation.hasCheckedIn) {
            statusColor = "border-green-500";
            statusBadge = {
              text: "入室中",
              bgColor: "bg-green-100",
              textColor: "text-green-800",
            };
          }

          return (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${statusColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {reservation.studyRoomName}
                  </h3>
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-lg">
                      {reservation.startHour} - {reservation.endHour}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2 text-sm">
                    {reservation.hasCheckedIn && (
                      <div className="flex items-center text-green-600">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        入室済み
                      </div>
                    )}
                    {reservation.hasCheckedOut && (
                      <div className="flex items-center text-gray-600">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        退室済み
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 ${statusBadge.bgColor} ${statusBadge.textColor} rounded-full text-sm font-medium`}
                  >
                    {statusBadge.text}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
