package org.example.studyroomreservation.studyroom.reservation;

import java.time.LocalTime;

public class DTO {
    public record ReservationShowResponse(int studyRoomId, String studyRoomName, LocalTime startHour, LocalTime endHour, boolean hasCheckedIn, boolean hasCheckedOut){}
}
