package org.example.studyroomreservation.studyroom.reservation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.studyroom.dto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReservationService {
    @Autowired
    private StudyRoomReservationRepository reservationRepository;
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;
    @Autowired
    private ObjectMapper objectMapper;


    public List<DTO.ReservationShowResponse> getReservationsOfOneStudentOfToday(int studentId) {
        LocalDate today = TokyoTimeElf.getTokyoLocalDate();
        return reservationRepository.getReservationOfOneStudentOfThisDay(studentId, today);
    }

    public dto.WeeklyAvailabilityResponse getWeeklyAvailabilityResponse(int studyRoomId, int offset, int studentId) {
        LocalDate today = TokyoTimeElf.getTokyoLocalDate();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).plusWeeks((long) offset);
        LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(java.time.DayOfWeek.SUNDAY)).plusWeeks((long) offset);
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
                 WITH week_days AS (
                     SELECT DATE(:start) + INTERVAL seq DAY AS day
                     FROM seq_0_to_6
                     WHERE DATE(:start) + INTERVAL seq DAY <= :end
                 ),
                 day_infos AS (
                     SELECT
                         d.day AS day,
                         COUNT(srse.study_room_schedule_exception_id) > 0 AS is_irregular,
                         CASE
                             WHEN COUNT(srse.study_room_schedule_exception_id) > 0
                             THEN COUNT(CASE WHEN srse.is_open THEN 1 END) > 0
                             ELSE COUNT(srrs.study_room_regular_schedule_id) > 0
                         END AS is_open
                     FROM week_days d
                     LEFT JOIN study_room_regular_schedules srrs
                         ON LOWER(srrs.day_of_week) = LOWER(DAYNAME(d.day))
                         AND srrs.study_room_id = :studyRoomId
                     LEFT JOIN study_room_schedule_exceptions srse
                         ON srse.study_room_id = :studyRoomId
                         AND srse.date = d.day
                     GROUP BY d.day
                 ),
                 all_slots AS (
                     SELECT
                         wd.day,
                         ts.start_time,
                         ts.end_time
                     FROM week_days wd
                     CROSS JOIN time_slots ts
                 ),
                 book_per_slots AS (
                     SELECT
                         als.day,
                         als.start_time,
                         als.end_time,
                         COUNT(srr.study_room_reservation_id) AS reserved_seats,
                         COUNT(srr_mine.study_room_reservation_id) > 0 AS is_booked_by_this_student_this_room,
                         COUNT(srr_mine_other.study_room_reservation_id) > 0 AS is_booked_by_this_student_other_room
                     FROM all_slots als
                     LEFT JOIN study_room_reservations srr
                         ON srr.study_room_id = :studyRoomId
                         AND srr.date = als.day
                         AND srr.start_hour <= als.start_time
                         AND srr.end_hour  > als.start_time
                     LEFT JOIN study_room_reservations srr_mine
                         ON srr_mine.study_room_id = :studyRoomId
                         AND srr_mine.student_id = :studentId
                         AND srr_mine.date = als.day
                         AND srr_mine.start_hour <= als.start_time
                         AND srr_mine.end_hour  >= als.end_time
                     LEFT JOIN study_room_reservations srr_mine_other
                        ON srr_mine_other.student_id = :studentId
                        AND srr_mine_other.date = als.day
                        AND srr_mine_other.start_hour <= als.start_time
                        AND srr_mine_other.end_hour >= als.end_time
                        AND srr_mine_other.study_room_id != :studyRoomId
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
                         AND di.is_open = TRUE
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
                         (di.is_irregular = TRUE  AND srse.study_room_schedule_exception_id IS NOT NULL)
                         OR
                         (di.is_irregular = FALSE AND srrs.study_room_regular_schedule_id IS NOT NULL)
                 )
                 SELECT
                     als.day AS date,
                     als.start_time,
                     als.end_time,
                     CASE WHEN bs.day IS NOT NULL
                          THEN rl.room_limit - COALESCE(bps.reserved_seats, 0)
                          ELSE 0
                     END AS available_seats,
                     CASE WHEN bs.day IS NOT NULL
                          THEN rl.room_limit
                          ELSE 0
                     END AS total_seats,
                     bs.day IS NOT NULL AS is_open,
                     COALESCE(bps.is_booked_by_this_student_this_room, FALSE) AS is_booked_by_this_student_this_room,
                     COALESCE(bps.is_booked_by_this_student_other_room, FALSE) AS is_booked_by_this_student_other_room
                 FROM all_slots als
                 CROSS JOIN (
                     SELECT room_limit FROM study_rooms WHERE study_room_id = :studyRoomId
                 ) rl
                 LEFT JOIN book_per_slots bps
                     ON bps.day = als.day
                     AND bps.start_time = als.start_time
                     AND bps.end_time = als.end_time
                 LEFT JOIN bookable_slots bs
                     ON bs.day = als.day
                     AND bs.start_time = als.start_time
                     AND bs.end_time = als.end_time
                 ORDER BY als.day, als.start_time;
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
                        rs.getBoolean("is_booked_by_this_student_this_room"),
                        rs.getBoolean("is_booked_by_this_student_other_room")
                )
        );
    }


    @Transactional
    public dto.WeeklyAvailabilityResponse createReservationBulk(int studentId, dto.CreateReservationRequest request) {
        // get lock!
        String lock = """
                SELECT 1 FROM study_rooms WHERE study_room_id = :studyRoomId FOR UPDATE
                """;
        jdbcTemplate.queryForList(
                lock,
                Map.of("studyRoomId", request.studyRoomId())
        );

        LocalDate start = request.getWeekStart();
        LocalDate end = request.getWeekEnd();
        int studyRoomId = request.studyRoomId();

        String deleteSql = """
                DELETE FROM study_room_reservations
                WHERE study_room_id = :studyRoomId
                    AND student_id = :studentId
                    AND (date BETWEEN :start AND :end)
                """;

        MapSqlParameterSource map = new MapSqlParameterSource()
                .addValue("studyRoomId", studyRoomId)
                .addValue("studentId", studentId)
                .addValue("start", start)
                .addValue("end", end);

        // delete all reservation of the student in the range
        jdbcTemplate.update(deleteSql, map);

        String checkAvailabilitySql = """
                WITH slot_starts AS (
                    SELECT ts.start_time
                    FROM time_slots ts
                    WHERE ts.start_time >= :startHour
                    AND ts.start_time < :endHour
                ),
                slot_reservations AS (
                    SELECT ss.start_time, COUNT(srr.study_room_reservation_id) AS reservations
                    FROM slot_starts ss
                    JOIN study_room_reservations srr
                    ON srr.study_room_id = :studyRoomId
                        AND srr.date = :date
                        AND NOT ( srr.end_hour <= ss.start_time OR srr.start_hour > ss.start_time)
                    GROUP BY ss.start_time
                )
                SELECT EXISTS (
                    SELECT sr.start_time
                    FROM slot_reservations sr
                    CROSS JOIN (
                        SELECT room_limit FROM study_rooms WHERE study_room_id = :studyRoomId
                    ) rl
                    WHERE sr.reservations >= rl.room_limit
                )
                """;

        for (dto.ReservationSlot slot : request.reservations()) {
            MapSqlParameterSource availParams = new MapSqlParameterSource()
                    .addValue("studyRoomId", request.studyRoomId())
                    .addValue("date", slot.date())
                    .addValue("startHour", slot.startHour())
                    .addValue("endHour", slot.endHour());

            Integer isFull = jdbcTemplate.queryForObject(checkAvailabilitySql, availParams, Integer.class);
            if (isFull != null && isFull > 0) {
                throw new IllegalStateException("空き席がありません: " + slot.date() + " " + slot.startHour());
            }
        }

        // 同じ時間帯に他の部屋の予約があるかチェック
        String duplicateCheckSql = """
            SELECT EXISTS (
                SELECT srr.study_room_reservation_id
                FROM study_room_reservations srr
                WHERE srr.student_id = :studentId
                AND srr.date = :date
                AND NOT (srr.end_hour <= :startHour OR srr.start_hour >= :endHour)
            )
        """;

        for (dto.ReservationSlot slot : request.reservations()) {
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("studentId", studentId)  // 追加
                    .addValue("date", slot.date())
                    .addValue("startHour", slot.startHour())
                    .addValue("endHour", slot.endHour());

            Integer hasDuplicate = jdbcTemplate.queryForObject(duplicateCheckSql, params, Integer.class);
            if (hasDuplicate != null && hasDuplicate > 0) {
                throw new IllegalStateException("同じ時間帯に別の部屋を予約しています: " + slot.date() + " " + slot.startHour());
            }
        }

        String insertSql = """
            INSERT INTO study_room_reservations(date, start_hour, end_hour, study_room_id, student_id)
            VALUES (:date, :startHour, :endHour, :studyRoomId, :studentId)
            """;

        SqlParameterSource[] batchParams = request.reservations().stream()
                .map(slot -> new MapSqlParameterSource()
                        .addValue("date", slot.date())
                        .addValue("startHour", slot.startHour())
                        .addValue("endHour", slot.endHour())
                        .addValue("studyRoomId", request.studyRoomId())
                        .addValue("studentId", studentId))
                .toArray(SqlParameterSource[]::new);

        jdbcTemplate.batchUpdate(insertSql, batchParams);

        return getWeeklyAvailabilityResponse(request.studyRoomId(), request.offset(), studentId);
    }

    public List<DTO.ReservationDtoForConfirmation> findWhichReservationWillBeDeletedByClosingOneDay(DTO.CloseRequest closeRequest) {
        int studyRoomId = closeRequest.studyRoomId();
        LocalDate date = closeRequest.date();
        return checkWillBeDeletedByClosingOneDay(studyRoomId, date);
    }

    private List<DTO.ReservationDtoForConfirmation> checkWillBeDeletedByClosingOneDay(int studyRoomId, LocalDate date) {
        String sql = """
                SELECT sr.study_room_id, sr.name AS study_room_name, st.name AS student_name, srr.date, srr.start_hour, srr.end_hour
                FROM study_room_reservations srr
                JOIN study_rooms sr ON sr.study_room_id = :studyRoomId AND sr.study_room_id = srr.study_room_id AND srr.date = :date
                JOIN students st ON st.student_id = srr.student_id
                """;
        MapSqlParameterSource mapSqlParameterSource = new MapSqlParameterSource()
                .addValue("studyRoomId", studyRoomId)
                .addValue("date", date);

        return getConfirmationDTOUsingNamedParameterJdbcTemplate(sql, mapSqlParameterSource);
    }

    private List<DTO.ReservationDtoForConfirmation> getConfirmationDTOUsingNamedParameterJdbcTemplate(String sql, MapSqlParameterSource mapSqlParameterSource) {
        return jdbcTemplate.query(sql, mapSqlParameterSource, (rs, rowNum) ->
                new DTO.ReservationDtoForConfirmation(
                        rs.getInt("study_room_id"),
                        rs.getString("study_room_name"),
                        rs.getString("student_name"),
                        rs.getObject("date", LocalDate.class),
                        rs.getObject("start_hour", LocalTime.class),
                        rs.getObject("end_hour", LocalTime.class)
                ));
    }

    public DTO.WillBeDeletedOrModifiedReservations getWillBeDeletedOrModifiedReservations(dto.StudyRoomScheduleExceptionOfOneDate request) {
        int studyRoomId = request.studyRoomId();
        LocalDate date = request.date();
        List<dto.Range> timeSlots = request.schedules();
        List<DTO.ReservationDtoForConfirmation> willBeDeletedReservations = willBeDeletedReservations(studyRoomId, date, timeSlots);
        List<DTO.ReservationDtoForConfirmation> willBeModifiedReservations = willBeModifiedReservations(studyRoomId, date, timeSlots);
        return new DTO.WillBeDeletedOrModifiedReservations(willBeDeletedReservations, willBeModifiedReservations);
    }

    public List<DTO.ReservationDtoForConfirmation> willBeDeletedReservations(
            int studyRoomId, LocalDate date, List<dto.Range> timeSlots) {

        String sql = buildSqlWithTimeSlots("""
            ), non_deleted_reservation_ids AS (
                SELECT DISTINCT srr.study_room_reservation_id
                FROM study_room_reservations srr
                JOIN time_slots ts
                    ON NOT (srr.end_hour <= ts.openTime OR srr.start_hour >= ts.closeTime)
                WHERE srr.study_room_id = :studyRoomId AND srr.date = :date
            )
            SELECT DISTINCT sr.study_room_id, sr.name AS study_room_name,
                   s.name AS student_name, srr.date, srr.start_hour, srr.end_hour
            FROM study_room_reservations srr
            JOIN study_rooms sr ON srr.study_room_id = sr.study_room_id AND srr.study_room_id = :studyRoomId AND srr.date = :date
            JOIN students s ON srr.student_id = s.student_id
            LEFT JOIN non_deleted_reservation_ids ndri
                ON ndri.study_room_reservation_id = srr.study_room_reservation_id
            WHERE ndri.study_room_reservation_id IS NULL
            """);

        MapSqlParameterSource params = buildParams(studyRoomId, date, timeSlots);
        return getConfirmationDTOUsingNamedParameterJdbcTemplate(sql, params);
    }

    public List<DTO.ReservationDtoForConfirmation> willBeModifiedReservations(
            int studyRoomId, LocalDate date, List<dto.Range> timeSlots) {

        String sql = buildSqlWithTimeSlots( """
            ), partially_covered_reservation_ids AS (
                SELECT DISTINCT srr.study_room_reservation_id
                FROM study_room_reservations srr
                JOIN time_slots ts
                    ON srr.study_room_id = :studyRoomId AND srr.date = :date
                    AND (
                        (srr.start_hour < ts.openTime AND srr.end_hour > ts.openTime AND srr.end_hour <= ts.closeTime)
                        OR (srr.start_hour >= ts.openTime AND srr.start_hour < ts.closeTime AND srr.end_hour > ts.closeTime)
                        OR (srr.start_hour <= ts.openTime AND srr.end_hour > ts.closeTime)
                        OR (srr.start_hour < ts.openTime AND srr.end_hour >= ts.closeTime)
                    )
            )
            SELECT sr.study_room_id, sr.name AS study_room_name,
                   s.name AS student_name, srr.date, srr.start_hour, srr.end_hour
            FROM study_room_reservations srr
            JOIN study_rooms sr ON srr.study_room_id = sr.study_room_id AND srr.study_room_id = :studyRoomId AND srr.date = :date
            JOIN students s ON srr.student_id = s.student_id
            JOIN partially_covered_reservation_ids pcri
                ON pcri.study_room_reservation_id = srr.study_room_reservation_id
            """);

        MapSqlParameterSource params = buildParams(studyRoomId, date, timeSlots);
        return getConfirmationDTOUsingNamedParameterJdbcTemplate(sql, params);
    }

    private String buildSqlWithTimeSlots(String mainQuery) {

        return """
               WITH time_slots AS (
                    SELECT jt.openTime, jt.closeTime
                    FROM JSON_TABLE (
                        CAST(:timeSlots AS JSON),
                        "$[*]"
                        COLUMNS(
                            openTime TIME PATH "$.openTime",
                            closeTime TIME PATH "$.closeTime"
                        )
                    ) AS jt
               """
                +mainQuery;
    }

    private MapSqlParameterSource buildParams(
            int studyRoomId, LocalDate date, List<dto.Range> timeSlots) {

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("studyRoomId", studyRoomId);
        params.addValue("date", date);
        try {
            List<Map<String, String>> timeSlotsForJson = timeSlots.stream()
                    .map(slot -> Map.of(
                            "openTime", slot.openTime().toString(),   // "09:00:00"
                            "closeTime", slot.closeTime().toString()  // "11:15:00"
                    ))
                    .toList();
            String timeSlotsJson = objectMapper.writeValueAsString(timeSlotsForJson);
            params.addValue("timeSlots", timeSlotsJson);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return params;
    }

    public DTO.WillBeDeletedOrModifiedReservations calculateWillBeDeletedOrModifiedReservationsByDeletingOneDayScheduleException(DTO.ScheduleExceptionDeleteRequest request) {
        LocalDate date = request.selectedDate();
        TokyoTimeElf.DayOfWeek dayOfWeek = TokyoTimeElf.convert(date.getDayOfWeek());
        int studyRoomId = request.studyRoomId();
        String existSql = """
                SELECT EXISTS (
                    SELECT srrs.study_room_regular_schedule_id
                    FROM study_room_regular_schedules srrs
                    WHERE srrs.day_of_week = :dayOfWeek
                        AND srrs.study_room_id = :studyRoomId
                )
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("studyRoomId", studyRoomId)
                .addValue("dayOfWeek", dayOfWeek);

        boolean hasRegularSchedule = Boolean.TRUE.equals(jdbcTemplate.queryForObject(existSql, params, Boolean.class));

        if (!hasRegularSchedule) {
            List<DTO.ReservationDtoForConfirmation> willBeDeleted = checkWillBeDeletedByClosingOneDay(studyRoomId, date);
            return new DTO.WillBeDeletedOrModifiedReservations(willBeDeleted, List.of());
        }
        else {
            // this is tough part
            String getWillBeDeletedSql = """
                    WITH will_be_deleted_reservation_ids AS (
                        SELECT srr.study_room_reservation_id
                        FROM study_room_reservations srr
                        JOIN study_rooms sr
                            ON sr.study_room_id = srr.study_room_id 
                            AND sr.study_room_id = :studyRoomId 
                            AND srr.date = :date
                        LEFT JOIN study_room_regular_schedules srrs 
                            ON srrs.study_room_id = srr.study_room_id 
                            AND srrs.day_of_week = :dayOfWeek
                            AND NOT (srr.start_hour => srrs.close_time OR srr.end_hour <= srrs.open_time)
                        WHERE srrs.study_room_regular_schedule_id IS NULL
                    )
                    
                    """
        }
    }
}
