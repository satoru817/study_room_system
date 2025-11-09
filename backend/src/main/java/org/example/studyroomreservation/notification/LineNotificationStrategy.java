package org.example.studyroomreservation.notification;

import com.linecorp.bot.client.LineMessagingClient;
import com.linecorp.bot.model.PushMessage;
import com.linecorp.bot.model.action.URIAction;
import com.linecorp.bot.model.message.FlexMessage;
import com.linecorp.bot.model.message.flex.component.Box;
import com.linecorp.bot.model.message.flex.component.Button;
import com.linecorp.bot.model.message.flex.component.FlexComponent;
import com.linecorp.bot.model.message.flex.component.Text;
import com.linecorp.bot.model.message.flex.container.Bubble;
import com.linecorp.bot.model.message.flex.unit.FlexFontSize;
import com.linecorp.bot.model.message.flex.unit.FlexLayout;
import com.linecorp.bot.model.message.flex.unit.FlexMarginSize;
import com.linecorp.bot.model.message.flex.unit.FlexPaddingSize;
import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.StringElf;
import org.example.studyroomreservation.elf.TokyoTimeElf;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Component
public class LineNotificationStrategy implements NotificationStrategy{
    private static final  Logger log = LoggerFactory.getLogger(LineNotificationStrategy.class);
    @Override
    public boolean canSend(StudentUser student) {
        return StringElf.isValid(student.getLineUserId()) && StringElf.isValid(student.getCramSchoolLineChannelToken());
    }

    @Override
    public void sendEntranceNotification(StudentUser student) {
        FlexMessage message = createAttendanceLineFlexMessage(student.getStudentName() + "さん自習室入室連絡", student.getStudentName(), "自習室入室", TokyoTimeElf.getFormattedTime());
        sendLineShared(student, message);
    }

    @Override
    public void sendExitNotification(StudentUser student) {
        FlexMessage message = createAttendanceLineFlexMessage(student.getStudentName() + "さん自習室退室連絡", student.getStudentName(), "自習室退室", TokyoTimeElf.getFormattedTime());
        sendLineShared(student, message);
    }

    private void sendLineShared(StudentUser studentUser, FlexMessage message) {
        try {
            LineMessagingClient client = LineMessagingClient
                    .builder(studentUser.getCramSchoolLineChannelToken())
                    .build();

            client.pushMessage(new PushMessage(
                    studentUser.getLineUserId(),
                    Collections.singletonList(message)
            )).get();

        } catch (InterruptedException | ExecutionException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.error("LINE送信失敗: {}", studentUser.getStudentName(), e);
            throw new RuntimeException("LINE送信エラー", e);
        }
    }

    private FlexMessage createAttendanceLineFlexMessage(String subject, String studentName, String action, String formattedTime) {
        Text title = getTitle(subject);
        Text message = getHeadMessage(studentName, "さんが" + formattedTime + "に" + action + "しました。");
        Box body = getBox(Arrays.asList(title, message));
        Bubble bubble = createFromBody(body);
        return new FlexMessage(subject, bubble);
    }

    private Text getTitle(String subject) {
        return Text.builder()
                .text(subject)
                .weight(Text.TextWeight.BOLD)
                .size(FlexFontSize.XL)
                .color("#1DB446")
                .build();
    }

    private Box getBox(List<FlexComponent> components) {
        return Box.builder()
                .layout(FlexLayout.VERTICAL)
                .contents(components)
                .paddingAll(FlexPaddingSize.LG)
                .build();
    }

    private Button getLinkBtn(String message, String url) {
        return Button.builder()
                .style(Button.ButtonStyle.PRIMARY)
                .action(new URIAction(message, URI.create(url), null))
                .margin(FlexMarginSize.MD)
                .height(Button.ButtonHeight.MEDIUM)
                .build();
    }

    private Text getHeadMessage(String studentName, String adding) {
        return Text.builder()
                .text(studentName + adding)
                .wrap(true)
                .margin(FlexMarginSize.MD)
                .size(FlexFontSize.Md)
                .build();
    }

    private Text createNote(int duration) {
        return Text.builder()
                .text("このリンクは" + duration + "日間有効です。\nこのメッセージは自動送信されています。\nご質問等は翔栄学院までお問い合わせください。")
                .size(FlexFontSize.SM)
                .color("#888888")
                .wrap(true)
                .margin(FlexMarginSize.LG)
                .build();
    }

    private Bubble createFromBody(Box body) {
        return Bubble.builder()
                .body(body).build();
    }
}
