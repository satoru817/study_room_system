package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.studyroom.StudyRoomScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyRoomScheduleRepository extends JpaRepository<StudyRoomScheduleException, Integer> {
}
