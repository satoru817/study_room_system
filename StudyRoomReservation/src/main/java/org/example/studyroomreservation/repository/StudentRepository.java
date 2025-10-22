package org.example.studyroomreservation.repository;

import org.example.studyroomreservation.dto.StudentLoginDTO;
import org.example.studyroomreservation.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StudentRepository extends JpaRepository<Student, Integer> {
    @Query("""
            SELECT NEW org.example.studyroomreservation.dto.StudentLoginDTO(
                s.studentId,
                s.el1,
                s.name,
                s.furigana,
                c.name,
                s.cardId,
                s.mail,
                sli.loginName,
                sli.password
            )
            FROM StudentLoginInfo sli
            JOIN sli.student s
            JOIN s.cramSchool c
            WHERE sli.loginName = :loginName
            """)
    public StudentLoginDTO getStudentLoginDTOByLoginName(String loginName);
}
