package org.example.studyroomreservation.studyroom;

import org.example.studyroomreservation.cramschool.CramSchoolService;
import org.example.studyroomreservation.entity.CramSchool;
import org.example.studyroomreservation.entity.StudyRoomReservation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/studyRoom")
public class StudyRoomController {
    @Autowired
    private StudyRoomService studyRoomService;
    @Autowired
    private CramSchoolService cramSchoolService;

    @GetMapping("/getAll/{cramSchoolId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getAllStudyRoom(@PathVariable(name = "cramSchoolId") int cramSchoolId){
        List<StudyRoom> studyRooms = studyRoomService.findAllByCramSchoolId(cramSchoolId);
        return ResponseEntity.ok(studyRooms);
    }

    @Transactional
    @PostMapping("/create/{cramSchoolId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> createStudyRoom(@PathVariable int cramSchoolId, @RequestBody StudyRoomCreateRequest request) {
        try {
            CramSchool cramSchool = cramSchoolService.getById(cramSchoolId);
            StudyRoom studyRoom = request.convert(cramSchool);
            studyRoomService.save(studyRoom);
            return ResponseEntity.ok(studyRoom);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

}
