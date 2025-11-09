package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.notification.EmailNotificationStrategy;
import org.example.studyroomreservation.notification.LineNotificationStrategy;
import org.example.studyroomreservation.notification.NotificationStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

@Service
public class AttendanceService {
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;
    private final List<NotificationStrategy> strategies;

    public AttendanceService(
            LineNotificationStrategy lineStrategy,
            EmailNotificationStrategy emailStrategy) {
        this.strategies = Arrays.asList(lineStrategy, emailStrategy);
    }

    private void notifyEntry(StudentUser studentUser) {
        for (NotificationStrategy strategy : strategies) {
            if (strategy.canSend(studentUser)) {
                strategy.sendEntranceNotification(studentUser);
                return;
            }
        }
    }

    private void notifyExit(StudentUser studentUser) {
        for (NotificationStrategy strategy : strategies) {
            if (strategy.canSend(studentUser)) {
                strategy.sendExitNotification(studentUser);
                return;
            }
        }
    }

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
        notifyEntry(student);
    }

    public void checkout(Integer reservationId, StudentUser studentUser) {
        String updateSql = """
                UPDATE study_room_attendances SET end_hour = :endHour
                WHERE study_room_reservation_id = :reservationId
                """;
        LocalTime now = TokyoTimeElf.getTokyoLocalDateTime().toLocalTime();
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("endHour", now)
                .addValue("reservationId", reservationId);

        jdbcTemplate.update(updateSql, params);
        notifyExit(studentUser);
    }

    public DTO.AttendanceHistoryResponse createHistoryResponse(DTO.AttendanceHistoryRequest request, StudentUser student) {
        boolean isAll = request.isAll();
        int studentId = student.getStudentId();
        String commonSql = """
            SELECT
                DATE_SUB(srr.date, INTERVAL WEEKDAY(srr.date) DAY) AS weekStartDay,
                SUM(TIMESTAMPDIFF(MINUTE, sra.start_hour, sra.end_hour)) AS totalMinutes
            FROM study_room_attendances sra
            JOIN study_room_reservations srr ON srr.study_room_reservation_id = sra.study_room_reservation_id
            """;

        List<DTO.AttendanceRecordOfOneWeek> histories;

        if (isAll) {
            String getHistoriesSql = commonSql + """
                WHERE srr.student_id = :studentId
                GROUP BY DATE_SUB(srr.date, INTERVAL WEEKDAY(srr.date) DAY)
                ORDER BY weekStartDay ASC
                """;

            histories = jdbcTemplate.query(
                    getHistoriesSql,
                    new MapSqlParameterSource("studentId", studentId),
                    (rs, rowNum) -> new DTO.AttendanceRecordOfOneWeek(
                            rs.getDate("weekStartDay").toLocalDate(),
                            rs.getInt("totalMinutes")
                    )
            );
        }
        else {
            int weeks = request.weeks();
            LocalDate startMonday = TokyoTimeElf.getThisWeekMonday().minusWeeks(weeks);
            String getHistoriesInPeriodSql = commonSql + """
                WHERE srr.student_id = :studentId
                AND srr.date >= :startMonday
                GROUP BY DATE_SUB(srr.date, INTERVAL WEEKDAY(srr.date) DAY)
                ORDER BY weekStartDay ASC
                """;

            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("studentId", studentId);
            params.addValue("startMonday", startMonday);

            histories = jdbcTemplate.query(
                    getHistoriesInPeriodSql,
                    params,
                    (rs, rowNum) -> new DTO.AttendanceRecordOfOneWeek(
                            rs.getDate("weekStartDay").toLocalDate(),
                            rs.getInt("totalMinutes")
                    )
            );
        }

        return new DTO.AttendanceHistoryResponse(histories);
    }
}
