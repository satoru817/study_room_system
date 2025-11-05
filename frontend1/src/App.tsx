import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Badge, Button } from 'react-bootstrap';
import StudentRegisterPage from './pages/StudentRegisterPage';
import SelectCramSchool from './pages/teacher/SelectCramSchool';
import LoginPage from './pages/LoginPage';
import './App.scss';
import { useEffect, useState } from 'react';
import { initCsrf } from './elfs/CookieElf';
import { doLogout, checkMe } from './elfs/WebElf';
import type { User, Principal, CramSchool, StudyRoom } from './constant/types';
import { STUDENT, TEACHER } from './constant/role';
import StudyRooms from './pages/teacher/StudyRooms';
import Students from './pages/teacher/Students';
import { LinkButton } from './smallComponents/LinkButton';

function App() {
    const [user, setUser] = useState<User | null>(null);
    // cramSchoolの有無で表示を切り替える
    const [cramSchool, setCramSchool] = useState<CramSchool | null>(null);
    const [studyRoom, setStudyRoom] = useState<StudyRoom | null>(null);
    // const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            await initCsrf();

            const principal: Principal = await checkMe();
            if (principal.authenticated) {
                const user: User = {
                    loggedIn: true,
                    username: principal.username,
                    role: principal.role,
                };
                setUser(user);
                console.log('user checked' + JSON.stringify(user));
            }
        };

        init();
    }, []);

    const onLoginSuccess = async (user: User) => {
        setUser(user);
        await initCsrf();
    };

    const onLogout = async () => {
        setUser(null);
        setCramSchool(null);
        setStudyRoom(null);
        await doLogout();
        await initCsrf();
    };

    return (
        <BrowserRouter>
            <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand as={Link} to="/">
                        自習室予約
                    </Navbar.Brand>

                    {/* ログイン中ユーザー表示 */}
                    {user && user.username && (
                        <Badge
                            bg="success"
                            className="d-flex align-items-center gap-2 py-2 px-3"
                            style={{ fontSize: '0.875rem' }}
                        >
                            <i className="bi bi-person-check-fill"></i>
                            {user.username}さんログイン中
                        </Badge>
                    )}

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            {/* ロールによるリンク制御 */}
                            {user && user.role === STUDENT && (
                                <LinkButton
                                    variant="outline-primary"
                                    to="/student-dashboard"
                                    className="me-2"
                                >
                                    生徒ページ
                                </LinkButton>
                            )}

                            {user && user.role === TEACHER && (
                                <LinkButton
                                    variant="outline-secondary"
                                    to="/selectCramSchool"
                                    className="me-2"
                                >
                                    教室選択
                                </LinkButton>
                            )}

                            {/* ログイン状態による制御 */}
                            {user ? (
                                <Button variant="outline-danger" onClick={onLogout}>
                                    ログアウト
                                </Button>
                            ) : (
                                <>
                                    <LinkButton
                                        variant="outline-info"
                                        to="/register"
                                        className="me-2"
                                    >
                                        新規登録
                                    </LinkButton>
                                    <LinkButton variant="outline-success" to="/login">
                                        ログイン
                                    </LinkButton>
                                </>
                            )}

                            {/*if user has selected cramSchool then they should be able to see other links like students or study_rooms*/}
                            {cramSchool && user && user.role === TEACHER && (
                                <>
                                    {/*teacher should be able to send sign_up url to any student from the page below*/}
                                    <LinkButton
                                        variant="outline-primary"
                                        to="/students"
                                        className="me-2"
                                    >
                                        生徒一覧
                                    </LinkButton>
                                    {/*teacher should be able to do CRUD on every study_room of the cramschool they selected*/}
                                    <LinkButton variant="link" to="/studyRooms" className="me-2">
                                        自習室一覧
                                    </LinkButton>
                                    {studyRoom && (
                                        <>
                                            {/* make components for setting up a certain studyRoom or checking who's using the studyRoom right now*/}
                                            <LinkButton variant="info" to="/study_room_setting">
                                                {studyRoom.name}:設定
                                            </LinkButton>
                                            <LinkButton
                                                variant="outline-info"
                                                to="/students_of_study_room"
                                            >
                                                {studyRoom.name}:生徒
                                            </LinkButton>
                                        </>
                                    )}
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container className="mt-4">
                <Routes>
                    <Route path="/register" element={<StudentRegisterPage />} />
                    <Route path="/login" element={<LoginPage onLoginSuccess={onLoginSuccess} />} />

                    {/* ロール別ページ */}
                    <Route path="/student-dashboard" element={<h2>生徒専用ページ</h2>} />
                    <Route
                        path="/selectCramSchool"
                        element={<SelectCramSchool user={user} setCramSchool={setCramSchool} />}
                    />
                    <Route
                        path="/studyRooms"
                        element={<StudyRooms cramSchool={cramSchool} setStudyRoom={setStudyRoom} />}
                    />
                    {/*in the component students teacher should be able to send sign up links*/}
                    <Route path="/students" element={<Students cramSchool={cramSchool} />} />
                    <Route path="/study_room_setting" element={<h2>自習室設定</h2>} />
                    <Route path="/students_of_study_room" element={<h2>生徒出席状況</h2>} />

                    <Route path="/" element={<h2>自習室予約アプリへようこそ！</h2>} />
                </Routes>
            </Container>
        </BrowserRouter>
    );
}

export default App;
