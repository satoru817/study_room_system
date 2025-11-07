package org.example.studyroomreservation.studyroom.reservation;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.config.security.user.UserDetailsImpl;
import org.example.studyroomreservation.studyroom.dto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

//    @PreAuthorize("hasRole('STUDENT')")
//    @GetMapping("/create")
//    public ResponseEntity<>
}
