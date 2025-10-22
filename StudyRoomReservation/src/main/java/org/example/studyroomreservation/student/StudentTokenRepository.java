package org.example.studyroomreservation.student;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentTokenRepository extends JpaRepository<StudentToken, Integer> {
    StudentToken findByToken(String token);
}
