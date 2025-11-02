import { Button, type ButtonProps } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// this is UNION type.
type Props = {
    to: string;
    children: React.ReactNode;
} & ButtonProps;

export const LinkButton: React.FC<Props> = ({ to, children, ...props }) => {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <Button {...props}>{children}</Button>
        </Link>
    );
};
