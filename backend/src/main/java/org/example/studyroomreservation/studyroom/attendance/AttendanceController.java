package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.example.studyroomreservation.elf.AccessElf;
import org.example.studyroomreservation.entity.User;
import org.example.studyroomreservation.student.StudentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

@Controller
@RequestMapping("/api/attendance")
public class AttendanceController {
    private static final Logger log = LoggerFactory.getLogger(AttendanceController.class);
    @Autowired
    private AttendanceValidator validator;
    @Autowired
    private AttendanceService attendanceService;
    @Autowired
    private AccessElf accessElf;
    @Autowired
    private StudentService studentService;

    @PostMapping("/record/{studentId}")
    public ResponseEntity<?> attend(@RequestBody DTO.AttendanceRequest request,
                                    @AuthenticationPrincipal UserDetailsImpl userDetails, @PathVariable int studentId) {
        try {
            accessElf.isValidAccess(studentId, userDetails);
            Integer reservationId = request.validate(validator, studentId);
            StudentUser student = studentService.getStudentUserByStudentId(studentId);
            if (reservationId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "有効な予約が見つかりません。予約時間内か確認してください。"));
            }

            attendanceService.attend(reservationId, student, request);

            return ResponseEntity.ok()
                    .body(Map.of("message", "出席を記録しました"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));

        } catch (Exception e) {
            log.error("Failed to record attendance for student: {}, Error: {}", studentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "出席記録に失敗しました。もう一度お試しください。"));
        }
    }

    @PostMapping("/checkout/{studentId}")
    public ResponseEntity<?> checkout(@RequestBody DTO.CheckoutRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails, @PathVariable int studentId)
    {
        try {
            accessElf.isValidAccess(studentId, userDetails);
            Integer reservationId = request.validate(validator, studentId);
            StudentUser student = studentService.getStudentUserByStudentId(studentId);
            attendanceService.checkout(reservationId, student);
            return ResponseEntity.ok()
                    .body(Map.of("message", "退出を記録しました"));
        } catch (Exception e) {
            log.error("Failed to record checkout for student: {}, Error: {}", studentId, e.getMessage(), e);
            throw new RuntimeException(e);
        }

    }

    @PostMapping("/histories/{studentId}")
    public ResponseEntity<?> getHistoriesOfThisStudent(@PathVariable int studentId, @RequestBody DTO.AttendanceHistoryRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails)
    {
        try {
            accessElf.isValidAccess(studentId, userDetails);
            DTO.AttendanceHistoryResponse response = attendanceService.createHistoryResponse(request, studentId);
            return ResponseEntity.ok()
                    .body(response);
        } catch (Exception e) {
            log.error("Failed to get attendance histories for student: {}, Error: {}", studentId, e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }
}
