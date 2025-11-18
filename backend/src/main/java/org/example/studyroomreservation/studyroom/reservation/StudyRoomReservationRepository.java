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
            FROM StudyRoomReservations srr
            WHERE srr.studyRoom.studyRoomId = :studyRoomId
            AND srr.date = :date
            """)
    List<StudyRoomReservation> getReservationsOfOneRoomOfOneDay(int studyRoomId, LocalDate date)
}
