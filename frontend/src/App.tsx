import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import StudentRegisterPage from './pages/StudentRegisterPage';
import LoginPage from './pages/LoginPage';
import './App.scss'
import { useEffect,useState } from 'react'
import { initCsrf } from './elfs/CookieElf';
import { doLogout,checkMe } from './elfs/WebElf';
function App() {
    const [user, setUser] = useState<{loggedIn: boolean; username?: string; role: string} | null>(null);

    useEffect(() => {
        const init = async () => {
            await initCsrf();

            const principal = await checkMe();
            if (principal.authenticated) {
                    const user = {loggedIn: true, username: principal.username, role: principal.role};
                    setUser(user);
                    console.log("user checked" + JSON.stringify(user));
            }
        };

        init();
    }, []);

  return (
    <BrowserRouter>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">自習室予約</Navbar.Brand>
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
              {user? (
                <>
                  <Button variant="outline-danger" onClick={() => doLogout( setUser ) }>
                    ログアウト
                  </Button>
                </>
              ) : (
                <>
                  <Button variant='outline-info' as={Link} to="/register">
                    新規登録
                  </Button>
                  <Button variant='outline-success' as={Link} to="/login">
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
          <Route path="/login" element={<LoginPage onLoginSuccess={setUser}/>} />
          <Route path='/'/>
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;