package org.example.studyroomreservation.commonService;

import jakarta.servlet.http.HttpServletRequest;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sendinblue.ApiException;
import sibApi.TransactionalEmailsApi;
import sibModel.CreateSmtpEmail;
import sibModel.SendSmtpEmail;
import sibModel.SendSmtpEmailSender;
import sibModel.SendSmtpEmailTo;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Value("${sendinblue.api-key}")
    private String apiKey;
    @Value("${server.base.url}")
    private String baseUrl;
    @Value("${spring.profiles.active:}")
    private String activeProfile;
    @Autowired
    private TransactionalEmailsApi apiInstance;

    private static final int REGISTRATION_LINK_VALID_PERIOD = 7 * 2;

    @Transactional
    public EmailSuccessStatus sendRegistrationEmail(List<Integer> studentIds, HttpServletRequest request, int userId) {
        List<StudentEmailSet> emailSets = getAllEmailSet(studentIds);
        // first delete all the student_tokens exists on the server in the student_ids
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

        int successCount = 0;
        List<String> failedStudents = new ArrayList<>();

        for (StudentEmailSet set: emailSets) {
            try {
                sendEmail(set, "翔栄学院入退室システム登録のお願い", request, (emailSet) -> {
                    String baseUrl = getBaseUrl(request);
                    String token =  studentToUUID.get(emailSet.studentId);
                    String url = getString(baseUrl, token);

                    String htmlContent = """
                            <html>
                                <body>
                                    <h1>翔栄学院入退室システム登録のお願い</h1>
                                    <p>以下のリンクをクリックしてシステムに登録してください。</p>
                                    <p><a href=""" + url + " >登録リンク</a></p> " + """
                                    <p>このリンクは""" + REGISTRATION_LINK_VALID_PERIOD + "日有効です。</p> " + """
                                    <hr>
                                    <p>このメールはシステムにより自動送信されています。</br>
                                    ご質問等は翔栄学院までお問い合わせください。</p>
                                </body>
                            </html>""";

                    String textContent = """
                            翔栄学院入退室システム登録のお願い
                           \n
                            以下のリンクをクリックしてシステムに登録してください。
                           \n
                            登録リンク:\s""" + url +  """ 
                            
                            このリンクは""" + REGISTRATION_LINK_VALID_PERIOD + "日有効です。" + """
                            ────────────────────────────
                            このメールはシステムにより自動送信されています。
                            ご質問等は翔栄学院までお問い合わせください。
                            """;

                    return new EmailContent(htmlContent, textContent);
                });
                successCount++;
            } catch (Exception e) {
                failedStudents.add(set.studentName);
            }
        }

        return new EmailSuccessStatus(successCount, failedStudents);
    }

    private static String getString(String baseUrl, String token) {
        return baseUrl + "/register" + "?token=" + token;
    }

    public static record EmailSuccessStatus(int successCount, List<String> failedStudent) {}

    public static record StudentEmailSet(int studentId, String studentName, String mailTo, String mailFrom) {}

    public static record EmailContent(String htmlContent, String textContent) {}

    public List<StudentEmailSet> getAllEmailSet(List<Integer> studentIds) {
        String sql = """
            SELECT student_id, name, mail AS mailTo, cs.email AS mailFrom
            FROM students
            JOIN cram_schools cs ON cs.cram_school_id = s.cram_school_id
            WHERE student_id IN (:ids)
                AND mail IS NOT NULL
            """;

        MapSqlParameterSource params = new MapSqlParameterSource("ids", studentIds);

        return namedParameterJdbcTemplate.query(
                sql,
                params,
                (rs, rowNum) -> new StudentEmailSet(
                        rs.getInt("student_id"),
                        rs.getString("name"),
                        rs.getString("mailTo"),
                        rs.getString("mailFrom")
                )
        );
    }

    private String getBaseUrl(HttpServletRequest request) {
        if (activeProfile.equals("dev")) {
            return "http://localhost:5173";
        }

        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String contextPath = request.getContextPath();

        StringBuilder url = new StringBuilder();
        url.append(scheme).append("://").append(serverName);

        if (serverPort != 80 && serverPort != 443) {
            url.append(":").append(serverPort);
        }

        url.append(contextPath);

        return url.toString();
    }

    private void sendEmail(StudentEmailSet emailSet, String subject, HttpServletRequest request, Function<StudentEmailSet, EmailContent> emailContentCreator) {
        SendSmtpEmailSender sender = new SendSmtpEmailSender();
        List<SendSmtpEmailTo> toList = Collections.singletonList(new SendSmtpEmailTo().email(emailSet.mailTo));
        sender.setName("翔栄学院入退出システム");
        sender.setEmail(emailSet.mailFrom);
        EmailContent content = emailContentCreator.apply(emailSet);
        SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
        sendSmtpEmail.setTo(toList);
        sendSmtpEmail.setSender(sender);
        sendSmtpEmail.setSubject(subject);
        sendSmtpEmail.setHtmlContent(content.htmlContent);
        sendSmtpEmail.setTextContent(content.textContent);

        try {
            CreateSmtpEmail response = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("メール送信成功: to={}, subject={}, messageId={}",
                    emailSet.mailTo, subject, response.getMessageId());
        } catch (ApiException e) {
            log.warn("メール送信失敗: to={}, subject={}, エラー={}",
                    emailSet.mailTo, subject, e.getResponseBody(), e);
            throw new RuntimeException(e);
        }
    }
}
