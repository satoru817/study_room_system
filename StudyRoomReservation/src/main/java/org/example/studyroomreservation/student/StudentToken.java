package org.example.studyroomreservation.student;

import jakarta.persistence.*;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_tokens")
public class StudentToken {
    @Transient
    private final static long VALID_DAYS = 7L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer studentTokenId;

    @Column(nullable = false, unique = true)
    private String token;

    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private LocalDateTime validUntil;

    //------------------------------------------------
    //      CONSTRUCTORS
    //------------------------------------------------
    protected StudentToken() {}

    private StudentToken(Builder builder) {
        this.token = builder.token;
        this.student = builder.student;
        this.user = builder.user;
        this.validUntil = builder.validUntil;
    }

    //---------------------------------------------------------------
    //             GETTERS
    //---------------------------------------------------------------
    public Integer getStudentTokenId() { return studentTokenId; }
    public String getToken() { return token; }
    public Student getStudent() { return student; }
    public User getUser() { return user; }
    public LocalDateTime getValidUntil() { return validUntil; }
    public boolean isValid() { return TokyoTimeElf.getTokyoLocalDateTime().isBefore(validUntil); }

    public static class Builder {
        private Student student;
        private User user;
        private final LocalDateTime validUntil = TokyoTimeElf.getTokyoLocalDateTime().plusDays(VALID_DAYS);
        private final String token = UUID.randomUUID().toString();

        public Builder student(Student student) { this.student = student; return this; }
        public Builder user(User user) { this.user = user; return this; }

        public StudentToken build() {
            if(student == null) throw new IllegalArgumentException("student must not be null");
            if(user == null) throw new IllegalArgumentException("user must not be null");
            return new StudentToken(this);
        }
    }
}
