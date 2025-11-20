package org.example.studyroomreservation.notification;

import jakarta.servlet.http.HttpServletRequest;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.elf.UrlElf;
import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.student.StudentLoginDTO;
import org.example.studyroomreservation.student.StudentService;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    private static final int REGISTRATION_LINK_VALID_PERIOD = 7 * 2;
    private final List<NotificationStrategy> strategies;
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private StudentService studentService;
    @Autowired
    private UrlElf urlElf;
    public NotificationService(
            LineNotificationStrategy lineNotificationStrategy,
            EmailNotificationStrategy emailNotificationStrategy
    ) {
        this.strategies = Arrays.asList(lineNotificationStrategy, emailNotificationStrategy);
    }

    public DTO.NotificationSuccessStatus sendRegistrationUrl(List<Integer> studentIds, HttpServletRequest request , int userId) {

        namedParameterJdbcTemplate.update(
                """
                DELETE FROM student_tokens
                WHERE student_id IN (:ids)
                """,
                new MapSqlParameterSource("ids", studentIds)
        );

        // create random UUID for each student
        Map<Integer, String> studentToUUID = studentIds.stream()
                .collect(Collectors.toMap(
                        id -> id,
                        id -> UUID.randomUUID().toString()
                ));

        LocalDateTime createdAt = TokyoTimeElf.getTokyoLocalDateTime();
        LocalDateTime validUntil = createdAt.plusDays(REGISTRATION_LINK_VALID_PERIOD);

        List<MapSqlParameterSource> batchParams = studentIds.stream()
                .map(studentId -> new MapSqlParameterSource()
                        .addValue("token", studentToUUID.get(studentId))
                        .addValue("student_id", studentId)
                        .addValue("user_id", userId)
                        .addValue("valid_until", validUntil)
                        .addValue("created_at", createdAt))
                .toList();
        // save each student's token using batch
        namedParameterJdbcTemplate.batchUpdate(
                """
                INSERT INTO student_tokens (token, student_id, user_id, valid_until, created_at)
                VALUES (:token, :student_id, :user_id, :valid_until, :created_at)
                """,
                batchParams.toArray(new MapSqlParameterSource[0])
        );

        String baseUrl = urlElf.getBaseUrl(request);

        List<StudentLoginDTO> students = studentService.getLoginDtosInIds(studentIds);
        int successCount = 0;
        List<String> failedStudents = new ArrayList<>();
        for (StudentLoginDTO student : students) {
            boolean sent = false;
            try {
                for (NotificationStrategy strategy : strategies) {
                    if (strategy.canSend(student)) {
                        strategy.sendRegistrationUrl(student, getRegistrationUrl(studentToUUID.get(student.getStudentId()), baseUrl), REGISTRATION_LINK_VALID_PERIOD);
                        successCount++;
                        sent = true;
                        break;
                    }
                }
                if (!sent) {
                    failedStudents.add(student.getName());
                }
            } catch (Exception e) {
                failedStudents.add(student.getName());
            }
        }

        return new DTO.NotificationSuccessStatus(successCount, failedStudents);
    }

    private String getRegistrationUrl(String token, String baseUrl) {
        return baseUrl + "/register?token=" + token;
    }
    /*
    * とりあえず、ある日のある一つの予約の変更のメールを送りたい。
    * ある生徒の予約が
    * １：一切変わっていない
    * ２：時間帯が変わっている（途中で途切れたり、２つに分解されたり、遅く始まったりしている場合
    * 3:なくなっている
    * この三通りで文面を変えたほうがいいだろう。というか1の場合はメールを送らなくていい。
    * */
    public DTO.NotificationResult sendNotificationOfReservationChangeOfOneDay(List<StudyRoomReservation> preReservations, List<StudyRoomReservation> changedReservations) {
        Map<Student, Set<StudyRoomReservation>> studentToPreReservationsMap = preReservations.parallelStream()
                .collect(
                        Collectors.groupingBy(
                                StudyRoomReservation::getStudent,
                                Collectors.toSet()
                        )
                );

        Map<Student, Set<StudyRoomReservation>> studentToPostReservationsMap = changedReservations.parallelStream()
                .collect(
                        Collectors.groupingBy(
                                StudyRoomReservation::getStudent,
                                Collectors.toSet()
                        )
                );
        List<DTO.ReservationChangeOfOneDay> changes = studentToPreReservationsMap.entrySet().parallelStream()
                .map(entrySet ->
                    new DTO.ReservationChangeOfOneDay(entrySet.getKey(), entrySet.getValue(), studentToPostReservationsMap.getOrDefault(entrySet.getKey(), new HashSet<>()))
                ).toList();

        return sendReservationChangeNotifications(changes);
    }

    private DTO.NotificationResult sendReservationChangeNotifications(List<DTO.ReservationChangeOfOneDay> changes) {
        int successCount = 0;
        List<String> failedStudents = new ArrayList<>();
        for (DTO.ReservationChangeOfOneDay change : changes) {
            Student student = change.getStudent();
            try {
                for (NotificationStrategy strategy : strategies) {
                    if (strategy.canSend(student)) {
                        strategy.sendReservationChangeNotification(student, change);
                        successCount++;
                        break;
                    }
                }
            } catch (Exception e) {
                failedStudents.add(student.getName());
            }
        }

        return new DTO.NotificationResult(successCount, failedStudents);
    }
}
