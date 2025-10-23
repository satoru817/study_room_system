package org.example.studyroomreservation.student;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {

    private final StudentTokenRepository studentTokenRepository;
    private final StudentLoginInfoRepository studentLoginInfoRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public StudentService(
            StudentTokenRepository studentTokenRepository,
            StudentLoginInfoRepository studentLoginInfoRepository
    ) {
        this.studentTokenRepository = studentTokenRepository;
        this.studentLoginInfoRepository = studentLoginInfoRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
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
}