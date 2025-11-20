package org.example.studyroomreservation.studyroom.reservation;

import org.example.studyroomreservation.studyroom.StudyRoomController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class DTO {
    public record ReservationShowResponse(int studyRoomId, String studyRoomName, LocalTime startHour, LocalTime endHour, boolean hasCheckedIn, boolean hasCheckedOut){}
    public record CloseRequest(int studyRoomId, LocalDate date){}
    public record ReservationDtoForConfirmation(int studyRoomId, String studyRoomName, String studentName, LocalDate date, LocalTime startHour, LocalTime endHour){}
    public record WillBeDeletedOrModifiedReservations(List<ReservationDtoForConfirmation> willBeDeleted, List<ReservationDtoForConfirmation> willBeModified){}
    public record ScheduleExceptionDeleteRequest(int studyRoomId, LocalDate selectedDate){}
}
