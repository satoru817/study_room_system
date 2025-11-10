package org.example.studyroomreservation.elf;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.config.security.user.TeacherUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class AccessElf {
    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    public void isValidAccess(int studentId, UserDetailsImpl userDetails) throws IllegalAccessException {
        StudentUser studentUser = userDetails.convertToStudent();
        if (studentUser != null) {
            if (studentUser.getStudentId() != studentId) {
                throw new IllegalAccessException("Student can only access their own data");
            }
            return;
        }

        TeacherUser teacherUser = userDetails.convertToTeacher();
        if (teacherUser != null) {
            if (!canTeacherSeeThisStudent(teacherUser.id, studentId)) {
                throw new IllegalAccessException("Teacher does not have access to this student");
            }
            return;
        }

        throw new IllegalAccessException("Invalid user type");
    }

    private boolean canTeacherSeeThisStudent(int userId, int studentId) {
        String sql = """
            SELECT EXISTS (
                SELECT 1
                FROM cram_school_users csu
                JOIN cram_schools cs ON cs.cram_school_id = csu.cram_school_id AND csu.user_id = :userId
                JOIN students s ON s.cram_school_id = cs.cram_school_id AND s.student_id = :studentId
            )
            """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("userId", userId);
        params.addValue("studentId", studentId);

        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(sql, params, Boolean.class));
    }
}
