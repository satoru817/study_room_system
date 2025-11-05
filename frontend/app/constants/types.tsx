export type CramSchool = {
  cramschoolId: number;
  name: string;
};

export type StudyRoomRegularSchedule = {
  study_room_regular_schedule_id: number;
  study_room_id: number;
  day_of_week: string;
  open_time: string;
  close_time: string;
};

export type StudyRoomScheduleException = {
  study_room_schedule_exception_id: number;
  study_room_id: number;
  date: string;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  reason: string;
};
