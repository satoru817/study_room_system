package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.entity.StudyRoomReservation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyRoomReservationRepository extends JpaRepository<StudyRoomReservation, Integer> {
}
