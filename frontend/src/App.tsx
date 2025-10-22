import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import StudentRegisterPage from './pages/StudentRegisterPage';
import LoginPage from './pages/LoginPage';
import './App.scss'
import { useEffect } from 'react'
function App() {

    useEffect(() => {
        const initCsrf = async () => {
          try {
            // csrf token will be stored in cookie
            await fetch(`/api/csrf-token`, {
              credentials: 'include'
            });
            console.log('CSRF token initialized');
          } catch (error) {
            console.error('Failed to initialize CSRF:', error);
          }
        };

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
              <Nav.Link as={Link} to="/register">新規登録</Nav.Link>
              <Nav.Ling as={Link} to="/login">ログイン</Nav.Link>
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