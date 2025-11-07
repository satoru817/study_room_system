package org.example.studyroomreservation.studyroom.reservation;

import org.example.studyroomreservation.studyroom.dto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface StudyRoomReservationRepository extends JpaRepository<StudyRoomReservation, Integer> {
    @Query("""
            SELECT NEW org.example.studyroomreservation.studyroom.reservation.DTO$ReservationShowResponse(
                srr.studyRoom.name,
                srr.startHour,
                srr.endHour
            )
            FROM StudyRoomReservation srr
            WHERE srr.student.studentId = :studentId
            AND srr.date = :today
            """)
    List<DTO.ReservationShowResponse> getReservationOfOneStudentOfThisDay(int studentId, LocalDate today);

}
