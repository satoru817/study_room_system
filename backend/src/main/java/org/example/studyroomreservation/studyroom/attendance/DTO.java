package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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
