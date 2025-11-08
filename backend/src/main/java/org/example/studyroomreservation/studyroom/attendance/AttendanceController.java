package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/attendance")
public class AttendanceController {
    @Autowired
    private AttendanceValidator validator;
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/create")
    public ResponseEntity<?> attend(@RequestBody DTO.AttendanceRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        StudentUser student = userDetails.convertToStudent();
        if (!request.validate(validator, student)) throw new IllegalArgumentException("INVALID RESERVATION REQUEST BY STUDENT = " + student);

    }
}
