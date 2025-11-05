package org.example.studyroomreservation.studyroom;

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
}
