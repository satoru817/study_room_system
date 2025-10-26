package org.example.studyroomreservation.studyroom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudyRoomService {
    @Autowired
    private StudyRoomRepository studyRoomRepository;

    public List<StudyRoom> findAllByCramSchoolId(int cramSchoolId) {
        try {
            List<StudyRoom> studyRooms = studyRoomRepository.findAllByCramSchoolId(cramSchoolId);
            return studyRooms;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void save(StudyRoom studyRoom) {
        studyRoomRepository.save(studyRoom);
    }
}
