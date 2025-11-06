package org.example.studyroomreservation.studyroom;

import jakarta.persistence.EntityNotFoundException;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudyRoomService {
    @Autowired
    private StudyRoomRepository studyRoomRepository;
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;
    private static String INVALID_TIME = "00:00:00";

    public List<StudyRoomStatus> findAllByCramSchoolId(int cramSchoolId) {
        try {
            LocalDateTime now = TokyoTimeElf.getTokyoLocalDateTime();
            LocalDate today = now.toLocalDate();
            LocalTime time = now.toLocalTime();
            List<StudyRoomStatus> studyRooms = studyRoomRepository.findAllStatusByCramSchoolId(cramSchoolId, today, time);
            return studyRooms;
        } catch (Exception e) {
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

    public List<StudyRoomController.StudyRoomRegularScheduleDTO> getRegularSchedulesOfOneStudyRoom(int studyRoomId) {
        return studyRoomRepository.getRegularScheduleOfOneStudyRoom(studyRoomId);
    }

    public List<StudyRoomController.StudyRoomScheduleExceptionShowResponse> getScheduleExceptionsOfOneStudyRoom(StudyRoomController.StudyRoomScheduleExceptionShowRequest request) {
        try {
            return studyRoomRepository.getScheduleExceptionsOfOneStudyRoomOfYearMonth(request.studyRoomId(), request.year(), request.month());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Transactional
    public List<StudyRoomController.StudyRoomRegularScheduleDTO> bulkUpdateRegularScheduleOfOneStudyRoom(dto.RegularScheduleBulkSaveRequest request) {
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

        return getRegularSchedulesOfOneStudyRoom(studyRoomId);
    }

    @Transactional
    public List<StudyRoomController.StudyRoomScheduleExceptionShowResponse> saveException(dto.StudyRoomScheduleExceptionOfOneDate request) {
        String deleteSql = """
                DELETE FROM study_room_schedule_exceptions srse
                WHERE srse.study_room_id = :studyRoomId
                AND srse.date = :date
                """;
        int studyRoomId = request.studyRoomId();
        LocalDate date = request.date();
        Map<String, Object> map = new HashMap<>();
        map.put("studyRoomId", studyRoomId);
        map.put("date", date);
        // delete all first
        jdbcTemplate.update(deleteSql, map);

        String insertSql = """
                INSERT INTO study_room_schedule_exceptions (study_room_id, date, is_open, open_time, close_time, reason)
                VALUES (:studyRoomId, :date, :isOpen, :openTime, :closeTime, :reason)
                """;
        if (!request.isOpen()) {
            map.put("isOpen", false);
            map.put("openTime", INVALID_TIME);
            map.put("closeTime", INVALID_TIME);
            map.put("reason", request.reason());
            jdbcTemplate.update(insertSql, map);
        }
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
        }

        return studyRoomRepository.getScheduleExceptionsOfOneStudyRoomOfYearMonth(studyRoomId, date.getYear(), date.getMonthValue());
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
