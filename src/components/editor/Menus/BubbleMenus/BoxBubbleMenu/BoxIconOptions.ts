import {
    BsInfoCircle,
    BsExclamationTriangle,
    BsExclamationCircle,
    BsCheckCircle,
    BsQuestionCircle,
} from 'react-icons/bs';
import { MdNotes } from 'react-icons/md';

export const BoxIconOptions = [
    {
        id: 'note-box',
        label: 'Заметка',
        Icon: MdNotes,
        defaultIconColor: '#3f3f5a',
    },
    {
        id: 'info-box',
        label: 'Информационный блок',
        Icon: BsInfoCircle,
        defaultIconColor: '#006ed6',
    },
    {
        id: 'warning-box',
        label: 'Предупреждение',
        Icon: BsExclamationTriangle,
        defaultIconColor: '#b29500',
    },
    {
        id: 'caution-box',
        label: 'Опасность',
        Icon: BsExclamationCircle,
        defaultIconColor: '#eb0000',
    },
    {
        id: 'success-box',
        label: 'Успех',
        Icon: BsCheckCircle,
        defaultIconColor: '#0c3f8d',
    },
    {
        id: 'question-box',
        label: 'Вопрос',
        Icon: BsQuestionCircle,
        defaultIconColor: '#7a7a7a',
    },
];
