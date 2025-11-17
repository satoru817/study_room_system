package org.example.studyroomreservation.studyroom.reservation;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.example.studyroomreservation.elf.AccessElf;
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
    @Autowired
    private AccessElf accessElf;

    @PostMapping("/confirm/deletedByClosingOneDay")
    public ResponseEntity<?> confirmReservationsToBeDeletedByClosingOneDay(@RequestBody DTO.CloseRequest closeRequest){
        List<DTO.ReservationDtoForConfirmation> reservationsToBeDeleted = reservationService.findWhichReservationWillBeDeletedByClosingOneDay(closeRequest);
        return ResponseEntity.ok(reservationsToBeDeleted);
    }

    @GetMapping("/getTodays/{studentId}")
    public ResponseEntity<?> getReservationOfToday(@AuthenticationPrincipal UserDetailsImpl userDetails, @PathVariable int studentId) throws IllegalAccessException {
        accessElf.isValidAccess(studentId, userDetails);
        List<DTO.ReservationShowResponse> response = reservationService.getReservationsOfOneStudentOfToday(studentId);
        return ResponseEntity.ok(response);
    }

    /**
     *
     * @param studyRoomId
     * @param offset this means how many weeks ahead
     * @return
     */
    @GetMapping("/weekly/{studentId}")
    public ResponseEntity<dto.WeeklyAvailabilityResponse> getWeeklyAvailability(@AuthenticationPrincipal UserDetailsImpl userDetails, @RequestParam int studyRoomId, @RequestParam int offset, @PathVariable int studentId) throws IllegalAccessException {
        accessElf.isValidAccess(studentId, userDetails);
        dto.WeeklyAvailabilityResponse response = reservationService.getWeeklyAvailabilityResponse(studyRoomId, offset, studentId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/create/{studentId}")
    public ResponseEntity<?> createBulk(
            @RequestBody dto.CreateReservationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails , @PathVariable int studentId) {

        try {
            accessElf.isValidAccess(studentId, userDetails);
            dto.WeeklyAvailabilityResponse response = reservationService.createReservationBulk(studentId, request);
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
