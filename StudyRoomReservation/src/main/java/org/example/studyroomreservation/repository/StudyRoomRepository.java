package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.entity.StudyRoom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyRoomRepository extends JpaRepository<StudyRoom, Integer> {
}
