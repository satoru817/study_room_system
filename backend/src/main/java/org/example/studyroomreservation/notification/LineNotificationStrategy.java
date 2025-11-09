package org.example.studyroomreservation.notification;

import org.example.studyroomreservation.config.security.user.StudentUser;
import org.example.studyroomreservation.elf.StringElf;

public class LineNotificationStrategy implements NotificationStrategy{
    @Override
    public boolean canSend(StudentUser student) {
        return StringElf.isValid(student.getLineUserId()) && StringElf.isValid(student.getCramSchoolLineChannelToken());
    }

    @Override
    public void sendEntranceNotification(StudentUser student) {

    }

    @Override
    public void sendExitNotification(StudentUser student) {

    }
}
