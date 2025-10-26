import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doLogin } from '../elfs/WebElf';
import { setRole, STUDENT } from '../constant/role';
import { initCsrf } from '../elfs/CookieElf';
import { Eye, EyeOff } from 'lucide-react';
import type { User, LoginInfo } from '../constant/types';

type Props = {
    onLoginSuccess: (user: User) => Promise<void>;
};

const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        const response: LoginInfo = await doLogin(username, password);

        if (response.success) {
            const role = response.role;
            setRole(role);
            await initCsrf();
            onLoginSuccess({
                loggedIn: true,
                username,
                role,
            });

            const navigateTo = role === STUDENT ? '/student' : '/teacher/selectCramSchool';
            navigate(navigateTo);
        } else {
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
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">パスワード</label>
                        <div className="input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                            <span
                                className="input-group-text"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </span>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                        {isSubmitting ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
