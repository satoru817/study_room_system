package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Integer> {
}
