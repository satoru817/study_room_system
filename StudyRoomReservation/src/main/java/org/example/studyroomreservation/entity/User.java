package org.example.studyroomreservation.entity;

import jakarta.persistence.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Entity
@Table(name = "users")
public class User {

    @Transient
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Id
    private int userId;

    @Column
    private String name;

    @Column
    private String password;

    @Column
    // THIS IS UNIQUE!!!
    private String email;

    //=========================
    //      Getter Methods
    //=========================
    public int getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }

    public String getEmail() {
        return email;
    }

    //=========================
    //      Instance Methods
    //=========================
    public boolean isValid(String rawPassword) {
        return encoder.matches(rawPassword, password);
    }
}
