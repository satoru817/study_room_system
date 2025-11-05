package org.example.studyroomreservation.studyroom;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StudyRoomRepository extends JpaRepository<StudyRoom, Integer> {
    @Query("""
            SELECT sr
            FROM StudyRoom sr
            WHERE sr.cramSchool.cramSchoolId = :cramSchoolId
            """)
    List<StudyRoom> findAllByCramSchoolId(int cramSchoolId);
}
