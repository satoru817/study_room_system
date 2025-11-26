"use client";

/**
 * Reusable time slot grid component for dragging to select/deselect time slots
 * Used by both regular schedule and exception schedule
 */
export default function TimeSlotGrid({
  weekSchedule, // Array of day objects, each with slots array
  onMouseDown,
  onMouseEnter,
  onTouchStart,
  singleColumn = false, // If true, shows single column layout (for exception modal)
}) {
  if (singleColumn && weekSchedule.length > 0) {
    // Single column layout for exception modal
    const dayData = weekSchedule[0];
    return (
      <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
        <table
          className="table table-bordered text-center"
          style={{ userSelect: "none" }}
        >
          <tbody>
            {/* 7:00から23:00まで = 17時間 (23:30までの最後のスロットを含む) */}
            {Array.from({ length: 17 }, (_, index) => {
              const hour = index + 7;
              return (
                <tr key={hour}>
                  <td
                    className="align-middle fw-bold"
                    style={{
                      backgroundColor: "#f8f9fa",
                      width: "80px",
                    }}
                  >
                    {hour.toString().padStart(2, "0")}:00
                  </td>
                  <td style={{ padding: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {[0, 15, 30, 45].map((minute) => {
                        // 23:45は表示しない
                        if (hour === 23 && minute === 45)
                          return (
                            <div
                              key={`${hour}-${minute}`}
                              style={{
                                height: "10px",
                                backgroundColor: "gray",
                                borderTop: "1px dashed #e0e0e0",
                              }}
                            />
                          );

                        const slotIndex = (hour - 7) * 4 + minute / 15;
                        const slot = dayData.slots[slotIndex];
                        const isHourStart = minute === 0;
                        return (
                          <div
                            key={`${hour}-${minute}`}
                            data-slot={`0_${slotIndex}`}
                            onMouseDown={() => onMouseDown(0, slotIndex)}
                            onMouseEnter={() => onMouseEnter(0, slotIndex)}
                            onTouchStart={(e) => onTouchStart && onTouchStart(e, 0, slotIndex)}
                            style={{
                              height: "10px",
                              backgroundColor: slot?.isOpen
                                ? "#d4edda"
                                : "white",
                              borderTop: isHourStart
                                ? "3px solid #28a745"
                                : "1px dashed #e0e0e0",
                              cursor: "pointer",
                              transition: "background-color 0.1s",
                              touchAction: "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Multi-column layout for weekly schedule
  return (
    <div className="table-responsive">
      <table
        className="table table-bordered text-center mb-0"
        style={{ userSelect: "none", fontSize: "0.75rem" }}
      >
        <thead>
          <tr>
            <th style={{ width: "60px" }}>時/曜</th>
            {weekSchedule.map((day) => (
              <th
                key={day.dayOfWeek}
                style={{
                  backgroundColor:
                    day.dayLabel === "土"
                      ? "#e3f2fd"
                      : day.dayLabel === "日"
                      ? "#ffe0e0"
                      : "white",
                }}
              >
                {day.dayLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 7:00から23:00まで = 17時間 (23:30までの最後のスロットを含む) */}
          {Array.from({ length: 17 }, (_, index) => {
            const hour = index + 7;
            return (
              <tr key={hour}>
                <td
                  className="align-middle fw-bold"
                  style={{
                    backgroundColor: "#f8f9fa",
                    fontSize: "0.7rem",
                  }}
                >
                  {hour.toString().padStart(2, "0")}:00
                </td>
                {weekSchedule.map((day, dayIndex) => (
                  <td key={day.dayOfWeek} style={{ padding: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {[0, 15, 30, 45].map((minute) => {
                        // 23:45は表示しない
                        if (hour === 23 && minute === 45)
                          return (
                            <div
                              key={`${hour}-${minute}`}
                              style={{
                                height: "8px",
                                backgroundColor: "gray",
                                borderTop: "1px dashed #e0e0e0",
                              }}
                            />
                          );

                        const slotIndex = (hour - 7) * 4 + minute / 15;
                        const slot = day.slots[slotIndex];
                        const isHourStart = minute === 0;
                        return (
                          <div
                            key={`${hour}-${minute}`}
                            data-slot={`${dayIndex}_${slotIndex}`}
                            onMouseDown={() => onMouseDown(dayIndex, slotIndex)}
                            onMouseEnter={() =>
                              onMouseEnter(dayIndex, slotIndex)
                            }
                            onTouchStart={(e) => onTouchStart && onTouchStart(e, dayIndex, slotIndex)}
                            style={{
                              height: "8px",
                              backgroundColor: slot?.isOpen
                                ? "#d4edda"
                                : "white",
                              borderTop: isHourStart
                                ? "3px solid #28a745"
                                : "1px dashed #e0e0e0",
                              cursor: "pointer",
                              transition: "background-color 0.1s",
                              touchAction: "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
