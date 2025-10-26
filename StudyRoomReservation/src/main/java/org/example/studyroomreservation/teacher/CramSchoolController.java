package org.example.studyroomreservation.teacher;

import org.example.studyroomreservation.config.security.user.TeacherUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.example.studyroomreservation.cramschool.CramSchoolService;
import org.example.studyroomreservation.entity.CramSchool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cramSchool")
public class CramSchoolController {
    private static final Logger log = LoggerFactory.getLogger(CramSchoolController.class);
    @Autowired
    private CramSchoolService cramSchoolService;

    @GetMapping("/relatedCramSchools")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getRelatedCramSchools(@AuthenticationPrincipal UserDetailsImpl userDetails){
        TeacherUser teacher = (TeacherUser) userDetails.loginClient();
        List<CramSchool> cramSchools = cramSchoolService.getAllByTeacher(teacher);
        System.out.println("cramSchools" + cramSchools);
        return ResponseEntity.ok(cramSchools);
    }

}
