package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;

import java.time.LocalDate;
import java.util.List;

public class DTO {
    public record AttendanceRequest(int studyRoomId) {
        Integer validate(AttendanceValidator validator, int studentId) {
            return validator.validate(studentId, studyRoomId);
        }
    }

    public record CheckoutRequest(int studyRoomId) {
        Integer validate(AttendanceValidator validator, int studentId) {
            return validator.validateCheckout(studentId, studyRoomId);
        }
    }

    public record AttendanceHistoryRequest(boolean isAll,//if we should select all attendance info
                                           int weeks // how many weeks to show
    ) {};
    public record AttendanceRecordOfOneWeek(LocalDate weekStartDay,// the start of the week(Monday)
                                            int totalMinutes){}

    public record AttendanceHistoryResponse(List<AttendanceRecordOfOneWeek> histories){}
}
