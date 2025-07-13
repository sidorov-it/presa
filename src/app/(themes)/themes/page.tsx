import { redirect } from 'next/navigation';

export default function ThemesRootRedirect() {
    redirect('/dashboard');
}
