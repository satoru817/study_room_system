package org.example.studyroomreservation.student;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {
    @Autowired
    private StudentService studentService;

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

    @GetMapping("/getStatuses/{cramSchoolId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> getStatuses(@PathVariable int cramSchoolId,
                                         @RequestParam(defaultValue = "0", required = false) int page,
                                         @RequestParam(defaultValue = "10", required = false) int size,
                                         @RequestParam(defaultValue = "name", required = false) String sort,
                                         @RequestParam(defaultValue = "ASC", required = false) String direction){
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        Page<StudentStatus> studentStatuses = studentService.getStatuses(cramSchoolId, pageable);
        return ResponseEntity.ok(studentStatuses);
    }
}
