package org.example.studyroomreservation.studyroom;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.config.security.user.TeacherUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.example.studyroomreservation.cramschool.CramSchoolService;
import org.example.studyroomreservation.cramschool.CramSchool;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.core.Local;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/studyRoom")
public class StudyRoomController {
    @Autowired
    private StudyRoomService studyRoomService;
    @Autowired
    private CramSchoolService cramSchoolService;

    @GetMapping("/get/{cramSchoolId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getAllStudyRoom(@PathVariable(name = "cramSchoolId") int cramSchoolId){
        List<StudyRoomService.StudyRoomStatus> studyRooms = studyRoomService.findAllByCramSchoolId(cramSchoolId);
        return ResponseEntity.ok(studyRooms);
    }

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

    public record StudyRoomCreateRequest(String name, int roomLimit) {
        public StudyRoom convert(CramSchool cramSchool) {
            return new StudyRoom(name, roomLimit, cramSchool);
        }
    }

    // TODO: implement UI
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{studyRoomId}")
    public ResponseEntity<?> deleteStudyRoom(@PathVariable int studyRoomId) {
        studyRoomService.deleteById(studyRoomId);
        return ResponseEntity.ok("delete successful");
    }

    public record StudyRoomEditRequest(int studyRoomId, String name, int roomLimit){}

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/edit")
    public ResponseEntity<?> editStudyRoom(@RequestBody StudyRoomEditRequest request)
    {
        try {
            studyRoomService.update(request);
            return ResponseEntity.ok(new StudyRoomService.StudyRoomStatus(request.studyRoomId, request.name, request.roomLimit, 0));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/regularSchedule/get")
    public ResponseEntity<?> getRegularScheduleOfOneStudyRoom(@RequestParam int studyRoomId)
    {
        List<StudyRoomRegularScheduleDTO> regularSchedules = studyRoomService.getRegularSchedulesOfOneStudyRoom(studyRoomId);
        return ResponseEntity.ok(regularSchedules);
    }

    public record StudyRoomRegularScheduleDTO(int studyRoomId, TokyoTimeElf.DayOfWeek dayOfWeek, LocalTime openTime, LocalTime closeTime){}

    public record StudyRoomScheduleExceptionShowRequest(int studyRoomId, int year, int month){}
    public record StudyRoomScheduleExceptionShowResponse(int studyRoomId, LocalDate date, boolean isOpen, LocalTime openTime, LocalTime closeTime, String reason){}
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/scheduleException/get")
    public ResponseEntity<?> getScheduleExceptionsOfOneStudyRoom(@ModelAttribute StudyRoomScheduleExceptionShowRequest request)
    {
        List<StudyRoomScheduleExceptionShowResponse> responses = studyRoomService.getScheduleExceptionsOfOneStudyRoom(request);
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/regularSchedule/save")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> saveRegularScheduleOfOneStudyRoom(@RequestBody dto.RegularScheduleBulkSaveRequest request)
    {
        List<StudyRoomRegularScheduleDTO> dtos = studyRoomService.bulkUpdateRegularScheduleOfOneStudyRoom(request);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/scheduleException/save")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> saveStudyRoomScheduleException(@RequestBody dto.StudyRoomScheduleExceptionOfOneDate request)
    {
        List<StudyRoomScheduleExceptionShowResponse> responses = studyRoomService.saveException(request);
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/scheduleException/delete")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> deleteStudyRoomScheduleException(@RequestBody dto.StudyRoomScheduleExceptionDeleteRequest deleteRequest)
    {
        List<StudyRoomScheduleExceptionShowResponse> response = studyRoomService.deleteExceptionOfOneDay(deleteRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ofStudent")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudyRoomOfThisStudent(@AuthenticationPrincipal UserDetailsImpl userDetails)
    {
        StudentUser student = userDetails.convertToStudent();
        List<dto.StudyRoomShowResponseForStudent> studyRooms = studyRoomService.getStudyRoomsOfStudent(student);
        return ResponseEntity.ok(studyRooms);
    }

    @GetMapping("/get/thisTeachers")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getThisTeachersStudyRoom(@AuthenticationPrincipal UserDetailsImpl userDetails){
        TeacherUser teacherUser = userDetails.convertToTeacher();
        List<dto.StudyRoomShow> studyRooms = studyRoomService.getThisTeachers(teacherUser);
        return ResponseEntity.ok(studyRooms);
    }

    @PostMapping("/regularSchedule/copy")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> copyRegularSchedule(@RequestBody dto.CopyRegularScheduleRequest request) throws JsonProcessingException {
        studyRoomService.copyRegularSchedule(request);
        return ResponseEntity.ok().body("copy of regular schedule success");
    }

    @PostMapping("/scheduleException/copy")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> copyScheduleExceptionOfYearMonth(@RequestBody dto.CopyScheduleExceptionRequest request) throws JsonProcessingException {
        studyRoomService.copyScheduleException(request);
        return ResponseEntity.ok().body("copy of schedule exception success");
    }
}
