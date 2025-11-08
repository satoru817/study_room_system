package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
public final class AttendanceValidator {
    private static final long RESERVATION_LEAD_TIME_MINUTES = 5L;
    private static final long CHECK_IN_CUT_OFF_MINUTES = 10L;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    public AttendanceValidator(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean validate(StudentUser student, int studyRoomId) {
        LocalDateTime now = TokyoTimeElf.getTokyoLocalDateTime();
        LocalDate today = now.toLocalDate();
        LocalTime time = now.toLocalTime();
        LocalTime maxStartTime = time.plusMinutes(RESERVATION_LEAD_TIME_MINUTES);
        LocalTime minEndTime = time.plusMinutes(CHECK_IN_CUT_OFF_MINUTES);
        int studentId = student.getStudentId();

        String sql = """
            SELECT CAST(
                CASE WHEN EXISTS(
                    SELECT study_room_reservation_id
                    FROM study_room_reservations
                    WHERE study_room_id = :studyRoomId
                        AND student_id = :studentId
                        AND date = :date
                        AND start_hour <= :maxStartTime
                        AND end_hour >= :minEndTime
                ) THEN 1 ELSE 0 END
            AS BIT)
            """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("studyRoomId", studyRoomId);
        params.addValue("studentId", studentId);
        params.addValue("date", today);
        params.addValue("maxStartTime", maxStartTime);
        params.addValue("minEndTime", minEndTime);

        Boolean result = jdbcTemplate.queryForObject(sql, params, Boolean.class);

        return result != null && result;
    }
}