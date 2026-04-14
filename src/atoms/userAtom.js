import { atom } from 'recoil';
import { getStoredUser } from '../api/session';

const userAtom = atom({
    key: 'user',
    default: getStoredUser()
});

export default userAtom;