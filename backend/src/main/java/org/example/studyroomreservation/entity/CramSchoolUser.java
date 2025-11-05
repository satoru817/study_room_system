package org.example.studyroomreservation.entity;

import jakarta.persistence.*;
import org.example.studyroomreservation.cramschool.CramSchool;

@Entity
@Table(name = "cram_school_users")
public class CramSchoolUser {

    @Id
    private Integer cramSchoolUserId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "cram_school_id")
    private CramSchool cramSchool;

    protected CramSchoolUser() {
    }

    public Integer getCramSchoolUserId() {
        return cramSchoolUserId;
    }

    public User getUser() {
        return user;
    }

    public CramSchool getCramSchool() {
        return cramSchool;
    }
}
