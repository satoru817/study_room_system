package org.example.studyroomreservation.cramschool;

import org.example.studyroomreservation.config.security.user.TeacherUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@RequestMapping("/api/cramschool")
@Controller
public final class CramSchoolController {
    @Autowired
    private CramSchoolService cramSchoolService;

    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/get")
    public ResponseEntity<?> getAllOfOneTeacher(@AuthenticationPrincipal UserDetailsImpl userDetails)
    {
        TeacherUser user = userDetails.convertToTeacher();
        List<CramSchool> cramschools = cramSchoolService.getAllByTeacher(user);
        return ResponseEntity.ok(cramschools);
    }

}

