package org.example.studyroomreservation.studyroom.reservation;

import org.example.studyroomreservation.studyroom.dto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface StudyRoomReservationRepository extends JpaRepository<StudyRoomReservation, Integer> {
    @Query("""
            SELECT NEW org.example.studyroomreservation.studyroom.reservation.DTO$ReservationShowResponse(
                srr.studyRoom.studyRoomId,
                srr.studyRoom.name,
                srr.startHour,
                srr.endHour,
                sra.startHour IS NOT NULL,
                sra.endHour IS NOT NULL
            )
            FROM StudyRoomReservation srr
            LEFT JOIN StudyRoomAttendance sra ON sra.studyRoomReservation = srr
            WHERE srr.student.studentId = :studentId
            AND srr.date = :today
            """)
    List<DTO.ReservationShowResponse> getReservationOfOneStudentOfThisDay(int studentId, LocalDate today);

    @Query("""
            SELECT srr
            FROM StudyRoomReservation srr
            WHERE srr.studyRoom.studyRoomId = :studyRoomId
            AND srr.date = :date
            """)
    List<StudyRoomReservation> getReservationsOfOneRoomOfOneDay(int studyRoomId, LocalDate date);

    @Query("""
            SELECT srr
            FROM StudyRoomReservation srr
            LEFT JOIN StudyRoomScheduleException srse ON srse.date = srr.date AND srse.studyRoom.studyRoomId = :studyRoomId
            WHERE srr.studyRoom.studyRoomId = :studyRoomId
                AND srr.date > :today
                AND srse.studyRoomScheduleExceptionId IS NULL
            """)
    List<StudyRoomReservation> findRegularReservationsByStudyRoomIdAndDateGreaterThan(int studyRoomId, LocalDate today);

    @Query("""
            SELECT srr
            FROM StudyRoomReservation srr
            LEFT JOIN StudyRoomScheduleException srse ON srse.date = srr.date AND srse.studyRoom = srr.studyRoom
            WHERE srr.studyRoom.studyRoomId IN :toStudyRoomIds
                AND srr.date > :today
                AND srse.studyRoomScheduleExceptionId IS NULL
            """)
    List<StudyRoomReservation> getReservationsOfRegularScheduleOfRooms(List<Integer> toStudyRoomIds, LocalDate today);

    // Using complex JPQL for performance with large datasets instead of filtering in Java code.
    // Selects reservations that are completely invalid after schedule copy:
    // - Room is closed that day (is_open = false)
    // - Exception exists but no time overlap with reservation
    // - No exception and no regular schedule overlap with reservation
    @Query("""
            SELECT DISTINCT srr
            FROM StudyRoomReservation srr
            JOIN srr.studyRoom sr ON
                sr.studyRoomId IN :toStudyRoomIds 
                AND srr.date > :today
                AND YEAR(srr.date) = :year 
                AND MONTH(srr.date) = :month
            LEFT JOIN StudyRoomScheduleException srse ON 
                srr.studyRoom = srse.studyRoom
                AND srr.date = srse.date
            LEFT JOIN StudyRoomScheduleException srse1 ON
                srr.studyRoom = srse1.studyRoom
                AND srr.date = srse1.date
                AND srse1.isOpen
                AND NOT (
                    (srse1.openTime >= srr.endHour)
                    OR (srse1.closeTime <= srr.startHour)
                )
            LEFT JOIN StudyRoomRegularSchedule srrs ON
                srse.studyRoomScheduleExceptionId IS NULL
                AND srrs.studyRoom = srr.studyRoom
                AND DAYNAME(srr.date) = srrs.dayOfWeek
                AND NOT (
                    (srrs.openTime >= srr.endHour)
                    OR (srrs.closeTime <= srr.startHour)
                )
            WHERE srse.isOpen = FALSE
                OR (srse.isOpen = TRUE AND srse1.studyRoomScheduleExceptionId IS NULL)
                OR (srse.isOpen IS NULL AND srrs.studyRoomRegularScheduleId IS NULL)
            """)
    List<StudyRoomReservation> getToBeDeleted(List<Integer> toStudyRoomIds, int year, int month, LocalDate today);

    // Using complex JPQL for performance with large datasets instead of filtering in Java code.
    // Selects reservations with partial overlap after schedule copy (need time adjustment):
    // - Exception exists and partially overlaps reservation time
    // - No exception, regular schedule exists and partially overlaps reservation time
    @Query("""
            SELECT DISTINCT srr
            FROM StudyRoomReservation srr
            JOIN srr.studyRoom sr ON
                sr.studyRoomId IN :toStudyRoomIds
                AND srr.date > :today
                AND YEAR(srr.date) = :year
                AND MONTH(srr.date) = :month
            LEFT JOIN StudyRoomScheduleException srse ON
                srse.studyRoom = sr
                AND srr.date = srse.date
            LEFT JOIN StudyRoomScheduleException srse1 ON
                srse1.isOpen = TRUE
                AND sr = srse1.studyRoom
                AND srr.date = srse1.date
                AND (
                    (srse1.openTime > srr.startHour AND srse1.openTime < srr.endHour)
                    OR (srse1.closeTime > srr.startHour AND srse1.closeTime < srr.endHour)
                )
            LEFT JOIN StudyRoomRegularSchedule srrs ON
                srse.studyRoomScheduleExceptionId IS NULL
                AND srrs.studyRoom = sr
                AND DAYNAME(srr.date) = srrs.dayOfWeek
                AND (
                    (srrs.openTime > srr.startHour AND srrs.openTime < srr.endHour)
                    OR (srrs.closeTime > srr.startHour AND srrs.closeTime < srr.endHour)
                )
            WHERE srse1.studyRoomScheduleExceptionId IS NOT NULL
                OR srrs.studyRoomRegularScheduleId IS NOT NULL
            """)
    List<StudyRoomReservation> getToBeModified(List<Integer> toStudyRoomIds, int year, int month, LocalDate today);
}
