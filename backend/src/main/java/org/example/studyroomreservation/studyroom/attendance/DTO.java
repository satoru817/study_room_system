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
    private static final long RESERVATION_LEAD_TIME_MINUTES = 5L;
    private static final long CHECK_IN_CUT_OFF_MINUTES = 10L;
    @Autowired
    private static NamedParameterJdbcTemplate jdbcTemplate;

    public record AttendanceRequest(int studyRoomId) {
        boolean validate(AttendanceValidator validator, StudentUser student) {
            return validator.validate(student, studyRoomId);
        }
    }
}
