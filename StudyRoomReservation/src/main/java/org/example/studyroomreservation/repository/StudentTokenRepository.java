package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.entity.StudentToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentTokenRepository extends JpaRepository<StudentToken, Integer> {
}
