package org.example.studyroomreservation.student;

import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class StudentService {

    private final StudentTokenRepository studentTokenRepository;
    private final StudentLoginInfoRepository studentLoginInfoRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final StudentRepository studentRepository;

    public StudentService(
            StudentTokenRepository studentTokenRepository,
            StudentLoginInfoRepository studentLoginInfoRepository,
            StudentRepository studentRepository
    ) {
        this.studentTokenRepository = studentTokenRepository;
        this.studentLoginInfoRepository = studentLoginInfoRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.studentRepository = studentRepository;
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

        return studentRepository.getStatuses(cramSchoolId, now.toLocalDate(), now.toLocalTime(), pageable);
    }
}