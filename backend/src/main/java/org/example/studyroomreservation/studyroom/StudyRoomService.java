package org.example.studyroomreservation.studyroom;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.example.studyroomreservation.config.security.user.TeacherUser;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.notification.DTO;
import org.example.studyroomreservation.notification.NotificationService;
import org.example.studyroomreservation.studyroom.reservation.RangeService;
import org.example.studyroomreservation.studyroom.reservation.ReservationService;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;

@Service
public class StudyRoomService {
    private static final Logger log = LoggerFactory.getLogger(StudyRoomService.class);
    @Autowired
    private StudyRoomReservationRepository studyRoomReservationRepository;
    @Autowired
    private StudyRoomRepository studyRoomRepository;
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;
    @Autowired
    private RangeService rangeService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private ReservationService reservationService;
    private static String INVALID_TIME = "00:00:00";

    public List<StudyRoomStatus> findAllByCramSchoolId(int cramSchoolId) {
        try {
            LocalDateTime now = TokyoTimeElf.getTokyoLocalDateTime();
            LocalDate today = now.toLocalDate();
            LocalTime time = now.toLocalTime();
            List<StudyRoomStatus> studyRooms = studyRoomRepository.findAllStatusByCramSchoolId(cramSchoolId, today, time);
            return studyRooms;
        } catch (Exception e) {
            log.error("Failed to find study rooms by cram school ID: {}, Error: {}", cramSchoolId, e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    public void update(StudyRoomController.StudyRoomEditRequest request) {
        int studyRoomId = request.studyRoomId();
        String name = request.name();
        int roomLimit = request.roomLimit();

        String sql = """
        UPDATE study_rooms
        SET name = :name,
            room_limit = :roomLimit
        WHERE study_room_id = :studyRoomId
        """;

        Map<String, Object> params = new HashMap<>();
        params.put("name", name);
        params.put("roomLimit", roomLimit);
        params.put("studyRoomId", studyRoomId);

        jdbcTemplate.update(sql, params);
    }

    public List<dto.StudyRoomRegularScheduleDTO> getRegularSchedulesOfOneStudyRoom(int studyRoomId) {
        return studyRoomRepository.getRegularScheduleOfOneStudyRoom(studyRoomId);
    }

    public List<DTO.StudyRoomScheduleExceptionShowResponse> getScheduleExceptionsOfOneStudyRoom(StudyRoomController.StudyRoomScheduleExceptionShowRequest request) {
        try {
            return studyRoomRepository.getScheduleExceptionsOfOneStudyRoomOfYearMonth(request.studyRoomId(), request.year(), request.month());
        } catch (Exception e) {
            log.error("Failed to get schedule exceptions for study room: {}, year: {}, month: {}, Error: {}",
                request.studyRoomId(), request.year(), request.month(), e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }
    // We modify existing reservations instead of deleting all to minimize disruption to students.
    // After updating schedules and reservations, we notify affected students and return notification results
    // so teachers can follow up with students who weren't successfully notified.
    @Transactional
    public dto.RegularScheduleUpdatedResponse bulkUpdateRegularScheduleOfOneStudyRoom(dto.RegularScheduleBulkSaveRequest request) {
        String deleteSql = """
                DELETE FROM study_room_regular_schedules
                WHERE study_room_id = :studyRoomId
                """;

        String insertSql = """
                INSERT INTO study_room_regular_schedules (study_room_id, day_of_week, open_time, close_time)
                VALUES (:studyRoomId, :dayOfWeek, :openTime, :closeTime)
                """;

        // bulk delete
        int studyRoomId = request.studyRoomId();
        jdbcTemplate.update(deleteSql, Map.of("studyRoomId", studyRoomId));

        List<MapSqlParameterSource> batchInsertParams = request.regularSchedules().parallelStream()
                .map(solidRegularSchedule -> new MapSqlParameterSource()
                        .addValue("studyRoomId", studyRoomId)
                        .addValue("dayOfWeek", solidRegularSchedule.dayOfWeek().toString())
                        .addValue("openTime", solidRegularSchedule.openTime())
                        .addValue("closeTime", solidRegularSchedule.closeTime())
                ).toList();

        jdbcTemplate.batchUpdate(insertSql, batchInsertParams.toArray(new MapSqlParameterSource[0]));

        List<dto.StudyRoomRegularScheduleDTO> updatedRegularSchedule = getRegularSchedulesOfOneStudyRoom(studyRoomId);
        // Modify reservations to comply with new schedule and notify affected students
        DTO.NotificationResult notificationResult = notificationService.modifyReservationsAndSendNotifications(studyRoomId, updatedRegularSchedule);
        return new dto.RegularScheduleUpdatedResponse(updatedRegularSchedule, notificationResult);
    }
    // TODO: ここで、study_room_reservationsもupdateしないといけない。
    private void deleteStudyRoomScheduleExceptionOfOneStudyRoomIdOfOneDay(int studyRoomId, LocalDate date) {
        String deleteSql = """
                DELETE FROM study_room_schedule_exceptions srse
                WHERE srse.study_room_id = :studyRoomId
                AND srse.date = :date
                """;

        Map<String, Object> map = new HashMap<>();
        map.put("studyRoomId", studyRoomId);
        map.put("date", date);
        // delete all first
        jdbcTemplate.update(deleteSql, map);
    }

    private void deleteReservationOfOneDayOfOneStudyRoomId(int studyRoomId, LocalDate date) {
        String deleteReservationsSql = """
                    DELETE FROM study_room_reservations
                    WHERE study_room_id = :studyRoomId
                    AND date = :date
                    """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("studyRoomId", studyRoomId)
                .addValue("date", date);

        jdbcTemplate.update(deleteReservationsSql, params);
    }

    // 例外スケジュールを保存するメソッド
    @Transactional
    public DTO.ScheduleExceptionsAndNotificationResult saveException(dto.StudyRoomScheduleExceptionOfOneDate request) {
        int studyRoomId = request.studyRoomId();
        LocalDate date = request.date();
        // Save pre-state for comparison to determine which students to notify
        List<StudyRoomReservation> preReservations = studyRoomReservationRepository.getReservationsOfOneRoomOfOneDay(studyRoomId, date);

        // Clear existing state before applying new schedule
        deleteStudyRoomScheduleExceptionOfOneStudyRoomIdOfOneDay(studyRoomId, date);
        // just delete all the reservations of the day because this day will just be closed... simple right?
        deleteReservationOfOneDayOfOneStudyRoomId(studyRoomId, date);

        String insertSql = """
                INSERT INTO study_room_schedule_exceptions (study_room_id, date, is_open, open_time, close_time, reason)
                VALUES (:studyRoomId, :date, :isOpen, :openTime, :closeTime, :reason)
                """;
        // if !request.isOpen() then it just means this day WILL BE CLOSED.
        if (!request.isOpen()) {
            Map<String, Object> map = new HashMap<>();
            map.put("studyRoomId", studyRoomId);
            map.put("date", date);
            map.put("isOpen", false);
            map.put("openTime", INVALID_TIME);
            map.put("closeTime", INVALID_TIME);
            map.put("reason", request.reason());
            jdbcTemplate.update(insertSql, map);
        }
        // if request.isOpen() then it means this day will be open
        else {
            List<MapSqlParameterSource> batchInsertParams = request.schedules().stream()
                    .map(range -> new MapSqlParameterSource()
                            .addValue("studyRoomId", studyRoomId)
                            .addValue("date", date)
                            .addValue("isOpen", true)
                            .addValue("openTime", range.openTime())
                            .addValue("closeTime", range.closeTime())
                            .addValue("reason", request.reason())
                    ).toList();
            jdbcTemplate.batchUpdate(insertSql, batchInsertParams.toArray(new MapSqlParameterSource[0]));

            // Recreate reservations adjusted to new schedule to minimize disruption to students
            List<dto.Range> rangesOfThisDay = request.schedules();
            createNewReservationBasedOnRangesAndPreReservations(rangesOfThisDay, preReservations, date, studyRoomId);
        }
        return sendNotificationBasedOnChangedAndPreReservations(preReservations, studyRoomId, date);
    }

    private DTO.ScheduleExceptionsAndNotificationResult sendNotificationBasedOnChangedAndPreReservations(List<StudyRoomReservation> preReservations, int studyRoomId, LocalDate date) {
        List<StudyRoomReservation> changedReservations = studyRoomReservationRepository.getReservationsOfOneRoomOfOneDay(studyRoomId, date);
        DTO.NotificationResult notificationResult = notificationService.sendNotificationOfReservationChangeOfOneDay(preReservations, changedReservations);
        List<DTO.StudyRoomScheduleExceptionShowResponse> exceptions = studyRoomRepository.getScheduleExceptionsOfOneStudyRoomOfYearMonth(studyRoomId, date.getYear(), date.getMonthValue());
        return new DTO.ScheduleExceptionsAndNotificationResult(exceptions, notificationResult);
    }

    private void createNewReservationBasedOnRangesAndPreReservations(List<dto.Range> rangesOfThisDay, List<StudyRoomReservation> preReservations, LocalDate date, int studyRoomId) {
        Map<Integer, Set<dto.Range>> studentIdToUpdatedRanges = new HashMap<>();
        preReservations.stream()
                .forEach(studyRoomReservation -> {
                    Set<dto.Range> ranges = rangeService.createAdjustedRanges(rangesOfThisDay, studyRoomReservation.getStartHour(), studyRoomReservation.getEndHour());
                    studentIdToUpdatedRanges.computeIfAbsent(studyRoomReservation.getStudent().getStudentId(), k -> new HashSet<>()).addAll(ranges);
                });
        String insertReservationsSql = """
                    INSERT INTO study_room_reservations (date, start_hour, end_hour, study_room_id, student_id)
                    VALUES (:date, :startHour, :endHour, :studyRoomId, :studentId)
                    """;

        List<MapSqlParameterSource> batchInsertReservationParams =
                studentIdToUpdatedRanges.entrySet().parallelStream()
                        .flatMap(entry ->
                                entry.getValue().stream().map(range ->
                                        new MapSqlParameterSource()
                                                .addValue("date", date)
                                                .addValue("studyRoomId", studyRoomId)
                                                .addValue("studentId", entry.getKey())
                                                .addValue("startHour", range.openTime())
                                                .addValue("endHour", range.closeTime())
                                )
                        )
                        .toList();

        // Persist adjusted reservations
        jdbcTemplate.batchUpdate(insertReservationsSql, batchInsertReservationParams.toArray(new MapSqlParameterSource[0]));
    }

    @Transactional
    public List<DTO.StudyRoomScheduleExceptionShowResponse> deleteExceptionOfOneDay(dto.StudyRoomScheduleExceptionDeleteRequest deleteRequest) {
        int studyRoomId = deleteRequest.studyRoomId();
        LocalDate date = deleteRequest.date();
        String deleteSql = """
                DELETE FROM study_room_schedule_exceptions srse
                WHERE srse.date = :date
                AND srse.study_room_id = :studyRoomId
                """;
        Map<String, Object> map = new HashMap<>();
        map.put("date", date);
        map.put("studyRoomId", studyRoomId);

        jdbcTemplate.update(deleteSql, map);

        return studyRoomRepository.getScheduleExceptionsOfOneStudyRoomOfYearMonth(studyRoomId, date.getYear(), date.getMonthValue());
    }

    public List<dto.StudyRoomShowResponseForStudent> getStudyRoomsOfStudent(int studentId) {
        return studyRoomRepository.getStudyRoomOfThisStudent(studentId);
    }

    public List<dto.StudyRoomShow> getThisTeachers(TeacherUser teacherUser) {
        int userId = teacherUser.user.getUserId();

        String getSql = """
            WITH this_teachers_cram_schools AS (
                SELECT csu.cram_school_id
                FROM cram_school_users csu
                WHERE csu.user_id = :userId
            )
            SELECT sr.study_room_id, sr.name, cs.name
            FROM study_rooms sr
            JOIN this_teachers_cram_schools ttcs ON ttcs.cram_school_id = sr.cram_school_id
            JOIN cram_schools cs ON cs.cram_school_id = sr.cram_school_id
            """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("userId", userId);

        return jdbcTemplate.query(getSql, params, (rs, rowNum) ->
                new dto.StudyRoomShow(
                        rs.getInt("study_room_id"),
                        rs.getString(2), // sr.name (studyRoomName)
                        rs.getString(3)  // cs.name (cramSchoolName)
                )
        );
    }

    @Transactional
    public DTO.NotificationResult copyRegularSchedule(dto.CopyRegularScheduleRequest request) throws JsonProcessingException {
        int fromStudyRoomId = request.fromStudyRoomId();
        List<Integer> toStudyRoomIds = request.toStudyRoomIds();

        String deleteSql = """
            DELETE FROM study_room_regular_schedules
            WHERE study_room_id IN (:toStudyRoomIds)
            """;

        MapSqlParameterSource deleteParams = new MapSqlParameterSource();
        deleteParams.addValue("toStudyRoomIds", toStudyRoomIds);
        jdbcTemplate.update(deleteSql, deleteParams);

        String insertSql = """
                INSERT INTO study_room_regular_schedules (
                    study_room_id, day_of_week, open_time, close_time
                )
                SELECT jt.id, srr.day_of_week, srr.open_time, srr.close_time
                FROM study_room_regular_schedules srr
                CROSS JOIN JSON_TABLE(
                    CAST(:toIdsJson AS JSON),
                    "$[*]" COLUMNS(id INT PATH "$")
                ) jt
                WHERE srr.study_room_id = :fromStudyRoomId
                """;

        String toIdsJson = new ObjectMapper().writeValueAsString(toStudyRoomIds);
        MapSqlParameterSource insertParams = new MapSqlParameterSource()
                .addValue("toIdsJson", toIdsJson)
                        .addValue("fromStudyRoomId", fromStudyRoomId);
        jdbcTemplate.update(insertSql, insertParams);

        // Update reservations to comply with new schedule, then notify students.
        // We return notification results so teachers can see which students were successfully notified.
        StudyRoomReservation.PrePostReservationsPair pair = reservationService.updateReservationsDueToRegularScheduleCopy(fromStudyRoomId, toStudyRoomIds);
        return notificationService.sendNotificationOfChangeOfReservationsDueToUpdateOfSchedule(pair);
    }

    // TODO: add reservation delete logic or something...
    @Transactional
    public void copyScheduleException(dto.CopyScheduleExceptionRequest request) throws JsonProcessingException {
        int fromStudyRoomId = request.fromStudyRoomId();
        List<Integer> toStudyRoomIds = request.toStudyRoomIds();
        int year = request.year();
        int month = request.month();
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = YearMonth.of(year, month).atEndOfMonth();

        String deleteSql = """
                DELETE FROM study_room_schedule_exceptions srse
                WHERE study_room_id IN (:toStudyRoomIds)
                """;
        MapSqlParameterSource deleteParams = new MapSqlParameterSource();
        deleteParams.addValue("toStudyRoomIds", toStudyRoomIds);
        jdbcTemplate.update(deleteSql, deleteParams);

        String insertSql = """
                INSERT INTO study_room_schedule_exceptions (study_room_id, date, is_open, open_time, close_time, reason)
                SELECT jt.study_room_id, srse.date, srse.is_open, srse.open_time, srse.close_time, srse.reason
                FROM study_room_schedule_exceptions srse
                CROSS JOIN JSON_TABLE(
                    CAST(:toStudyRoomIds AS JSON),
                    "$[*]" COLUMNS(study_room_id INT PATH "$")
                ) jt
                WHERE srse.study_room_id = :fromStudyRoomId
                    AND srse.date >= :monthStart
                    AND srse.date <= :monthEnd
                """;
        MapSqlParameterSource insertParams = new MapSqlParameterSource();
        String toIdsJson = new ObjectMapper().writeValueAsString(toStudyRoomIds);
        insertParams.addValue("toStudyRoomIds", toIdsJson);
        insertParams.addValue("fromStudyRoomId", fromStudyRoomId);
        insertParams.addValue("monthStart", monthStart);
        insertParams.addValue("monthEnd", monthEnd);
        jdbcTemplate.update(insertSql, insertParams);
    }

    private boolean hasRegularScheduleOnTheDayOfTheRoom(int studyRoomId, LocalDate date) {
        java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
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
                .addValue("dayOfWeek", dayOfWeek.toString());
        Integer count = jdbcTemplate.queryForObject(existSql, params, Integer.class);
        return count != null && count > 0;
    }

    public DTO.ScheduleExceptionsAndNotificationResult deleteExceptionOfOneDayWithReservationModificationAndNotification(dto.StudyRoomScheduleExceptionDeleteRequest deleteRequest) {
        int studyRoomId = deleteRequest.studyRoomId();
        LocalDate date = deleteRequest.date();
        List<StudyRoomReservation> preReservations = studyRoomReservationRepository.getReservationsOfOneRoomOfOneDay(studyRoomId, date);

        deleteStudyRoomScheduleExceptionOfOneStudyRoomIdOfOneDay(studyRoomId, date);

        deleteReservationOfOneDayOfOneStudyRoomId(studyRoomId, date);

        // If no regular schedule exists for this day, the room stays closed - all reservations remain deleted.
        // If regular schedule exists, we can restore/adjust reservations to minimize disruption.
        if (!hasRegularScheduleOnTheDayOfTheRoom(studyRoomId, date)) {
            // No regular schedule means room is closed - notify students of cancellation
            DTO.NotificationResult notificationResult = notificationService.sendNotificationOfReservationChangeOfOneDay(preReservations, List.of());
            List<DTO.StudyRoomScheduleExceptionShowResponse> exceptions = studyRoomRepository.getScheduleExceptionsOfOneStudyRoomOfYearMonth(studyRoomId, date.getYear(), date.getMonthValue());
            return new DTO.ScheduleExceptionsAndNotificationResult(exceptions, notificationResult);
        }
        else {
            // Regular schedule exists, so we can restore reservations adjusted to regular schedule times
            List<dto.Range> rangesOfThisDay = getRangeOfThisDayOfThisRoomOfRegularSchedule(date, studyRoomId);
            createNewReservationBasedOnRangesAndPreReservations(rangesOfThisDay, preReservations, date, studyRoomId);
        }

        return sendNotificationBasedOnChangedAndPreReservations(preReservations, studyRoomId, date);
    }

    public List<dto.Range> getRangeOfThisDayOfThisRoomOfRegularSchedule(LocalDate date, int studyRoomId) {
        java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
        String sql = """
                SELECT srrs.open_time, srrs.close_time
                FROM study_room_regular_schedules srrs
                WHERE srrs.study_room_id = :studyRoomId AND srrs.day_of_week = :dayOfWeek
                """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("dayOfWeek", dayOfWeek.toString())
                .addValue("studyRoomId", studyRoomId);

        return jdbcTemplate.query(sql, params, (rs, rowNum) ->
                new dto.Range(
                        rs.getObject("open_time", LocalTime.class),
                        rs.getObject("close_time", LocalTime.class)
                )
        );
    }


    public record StudyRoomStatus(int studyRoomId, String name, int roomLimit, int currentStudents){}

    public void save(StudyRoom studyRoom) {
        studyRoomRepository.save(studyRoom);
    }

    @Transactional
    @Modifying
    public void deleteById(int studyRoomId) {
        if (!studyRoomRepository.existsById(studyRoomId)) {
            throw new EntityNotFoundException("Study room not found with id: " + studyRoomId);
        }
        studyRoomRepository.deleteById(studyRoomId);
    }
}
