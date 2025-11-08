package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;

@Service
public class AttendanceService {
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    public void attend(int reservationId, StudentUser student, DTO.AttendanceRequest request) {
        String insertSql = """
                INSERT INTO study_room_attendances (study_room_reservation_id, start_hour)
                VALUES(:studyRoomReservationId, :startHour)
                """;
        LocalTime now = TokyoTimeElf.getTokyoLocalDateTime().toLocalTime();

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("studyRoomReservationId", reservationId)
                .addValue("startHour", now);

        jdbcTemplate.update(insertSql, params);
    }

    public void checkout(Integer reservationId) {
        String updateSql = """
                UPDATE study_room_attendances SET end_hour = :endHour
                WHERE study_room_reservation_id = :reservationId
                """;
        LocalTime now = TokyoTimeElf.getTokyoLocalDateTime().toLocalTime();
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("endHour", now)
                .addValue("reservationId", reservationId);

        jdbcTemplate.update(updateSql, params);
    }
}
