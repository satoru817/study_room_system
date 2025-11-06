package org.example.studyroomreservation.studyroom;

import jakarta.persistence.EntityNotFoundException;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StudyRoomService {
    @Autowired
    private StudyRoomRepository studyRoomRepository;
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

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
