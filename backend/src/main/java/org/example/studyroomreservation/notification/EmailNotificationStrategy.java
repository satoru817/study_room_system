package org.example.studyroomreservation.notification;

import jakarta.annotation.PostConstruct;
import org.example.studyroomreservation.commonService.EmailService;
import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.StringElf;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.example.studyroomreservation.student.Student;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import sendinblue.ApiClient;
import sendinblue.ApiException;
import sendinblue.Configuration;
import sendinblue.auth.ApiKeyAuth;
import sibApi.TransactionalEmailsApi;
import sibModel.CreateSmtpEmail;
import sibModel.SendSmtpEmail;
import sibModel.SendSmtpEmailSender;
import sibModel.SendSmtpEmailTo;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.function.Function;


public class EmailNotificationStrategy implements NotificationStrategy{
    private static final Logger log = LoggerFactory.getLogger(NotificationStrategy.class);
    @Value("${sendinblue.api-key}")
    private String apiKey;
    private TransactionalEmailsApi apiInstance;
    // INSTANCE INITIALIZER
    {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKeyAuth = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKeyAuth.setApiKey(apiKey);
        this.apiInstance = new TransactionalEmailsApi();
        System.out.println("APIキー設定済み: " + (apiKey != null && !apiKey.isEmpty()));
    }

    @Override
    public boolean canSend(StudentUser student) {
        return StringElf.isValid(student.getStudentEmail()) && StringElf.isValid(student.getCramSchoolEmail());
    }

    @Override
    public void sendEntranceNotification(StudentUser student) {
        log.info("starting to send check-in notification email to student: {}", student);
        try {
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setName(student.getCramSchoolName());
            sender.setEmail(student.getCramSchoolEmail());
            LocalDateTime now = TokyoTimeElf.getTokyoLocalDateTime();
            String htmlContent = """
                    <html>
                        <body>
                            <h1>入室連絡</h1>
                            <p>""" + student.getStudentName() + "さんが" + now + "に自習室に入室しました。</p>" +  """
                            <p>このメールはシステムにより自動送信されています。<br>
                            ご質問は翔栄学院までお問い合わせください。</p>
                        </body>
                    </html>    
                    """;
            String textContent = "入室連絡" + "\n" +
                            student.getStudentName() + "さんが" + now + "に自習室に入室しました。\n" +
                            """
                            このメールはシステムにより自動送信されています。\n
                            ご質問は翔栄学院までお問い合わせください。
                            """;
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            sendSmtpEmail.setTo(Collections.singletonList(new SendSmtpEmailTo().email(student.getStudentEmail())));
            sendSmtpEmail.setSubject(student.getStudentName() + "さん自習室入室連絡");
            sendSmtpEmail.setHtmlContent(htmlContent);
            sendSmtpEmail.setTextContent(textContent);

            CreateSmtpEmail response = apiInstance.sendTransacEmail(sendSmtpEmail);

        } catch (ApiException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void sendExitNotification(StudentUser student) {
        log.info("starting to send check-out notification email to student: {}" , student);
    }

    private void sendEmailCommonLogic(StudentUser studentUser, Function<StudentUser, String> htmlContentCreator, Function<StudentUser, String> textContentCreator, Function<StudentUser, String> subjectCreator) {
        try {
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender
        }
    }
}
