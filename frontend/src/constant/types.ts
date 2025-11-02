export type User = {
    loggedIn: boolean;
    username?: string;
    role?: string;
};

export type Principal = {
    authenticated: boolean;
    username?: string;
    role?: string;
};

export type LoginInfo = {
    success: boolean;
    username?: string;
    role?: string;
    error?: string;
};

export type CramSchool = {
    cramSchoolId: number;
    name: string;
    email: string;
};

export type StudyRoom = {
    studyRoomId: number;
    name: string;
    roomLimit: number;
    cramSchoolId: number;
    cramSchoolName: string;
};

export type StudyRoomCreateRequest = {
    name: string;
    limit: number;
};

export type StudentStatus = {
    studentId: number;
    name: string;
    mail: string;
    shouldBeAttending: boolean; // 現在出席すべきか
    isAttending: boolean; // 実際に出席しているか
    isRegistered: boolean; // システムに登録済みか
    gradeStr: string; // 学年表示
    valid: boolean; // 出席すべきなのに出席していない場合false
};

export type PageResponse<T> = {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    empty: boolean;
};

export class OneSchedule {
    openTime: string;
    closeTime: string;

    constructor(openTime: string, closeTime: string) {
        this.openTime = openTime;
        this.closeTime = closeTime;
    }
};

export type ScheduleOfOneDay = {
    
}