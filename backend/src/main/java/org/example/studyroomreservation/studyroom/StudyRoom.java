package org.example.studyroomreservation.studyroom;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.example.studyroomreservation.cramschool.CramSchool;

@Entity
@Table(name = "study_rooms")
public class StudyRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int studyRoomId;

    @Column
    private String name;

    @Column
    private int roomLimit;

    @ManyToOne
    @JoinColumn(name = "cram_school_id")
    @JsonIgnore
    private CramSchool cramSchool;

    // JUST FOR JPA
    protected StudyRoom() {}

    public StudyRoom(String name, int limit, CramSchool cramSchool) {
        if(name == null || name.isBlank()) throw new IllegalArgumentException("name must not be blank");
        if(limit < 0) throw new IllegalArgumentException("limit must be >= 0");
        if(cramSchool == null) throw new IllegalArgumentException("cramSchool must not be null");

        this.name = name;
        this.roomLimit = limit;
        this.cramSchool = cramSchool;
    }

    public int getStudyRoomId() { return studyRoomId; }
    public String getName() { return name; }
    public int getRoomLimit() { return roomLimit; }
    public CramSchool getCramSchool() { return cramSchool; }

    @JsonProperty("cramSchoolId")
    public int getCramSchoolId() {
        return cramSchool != null ? cramSchool.getCramSchoolId() : 0;
    }

    @JsonProperty("cramSchoolName")
    public String getCramSchoolName() {
        return cramSchool != null ? cramSchool.getName() : null;
    }

    public void setName(String name) { this.name = name; }
    public void setRoomLimit(int limit) { this.roomLimit = limit; }
    public void setCramSchool(CramSchool cramSchool) { this.cramSchool = cramSchool; }
}