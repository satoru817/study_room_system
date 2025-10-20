package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.entity.StudentLoginInfo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentLoginInfoRepository extends JpaRepository<StudentLoginInfo, Integer> {
}
