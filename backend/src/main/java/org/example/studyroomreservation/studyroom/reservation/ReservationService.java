package org.example.studyroomreservation.studyroom.reservation;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.studyroom.dto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {
    @Autowired
    private StudyRoomReservationRepository reservationRepository;
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;


    public List<DTO.ReservationShowResponse> getReservationsOfOneStudentOfToday(StudentUser student) {
        LocalDate today = TokyoTimeElf.getTokyoLocalDate();
        int studentId = student.getStudentId();
        return reservationRepository.getReservationOfOneStudentOfThisDay(studentId, today);
    }

    public dto.WeeklyAvailabilityResponse getWeeklyAvailabilityResponse(int studyRoomId, int offset, StudentUser student) {
        LocalDate today = TokyoTimeElf.getTokyoLocalDate();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).plusWeeks((long) offset);
        LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY)).plusWeeks((long) offset);
        int studentId = student.getStudentId();
        List<dto.TimeSlotAvailability> availabilities = getTimeSlotAvailability(studyRoomId, monday, sunday, studentId);
        List<dto.DailyAvailability> list =
                availabilities.parallelStream()
                        .collect(Collectors.groupingBy(dto.TimeSlotAvailability::date))
                        .entrySet()
                        .stream()
                        .map(entry -> {
                            LocalDate date = entry.getKey();
                            List<dto.TimeSlotAvailability> slots = entry.getValue();

                            return new dto.DailyAvailability(
                                    date,
                                    date.getDayOfWeek().name().toLowerCase(),
                                    date.isAfter(TokyoTimeElf.getTokyoLocalDate()),
                                    slots
                            );
                        })
                        .sorted()
                        .toList();
        return new dto.WeeklyAvailabilityResponse(studyRoomId, monday, list);
    }

    private List<dto.TimeSlotAvailability> getTimeSlotAvailability(int studyRoomId, LocalDate start, LocalDate end, int studentId) {
        String sql = """
            WITH RECURSIVE times AS (
                SELECT
                    TIME '07:00' AS start_time,
                    TIME '07:15' AS end_time
                UNION ALL
                SELECT
                    start_time + INTERVAL 15 MINUTE,
                    end_time + INTERVAL 15 MINUTE
                FROM times
                WHERE end_time < TIME '23:45'
            ),
            room_limit AS (
                SELECT sr.room_limit
                FROM study_rooms sr
                WHERE sr.study_room_id = :studyRoomId
            ),
            days AS (
                SELECT DATE :start AS day
                UNION ALL
                SELECT day + INTERVAL 1 DAY
                FROM days
                WHERE day < :end
            ),
            day_infos AS (
                SELECT
                    d.day,
                    COUNT(srse.study_room_schedule_exception_id) > 0 AS is_irregular,
                    CASE
                        WHEN COUNT(srse.study_room_schedule_exception_id) > 0
                        THEN COUNT(CASE WHEN srse.is_open THEN 1 END) = 1
                        ELSE COUNT(srrs.study_room_regular_schedule_id) > 0
                    END AS is_open
                FROM days d
                LEFT JOIN study_room_regular_schedules srrs 
                    ON LOWER(DAYNAME(d.day)) = LOWER(srrs.day_of_week) 
                    AND srrs.study_room_id = :studyRoomId
                LEFT JOIN study_room_schedule_exceptions srse 
                    ON srse.study_room_id = :studyRoomId 
                    AND srse.date = d.day
                GROUP BY d.day
            ),
            all_slots AS (
                SELECT d.day, t.start_time, t.end_time
                FROM days d
                CROSS JOIN times t
            ),
            book_per_slots AS (
                SELECT
                    als.day,
                    als.start_time,
                    als.end_time,
                    COUNT(srr.study_room_reservation_id) AS reserved_seats,
                    COUNT(srr_mine.study_room_reservation_id) = 1 AS is_booked_by_this_student
                FROM all_slots als
                LEFT JOIN study_room_reservations srr
                    ON srr.study_room_id = :studyRoomId
                    AND srr.date = als.day
                    AND srr.start_hour <= als.start_time 
                    AND srr.end_hour > als.start_time
                LEFT JOIN study_room_reservations srr_mine
                    ON srr_mine.student_id = :studentId 
                    AND srr_mine.study_room_id = :studyRoomId
                    AND srr_mine.date = als.day
                    AND srr_mine.start_hour <= als.start_time 
                    AND srr_mine.end_hour > als.start_time
                GROUP BY als.day, als.start_time, als.end_time
            ),
            bookable_slots AS (
                SELECT
                    als.day, 
                    als.start_time, 
                    als.end_time
                FROM all_slots als
                JOIN day_infos di 
                    ON di.day = als.day 
                    AND di.is_open = true
                LEFT JOIN study_room_regular_schedules srrs 
                    ON srrs.study_room_id = :studyRoomId 
                    AND LOWER(srrs.day_of_week) = LOWER(DAYNAME(als.day)) 
                    AND srrs.open_time <= als.start_time 
                    AND srrs.close_time > als.start_time
                LEFT JOIN study_room_schedule_exceptions srse 
                    ON srse.study_room_id = :studyRoomId 
                    AND srse.date = als.day 
                    AND srse.open_time <= als.start_time 
                    AND srse.close_time > als.start_time
                WHERE 
                    (di.is_irregular = true AND srse.study_room_schedule_exception_id IS NOT NULL) 
                    OR (di.is_irregular = false AND srrs.study_room_regular_schedule_id IS NOT NULL)
            )
            SELECT
                als.day AS date,
                als.start_time,
                als.end_time,
                CASE 
                    WHEN bs.day IS NOT NULL 
                    THEN rl.room_limit - COALESCE(bps.reserved_seats, 0) 
                    ELSE 0 
                END AS available_seats,
                CASE 
                    WHEN bs.day IS NOT NULL 
                    THEN rl.room_limit 
                    ELSE 0 
                END AS total_seats,
                bs.day IS NOT NULL AS is_open,
                COALESCE(bps.is_booked_by_this_student, false) AS is_booked_by_this_student
            FROM all_slots als
            CROSS JOIN room_limit rl
            LEFT JOIN book_per_slots bps 
                ON bps.day = als.day 
                AND bps.start_time = als.start_time 
                AND bps.end_time = als.end_time
            LEFT JOIN bookable_slots bs 
                ON bs.day = als.day 
                AND bs.start_time = als.start_time 
                AND bs.end_time = als.end_time
            ORDER BY als.day, als.start_time
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("studyRoomId", studyRoomId)
                .addValue("start", start)
                .addValue("end", end)
                .addValue("studentId", studentId);

        return jdbcTemplate.query(sql, params, (rs, rowNum) ->
                new dto.TimeSlotAvailability(
                        rs.getObject("date", LocalDate.class),
                        rs.getObject("start_time", LocalTime.class),
                        rs.getObject("end_time", LocalTime.class),
                        rs.getInt("available_seats"),
                        rs.getInt("total_seats"),
                        rs.getBoolean("is_open"),
                        rs.getBoolean("is_booked_by_this_student")
                )
        );
    }
}
