package org.example.studyroomreservation.student;

import jakarta.servlet.http.HttpServletRequest;
import org.example.studyroomreservation.config.security.user.TeacherUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.example.studyroomreservation.elf.AccessElf;
import org.example.studyroomreservation.notification.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {
    @Autowired
    private StudentService studentService;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private AccessElf accessElf;

    // StudentController.java
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody StudentRegistrationRequest request) {
        try {
            studentService.register(request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Registration successful"));
        }
        catch (IllegalArgumentException e) {
            // validation error from compact constructor
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage() // "Password must be at least 8 characters"
            ));
        }
        catch (InvalidTokenException | DuplicateLoginNameException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/isValidLoginName")
    public ResponseEntity<?> isValid(@RequestParam String tentativeLoginName) {
        try {
            boolean isValidLoginName = studentService.isValidLoginName(tentativeLoginName);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "isValid", isValidLoginName
            ));
        }
        catch (org.springframework.dao.DataAccessException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Database error occurred while validating login name"
            ));
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "An unexpected error occurred"
            ));
        }
    }

    @GetMapping("/getStatuses/{cramSchoolId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getStatuses(@PathVariable int cramSchoolId,
                                         @RequestParam(defaultValue = "0", required = false) int page,
                                         @RequestParam(defaultValue = "10", required = false) int size,
                                         @RequestParam(defaultValue = "el1", required = false) String sort,
                                         @RequestParam(defaultValue = "DSC", required = false) String direction){
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        Page<StudentStatus> studentStatuses = studentService.getStatuses(cramSchoolId, pageable);
        return ResponseEntity.ok(studentStatuses);
    }

    @PostMapping("/register-email")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> updateMail(@RequestBody EmailRegisterRequest request) {
        studentService.updateEmail(request);
        return ResponseEntity.status(HttpStatus.OK).body(null);
    }

    @PostMapping("/send-register-link")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> sendRegisterLink(@RequestBody List<Integer> studentIds, HttpServletRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        TeacherUser teacher = (TeacherUser) userDetails.loginClient();
        int userId = teacher.user.getUserId();
        DTO.NotificationSuccessStatus status = notificationService.sendRegistrationUrl(
                studentIds,
                request,
                userId
        );
        return ResponseEntity.ok(status);
    }

    @GetMapping("/get/{studentId}")
    public ResponseEntity<?> getStudentName(@PathVariable int studentId, @AuthenticationPrincipal UserDetailsImpl userDetails) throws IllegalAccessException {
        accessElf.isValidAccess(studentId, userDetails);
        String name = studentService.getName(studentId);
        return ResponseEntity.ok(name);
    }



}
