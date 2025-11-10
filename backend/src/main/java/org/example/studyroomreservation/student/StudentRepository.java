package org.example.studyroomreservation.student;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Integer> {
    String loginDtoQueryCommon = """
            SELECT NEW org.example.studyroomreservation.student.StudentLoginDTO(
                s.studentId,
                s.el1,
                s.name,
                s.furigana,
                c.name,
                s.cardId,
                s.mail,
                sli.loginName,
                sli.password,
                s.lineUserId,
                c.email,
                c.lineChannelToken
            )
            FROM StudentLoginInfo sli
            JOIN sli.student s
            JOIN s.cramSchool c
            """;


    @Query( loginDtoQueryCommon + """
            WHERE sli.loginName = :loginName
            """)
    StudentLoginDTO getStudentLoginDTOByLoginName(String loginName);

    @Query("""
            SELECT NEW org.example.studyroomreservation.student.StudentStatus(
                s.studentId,
                s.name,
                s.el1,
                s.mail,
                srr.studyRoomReservationId IS NOT NULL,
                sra.studyRoomAttendanceId IS NOT NULL,
                sli.studentLoginInfoId IS NOT NULL
            )
            FROM Student s
            JOIN s.cramSchool cs ON cs.cramSchoolId = :cramSchoolId AND s.el1 >= :minEl1
            LEFT JOIN StudyRoomReservation srr ON srr.student = s AND srr.date = :today AND srr.startHour <= :now AND srr.endHour >= :now
            LEFT JOIN StudyRoomAttendance sra ON sra.studyRoomReservation = srr
            LEFT JOIN StudentLoginInfo sli ON sli.student = s
            """)
    Page<StudentStatus> getStatuses(int cramSchoolId, LocalDate today, LocalTime now, int minEl1, Pageable pageable);

    @Query( """
            SELECT NEW org.example.studyroomreservation.student.StudentLoginDTO(
                s.studentId,
                s.el1,
                s.name,
                s.furigana,
                c.name,
                s.cardId,
                s.mail,
                '',
                '',
                s.lineUserId,
                c.email,
                c.lineChannelToken
            )
            FROM Student s
            JOIN s.cramSchool c
            WHERE s.studentId IN :studentIds
            """)
    List<StudentLoginDTO> getLoginDtosInIds(List<Integer> studentIds);

    @Query(loginDtoQueryCommon + """
            WHERE s.studentId = :studentId
            """)
    StudentLoginDTO getStudentLoginDTOByStudentId(int studentId);
}
