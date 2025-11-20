package org.example.studyroomreservation.studyroom;

import org.example.studyroomreservation.notification.DTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface StudyRoomRepository extends JpaRepository<StudyRoom, Integer> {
    @Query("""
            SELECT sr
            FROM StudyRoom sr
            WHERE sr.cramSchool.cramSchoolId = :cramSchoolId
            """)
    List<StudyRoom> findAllByCramSchoolId(int cramSchoolId);

    @Query("""
            SELECT NEW org.example.studyroomreservation.studyroom.StudyRoomService$StudyRoomStatus(
                sr.studyRoomId,
                sr.name,
                sr.roomLimit,
                CAST(COALESCE(COUNT(sra.studyRoomAttendanceId),0) AS Integer)
            )
            FROM StudyRoom sr
            LEFT JOIN StudyRoomReservation srr
                ON srr.studyRoom = sr
                AND srr.date = :today
            LEFT JOIN StudyRoomAttendance sra
                ON sra.studyRoomReservation = srr
                AND sra.startHour <= :time AND sra.endHour IS NULL
            WHERE sr.cramSchool.cramSchoolId = :cramSchoolId
            GROUP BY sr.studyRoomId, sr.name, sr.roomLimit
            """)
    List<StudyRoomService.StudyRoomStatus> findAllStatusByCramSchoolId(int cramSchoolId, LocalDate today, LocalTime time);

    @Query("""
            SELECT NEW org.example.studyroomreservation.studyroom.dto.StudyRoomRegularScheduleDTO(
                srrs.studyRoom.studyRoomId,
                srrs.dayOfWeek,
                srrs.openTime,
                srrs.closeTime
            )
            FROM StudyRoomRegularSchedule srrs
            WHERE srrs.studyRoom.studyRoomId = :studyRoomId
            """)
    List<dto.StudyRoomRegularScheduleDTO> getRegularScheduleOfOneStudyRoom(int studyRoomId);

    @Query("""
            SELECT NEW org.example.studyroomreservation.notification.DTO$StudyRoomScheduleExceptionShowResponse(
                sr.studyRoomId,
                srse.date,
                srse.isOpen,
                COALESCE(srse.openTime, '00:00:00'),
                COALESCE(srse.closeTime, '00:00:00'),
                srse.reason
            )
            FROM StudyRoomScheduleException srse
            JOIN srse.studyRoom sr
            WHERE sr.studyRoomId = :studyRoomId
                AND YEAR(srse.date) = :year
                AND MONTH(srse.date) = :month
            """)
    List<DTO.StudyRoomScheduleExceptionShowResponse> getScheduleExceptionsOfOneStudyRoomOfYearMonth(int studyRoomId, int year, int month);

    @Query("""
            SELECT NEW org.example.studyroomreservation.studyroom.dto$StudyRoomShowResponseForStudent(
                sr.studyRoomId,
                sr.name
            )
            FROM StudyRoom sr
            JOIN sr.cramSchool cs
            JOIN Student s ON s.cramSchool = cs AND s.studentId = :studentId
            """)
    List<dto.StudyRoomShowResponseForStudent> getStudyRoomOfThisStudent(int studentId);
}
