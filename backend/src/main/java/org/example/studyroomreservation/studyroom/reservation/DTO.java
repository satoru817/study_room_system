package org.example.studyroomreservation.studyroom.reservation;

import java.time.LocalTime;

public class DTO {
    public record ReservationShowResponse(String studyRoomName, LocalTime startHour, LocalTime endHour){}
}
