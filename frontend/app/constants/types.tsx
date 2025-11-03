export type CramSchool = {
  cramschoolId: number;
  name: string;
};

export type StudyRoom = {
  study_room_id: number;
  name: string;
  room_limit: number;
  current_students?: number;
};
