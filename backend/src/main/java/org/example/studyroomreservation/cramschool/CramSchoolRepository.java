package org.example.studyroomreservation.cramschool;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CramSchoolRepository extends JpaRepository<CramSchool, Integer> {
    @Query("""
            SELECT cs
            FROM CramSchoolUser csu
            JOIN csu.cramSchool cs
            WHERE csu.user.userId = :userId
            """)
    List<CramSchool> getAllByUser(int userId);
}
