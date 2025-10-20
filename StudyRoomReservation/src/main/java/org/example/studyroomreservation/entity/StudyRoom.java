package org.example.studyroomreservation.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "study_rooms")
public class StudyRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int studyRoomId;

    @Column
    private String name;

    @Column
    private int limit;

    @ManyToOne
    @JoinColumn(name = "cram_school_id")
    private CramSchool cramSchool;

    // JUST FOR JPA
    protected StudyRoom() {}

    public StudyRoom(String name, int limit, CramSchool cramSchool) {
        if(name == null || name.isBlank()) throw new IllegalArgumentException("name must not be blank");
        if(limit < 0) throw new IllegalArgumentException("limit must be >= 0");
        if(cramSchool == null) throw new IllegalArgumentException("cramSchool must not be null");

        this.name = name;
        this.limit = limit;
        this.cramSchool = cramSchool;
    }

    public int getStudyRoomId() { return studyRoomId; }
    public String getName() { return name; }
    public int getLimit() { return limit; }
    public CramSchool getCramSchool() { return cramSchool; }

    public void setName(String name) { this.name = name; }
    public void setLimit(int limit) { this.limit = limit; }
    public void setCramSchool(CramSchool cramSchool) { this.cramSchool = cramSchool; }
}
