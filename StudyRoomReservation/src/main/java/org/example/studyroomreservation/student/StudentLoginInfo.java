package org.example.studyroomreservation.student;

import jakarta.persistence.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Entity
@Table(name = "student_login_infos")
public class StudentLoginInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int studentLoginInfoId;

    @Column(nullable = false, unique = true)
    private String loginName;

    @Column(nullable = false)
    private String password;

    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;

    // JUST FOR JPA
    protected StudentLoginInfo() {}

    public StudentLoginInfo(String loginName, String hashedPassword, Student student) {
        if(loginName == null || loginName.isBlank()) throw new IllegalArgumentException("loginName must not be blank");
        if(hashedPassword == null || hashedPassword.isBlank()) throw new IllegalArgumentException("password must not be blank");
        if(student == null) throw new IllegalArgumentException("student must not be null");

        this.loginName = loginName;
        this.password = hashedPassword;
        this.student = student;
    }

    public int getStudentLoginInfoId() { return studentLoginInfoId; }
    public String getLoginName() { return loginName; }
    public String getPassword() { return password; }
    public Student getStudent() { return student; }
}
