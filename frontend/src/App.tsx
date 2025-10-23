import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import StudentRegisterPage from './pages/StudentRegisterPage';
import LoginPage from './pages/LoginPage';
import './App.scss'
import { useEffect } from 'react'
import { initCsrf } from './elfs/CookieElf';
import { doLogout } from './elfs/WebElf';
function App() {

    useEffect(() => {
        initCsrf();
      }, []);

  return (
    <BrowserRouter>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">自習室予約</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Button variant='outline-info' as={Link} to="/register">新規登録</Button>
              <Button as={Link} to="/login" variant='outline-success'>ログイン</Button>
              <Button variant="outline-danger" onClick={doLogout}>ログアウト</Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route path="/register" element={<StudentRegisterPage />} />
          <Route path="/login" element={<LoginPage/>} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;