import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
    label: string;
    password: string;
    handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isSubmitting: boolean;
    error?: string;
};

const PasswordInput: React.FC<Props> = ({
    label,
    password,
    handlePasswordChange,
    isSubmitting,
    error,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => setShowPassword((prev) => !prev);

    return (
        <div className="mb-3 position-relative">
            <label className="form-label">{label}</label>
            <div className="input-group">
                <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${error ? 'is-invalid' : ''}`}
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isSubmitting}
                    required
                />
                <span className="input-group-text" onClick={toggleShowPassword} tabIndex={-1}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
                {error && <div className="invalid-feedback">{error}</div>}
            </div>
        </div>
    );
};

export default PasswordInput;
