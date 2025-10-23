import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doLogin } from '../elfs/WebElf';  // ← doPostではなくdoLoginをimport
import { setRole, STUDENT, TEACHER } from '../constant/role';
import { initCsrf } from '../elfs/CookieElf';

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    username: '',
    password: ''
  });

  const validateUsername = (value: string) => {
    if (!value.trim()) {
      return '有効なユーザー名を入力してください';
    }
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) {
      return '有効なパスワードを入力してください';
    }
    if (value.length < 8) {
      return 'パスワードは8文字以上である必要があります';
    }
    return '';
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setErrors(prev => ({ ...prev, username: validateUsername(value) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setErrors(prev => ({ ...prev, password: validatePassword(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      username: validateUsername(username),
      password: validatePassword(password),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    const response = await doLogin(username, password);

    if (response.success) {
        // TODO: change where to navigate based on ROLE
        alert('ログインが完了しました！');
        const role = response.roles[0];
        setRole(role);
        // since the csrf is changed after successful login, take that from server again
        await initCsrf();
        //const navigate_to = role === STUDENT ? '/student' : '/teacher';
        navigate("/register");
    }
    else {
        alert(response.error || 'ログインに失敗しました');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="card mx-auto" style={{ maxWidth: '400px' }}>
      <div className="card-body">
        <h2 className="card-title">ログイン</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">ログイン名またはメールアドレス</label>
            <input
              type="text"
              className={`form-control ${errors.username ? 'is-invalid' : ''}`}
              value={username}
              onChange={handleUsernameChange}
              disabled={isSubmitting}
              required
            />
            {errors.username && (
              <div className="invalid-feedback">
                {errors.username}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">パスワード</label>
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              value={password}
              onChange={handlePasswordChange}
              disabled={isSubmitting}
              required
            />
            {errors.password && (
              <div className="invalid-feedback">
                {errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;