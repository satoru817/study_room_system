package org.example.studyroomreservation.studyroom;

import org.example.studyroomreservation.cramschool.CramSchool;

public record StudyRoomCreateRequest(String name, int limit) {
    public StudyRoom convert(CramSchool cramSchool) {
        return new StudyRoom(name, limit, cramSchool);
    }
}
