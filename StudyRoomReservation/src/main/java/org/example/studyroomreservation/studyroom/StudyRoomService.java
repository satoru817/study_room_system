package org.example.studyroomreservation.studyroom;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    @Modifying
    public void deleteById(int studyRoomId) {
        if (!studyRoomRepository.existsById(studyRoomId)) {
            throw new EntityNotFoundException("Study room not found with id: " + studyRoomId);
        }
        studyRoomRepository.deleteById(studyRoomId);
    }
}
