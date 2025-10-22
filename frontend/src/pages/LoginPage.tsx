import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doPost } from '../elfs/WebElf';

function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    loginName: '',
    password: '',
    confirmPassword: ''
  });

  const validateLoginName = (value: string) => {
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

  const validateConfirmPassword = (value: string) => {
    if (value !== password) {
      return 'パスワードが一致しません';
    }
    return '';
  };

  const handleLoginNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLoginName(value);
    setErrors(prev => ({ ...prev, loginName: validateLoginName(value) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setErrors(prev => ({ ...prev, password: validatePassword(value) }));

    // パスワード変更時、確認パスワードも再検証
    if (confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword) }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      loginName: validateLoginName(loginName),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword)
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await doPost('/api/student/register', {
        token,
        loginName,
        password
      });

      if (response.success) {
        alert('登録が完了しました！');
        navigate('/login');
      } else {
        alert(response.message || '登録に失敗しました');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('登録中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="alert alert-danger">
        無効なリンクです。登録用のリンクをメールで確認してください。
      </div>
    );
  }

  return (
    <div className="card mx-auto" style={{ maxWidth: '400px' }}>
      <div className="card-body">
        <h2 className="card-title">生徒登録</h2>
        <form onSubmit={handleSubmit}>
          {/* ログイン名 */}
          <div className="mb-3">
            <label className="form-label">ログイン名</label>
            <input
              type="text"
              className={`form-control ${errors.loginName ? 'is-invalid' : ''}`}
              value={loginName}
              onChange={handleLoginNameChange}
              disabled={isSubmitting}
              required
            />
            {errors.loginName && (
              <div className="invalid-feedback">
                {errors.loginName}
              </div>
            )}
          </div>

          {/* パスワード */}
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

          {/* パスワード確認 */}
          <div className="mb-3">
            <label className="form-label">パスワード確認</label>
            <input
              type="password"
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isSubmitting}
              required
            />
            {errors.confirmPassword && (
              <div className="invalid-feedback">
                {errors.confirmPassword}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? '登録中...' : '登録'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentRegisterPage;