import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { CramSchool, User } from '../../constant/types';
import { TEACHER } from '../../constant/role';
import { doGet } from '../../elfs/WebElf';
import { FETCH_CRAMSCHOOLS_URL } from '../../constant/urls';
import { useNavigate } from 'react-router-dom';

type Props = {
    user: User | null;
    setCramSchool: Dispatch<SetStateAction<CramSchool | null>>;
};

const SelectCramSchool: React.FC<Props> = ({ user, setCramSchool }) => {
    const [cramSchools, setCramSchools] = useState<CramSchool[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== TEACHER) {
            console.log('RETURNED');
            return;
        }

        const initSelectCramSchool = async () => {
            try {
                const data = await doGet(FETCH_CRAMSCHOOLS_URL);
                setCramSchools(data);
            } catch (e) {
                console.error('Failed to fetch cram schools:', e);
                setError('塾情報の取得に失敗しました');
            }
        };
        initSelectCramSchool();
    }, [user]);

    if (!user || user.role !== TEACHER) {
        console.log('!user || user.role !== TEACHER');
        return null;
    }

    const handleSelect = async (cramSchoolId: number) => {
        setSelectedId(cramSchoolId);
        setError(null);

        const selected = cramSchools.find((cs) => !!cs && cs.cramSchoolId === cramSchoolId);
        if (selected) {
            setCramSchool(selected);
            navigate('/studyRooms');
            //alert(`you selected ${selected.name}`);
        }
    };

    return (
        <div className="select-cram-school">
            <h3>塾を選択してください</h3>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {cramSchools.length === 0 ? (
                <p>読み込み中...</p>
            ) : (
                <div className="list-group">
                    {cramSchools
                        .filter((cs) => !!cs)
                        .map((school) => (
                            <button
                                key={school.cramSchoolId}
                                type="button"
                                className={`list-group-item list-group-item-action m-2 ${
                                    selectedId === school.cramSchoolId ? 'active' : ''
                                }`}
                                onClick={() => handleSelect(school.cramSchoolId)}
                            >
                                <div className="d-flex w-100 justify-content-between">
                                    <h5 className="mb-1">{school.name}</h5>
                                </div>
                                <small>{school.email}</small>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
};

export default SelectCramSchool;
