import { redirect } from 'next/navigation';

export default function DocsRootRedirect() {
    redirect('/dashboard');
}
