package org.example.studyroomreservation.cramschool;

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

    @Column
    private String lineChannelToken;

    protected CramSchool() {
        // for JPA
    }

    public int getCramSchoolId() { return cramSchoolId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getLineChannelToken() { return lineChannelToken ;}
}
