package org.example.studyroomreservation.student;

import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class StudentService {

    private final StudentTokenRepository studentTokenRepository;
    private final StudentLoginInfoRepository studentLoginInfoRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final StudentRepository studentRepository;
    private final JdbcTemplate jdbcTemplate;

    public StudentService(
            StudentTokenRepository studentTokenRepository,
            StudentLoginInfoRepository studentLoginInfoRepository,
            StudentRepository studentRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.studentTokenRepository = studentTokenRepository;
        this.studentLoginInfoRepository = studentLoginInfoRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.studentRepository = studentRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void register(StudentRegistrationRequest request) {
        // 2. Validate token
        StudentToken studentToken = studentTokenRepository.findByToken(request.token());
        if (studentToken == null || !studentToken.isValid()) {
            throw new InvalidTokenException("Invalid or expired registration token");
        }

        // 3. Check duplicate login name
        if (studentLoginInfoRepository.existsByLoginName(request.loginName())) {
            throw new DuplicateLoginNameException("Login name already exists");
        }

        // 4. Hash password HERE (in Service layer)
        String hashedPassword = passwordEncoder.encode(request.password());

        // 5. Create and save login info
        StudentLoginInfo loginInfo = new StudentLoginInfo(
                request.loginName(),
                hashedPassword,  // Pass hashed password
                studentToken.getStudent()
        );
        studentLoginInfoRepository.save(loginInfo);

        // 6. Delete token when used
        studentTokenRepository.delete(studentToken);
    }

    public Page<StudentStatus> getStatuses(int cramSchoolId, Pageable pageable) {
        LocalDateTime now = TokyoTimeElf.getTokyoLocalDateTime();
        int minEl1 = TokyoTimeElf.getMinEl1();
        return studentRepository.getStatuses(cramSchoolId, now.toLocalDate(), now.toLocalTime(), minEl1, pageable);
    }

    @Transactional
    public void updateEmail(EmailRegisterRequest request) {

        int rowsAffected = jdbcTemplate.update(
                "UPDATE students SET mail = ? WHERE student_id = ?",
                request.email(),
                request.studentId()
        );

        if (rowsAffected == 0) {
            throw new IllegalArgumentException(
                    "Student not found with ID: " + request.studentId()
            );
        }
    }

    public List<StudentLoginDTO> getLoginDtosInIds(List<Integer> studentIds) {
        return studentRepository.getLoginDtosInIds(studentIds);
    }
}