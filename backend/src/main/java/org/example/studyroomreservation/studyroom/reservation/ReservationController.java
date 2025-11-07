package org.example.studyroomreservation.studyroom.reservation;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.example.studyroomreservation.studyroom.dto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/api/reservation")
public class ReservationController {
    @Autowired
    private ReservationService reservationService;

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/getTodays")
    public ResponseEntity<?> getReservationOfToday(@AuthenticationPrincipal UserDetailsImpl userDetails)
    {
        StudentUser student = userDetails.convertToStudent();
        List<DTO.ReservationShowResponse> response = reservationService.getReservationsOfOneStudentOfToday(student);
        return ResponseEntity.ok(response);
    }

    /**
     *
     * @param studyRoomId
     * @param offset this means how many weeks ahead
     * @return
     */
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/weekly")
    public ResponseEntity<dto.WeeklyAvailabilityResponse> getWeeklyAvailability(@AuthenticationPrincipal UserDetailsImpl userDetails, @RequestParam int studyRoomId, @RequestParam int offset)
    {
        StudentUser student = userDetails.convertToStudent();
        dto.WeeklyAvailabilityResponse response = reservationService.getWeeklyAvailabilityResponse(studyRoomId, offset, student);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/create")  // GETではなくPOSTが適切
    public ResponseEntity<?> createBulk(
            @RequestBody dto.CreateReservationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        try {
            StudentUser student = userDetails.convertToStudent();
            dto.WeeklyAvailabilityResponse response = reservationService.createReservationBulk(student, request);
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "RESERVATION_FAILED",
                    "message", e.getMessage()
            ));

        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "STUDY_ROOM_NOT_FOUND",
                    "message", "指定された学習室が見つかりません"
            ));

        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "DATA_INTEGRITY_VIOLATION",
                    "message", "予約データに問題があります"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "INTERNAL_SERVER_ERROR",
                    "message", "予約処理中にエラーが発生しました"
            ));
        }
    }
}
