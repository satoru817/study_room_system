package org.example.studyroomreservation.notification;

import jakarta.servlet.http.HttpServletRequest;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.elf.UrlElf;
import org.example.studyroomreservation.student.Student;
import org.example.studyroomreservation.student.StudentLoginDTO;
import org.example.studyroomreservation.student.StudentService;
import org.example.studyroomreservation.studyroom.dto;
import org.example.studyroomreservation.studyroom.reservation.ReservationService;
import org.example.studyroomreservation.studyroom.reservation.StudyRoomReservation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final int REGISTRATION_LINK_VALID_PERIOD = 7 * 2;
    private final List<NotificationStrategy> strategies;
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private ReservationService reservationService;
    @Autowired
    private StudentService studentService;
    @Autowired
    private UrlElf urlElf;

    // Strategy pattern allows using LINE or Email depending on what's configured for each student
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
        // Batch insert for performance with multiple students
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
                log.error("Failed to send registration URL to student: {}, Error: {}", student.getName(), e.getMessage(), e);
                failedStudents.add(student.getName());
            }
        }

        return new DTO.NotificationSuccessStatus(successCount, failedStudents);
    }

    private String getRegistrationUrl(String token, String baseUrl) {
        return baseUrl + "/register?token=" + token;
    }

    // We only send notifications when reservations actually changed to avoid unnecessary messages to students.
    // Different message content based on change type helps students understand what happened to their reservation.
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
            if (change.isUnChanged()) continue;

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
                log.error("Failed to send reservation change notification to student: {}, Error: {}", student.getName(), e.getMessage(), e);
                failedStudents.add(student.getName());
            }
        }

        return new DTO.NotificationResult(successCount, failedStudents);
    }
    // Claude Refactored that deep nests. WOW...
    public DTO.NotificationResult modifyReservationsAndSendNotifications(int studyRoomId, List<dto.StudyRoomRegularScheduleDTO> updatedRegularSchedule) {
        StudyRoomReservation.PrePostReservationsPair pair = reservationService.complyWithNewRegularSchedule(studyRoomId, updatedRegularSchedule);
        // pairを利用してメール/LINEの送信を行う
        return sendNotificationOfChangeOfReservationsDueToUpdateOfSchedule(pair);
    }

    public DTO.NotificationResult sendNotificationOfChangeOfReservationsDueToUpdateOfSchedule(StudyRoomReservation.PrePostReservationsPair pair) {
        Map<Student, Map<LocalDate, Set<StudyRoomReservation>>> preReservation = segmentReservations.apply(pair.preReservations());
        Map<Student, Map<LocalDate, Set<StudyRoomReservation>>> postReservation = segmentReservations.apply(pair.postReservations());

        // 1. 複雑なMapの構築を別メソッドに切り出す
        Map<Student, List<DTO.ReservationChangeOfOneDay>> studentToReservationChanges =
                buildReservationChangesMap(preReservation, postReservation);

        // 2. 通知送信処理も別メソッドに
        return sendNotifications(studentToReservationChanges);
    }

    // メソッド1: 予約変更のMapを構築
    private Map<Student, List<DTO.ReservationChangeOfOneDay>> buildReservationChangesMap(
            Map<Student, Map<LocalDate, Set<StudyRoomReservation>>> preReservation,
            Map<Student, Map<LocalDate, Set<StudyRoomReservation>>> postReservation) {

        return preReservation.entrySet()
                .parallelStream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> buildChangesForStudent(entry, postReservation)
                ));
    }

    // メソッド2: 1人の生徒の予約変更リストを構築
    private List<DTO.ReservationChangeOfOneDay> buildChangesForStudent(
            Map.Entry<Student, Map<LocalDate, Set<StudyRoomReservation>>> entry,
            Map<Student, Map<LocalDate, Set<StudyRoomReservation>>> postReservation) {

        Student student = entry.getKey();
        Map<LocalDate, Set<StudyRoomReservation>> pres = entry.getValue();
        Map<LocalDate, Set<StudyRoomReservation>> posts = postReservation.getOrDefault(student, Map.of());

        return pres.entrySet()
                .parallelStream()
                .map(dateEntry -> createReservationChange(student, dateEntry, posts))
                .toList();
    }

    // メソッド3: 1日分の予約変更を作成
    private DTO.ReservationChangeOfOneDay createReservationChange(
            Student student,
            Map.Entry<LocalDate, Set<StudyRoomReservation>> dateEntry,
            Map<LocalDate, Set<StudyRoomReservation>> posts) {

        LocalDate date = dateEntry.getKey();
        Set<StudyRoomReservation> preReservationsOfTheDay = dateEntry.getValue();
        Set<StudyRoomReservation> postReservationsOfTheDay = posts.getOrDefault(date, Set.of());

        return new DTO.ReservationChangeOfOneDay(student, preReservationsOfTheDay, postReservationsOfTheDay);
    }

    // メソッド4: 通知を送信
    private DTO.NotificationResult sendNotifications(
            Map<Student, List<DTO.ReservationChangeOfOneDay>> studentToReservationChanges) {

        AtomicInteger successCount = new AtomicInteger();
        List<String> failedStudents = new ArrayList<>();

        studentToReservationChanges.forEach((student, changes) -> {
            try {
                boolean sent = sendToStudent(student, changes);
                if (sent) {
                    successCount.incrementAndGet();
                }
            } catch (Exception e) {
                log.error("Failed to send notification to student: {}, Error: {}", student.getName(), e.getMessage(), e);
                failedStudents.add(student.getName());
            }
        });

        return new DTO.NotificationResult(successCount.get(), failedStudents);
    }

    // Try each notification strategy until one succeeds (LINE preferred, then Email fallback)
    private boolean sendToStudent(Student student, List<DTO.ReservationChangeOfOneDay> changes) {
        for (NotificationStrategy strategy : strategies) {
            if (strategy.canSend(student)) {
                return strategy.sendReservationChangeNotificationOfMultipleDays(student, changes);
            }
        }
        return false;
    }

    private final Function<Collection<StudyRoomReservation>, Map<Student, Map<LocalDate, Set<StudyRoomReservation>>>> segmentReservations = (reservations) -> reservations.parallelStream()
            .collect(Collectors.groupingBy(
                    StudyRoomReservation::getStudent,
                    Collectors.groupingBy(
                            StudyRoomReservation::getDate,
                            Collectors.toSet()
                    )
            ));
}
