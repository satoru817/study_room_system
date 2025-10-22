package org.example.studyroomreservation.student;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentLoginInfoRepository extends JpaRepository<StudentLoginInfo, Integer> {
    boolean existsByLoginName(String s);
}
