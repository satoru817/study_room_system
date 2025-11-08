package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;

public class DTO {
    public record AttendanceRequest(int studyRoomId) {
        Integer validate(AttendanceValidator validator, StudentUser student) {
            return validator.validate(student, studyRoomId);
        }
    }

    public record CheckoutRequest(int studyRoomId) {
        Integer validate(AttendanceValidator validator, StudentUser student) {
            return validator.validateCheckout(student, studyRoomId);
        }
    }
}
