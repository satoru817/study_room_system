package org.example.studyroomreservation.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "cram_schools")
public class CramSchool {

    //--------------------------------------------------
    // THIS CLASS IS READONLY IN THIS APP
    //--------------------------------------------------
    @Id
    private int cramSchoolId;

    @Column
    private String name;

    @Column
    private String email;

    protected CramSchool() {
        // for JPA
    }

    public int getCramSchoolId() { return cramSchoolId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
}
