import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import StudentRegisterPage from './pages/StudentRegisterPage';
import SelectCramSchool from './pages/teacher/SelectCramSchool';
import LoginPage from './pages/LoginPage';
import './App.scss';
import { useEffect, useState } from 'react';
import { initCsrf } from './elfs/CookieElf';
import { doLogout, checkMe } from './elfs/WebElf';
import type { User, Principal, CramSchool } from './constant/types';
import { STUDENT, TEACHER } from './constant/role';

function App() {
    const [user, setUser] = useState<User>(null);
    // cramSchoolの有無で表示を切り替える
    const [cramSchool, setCramSchool] = useState<CramSchool>(null);

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
                                <Button
                                    variant="outline-primary"
                                    as={Link}
                                    to="/student-dashboard"
                                    className="me-2"
                                >
                                    生徒ページ
                                </Button>
                            )}

                            {user && user.role === TEACHER && (
                                <Button
                                    variant="outline-secondary"
                                    as={Link}
                                    to="/selectCramSchool"
                                    className="me-2"
                                >
                                    教室選択
                                </Button>
                            )}

                            {/* ログイン状態による制御 */}
                            {user ? (
                                <Button variant="outline-danger" onClick={onLogout}>
                                    ログアウト
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline-info"
                                        as={Link}
                                        to="/register"
                                        className="me-2"
                                    >
                                        新規登録
                                    </Button>
                                    <Button variant="outline-success" as={Link} to="/login">
                                        ログイン
                                    </Button>
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

                    <Route path="/" element={<h2>自習室予約アプリへようこそ！</h2>} />
                </Routes>
            </Container>
        </BrowserRouter>
    );
}

export default App;
