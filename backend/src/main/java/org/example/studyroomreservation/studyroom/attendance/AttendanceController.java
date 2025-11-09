package org.example.studyroomreservation.studyroom.attendance;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.example.studyroomreservation.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

@Controller
@RequestMapping("/api/attendance")
public class AttendanceController {
    @Autowired
    private AttendanceValidator validator;
    @Autowired
    private AttendanceService attendanceService;

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/record")
    public ResponseEntity<?> attend(@RequestBody DTO.AttendanceRequest request,
                                    @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            StudentUser student = userDetails.convertToStudent();
            Integer reservationId = request.validate(validator, student);

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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "出席記録に失敗しました。もう一度お試しください。"));
        }
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody DTO.CheckoutRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails)
    {
        try {
            StudentUser student = userDetails.convertToStudent();
            Integer reservationId = request.validate(validator, student);
            attendanceService.checkout(reservationId, student);
            return ResponseEntity.ok()
                    .body(Map.of("message", "退出を記録しました"));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/histories")
    public ResponseEntity<?> getHistoriesOfThisStudent(@RequestBody DTO.AttendanceHistoryRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails)
    {
        try {
            StudentUser student = userDetails.convertToStudent();
            DTO.AttendanceHistoryResponse response = attendanceService.createHistoryResponse(request, student);
            return ResponseEntity.ok()
                    .body(response);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
