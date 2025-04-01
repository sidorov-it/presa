'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaUser, FaLock, FaGlobe, FaBell, FaPalette } from 'react-icons/fa';
import { Heading } from "@/components/ui/heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/Button"
import { Save } from "lucide-react"

// export const metadata = {
//     title: "Settings",
//     description: "Manage your account settings and preferences"
// }

const SettingsPage = () => {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('profile');
    const [name, setName] = useState(session?.user?.name || '');
    const [email, setEmail] = useState(session?.user?.email || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
    
        // In a real app, this would call your API to update the user's profile
        setIsSaving(false);
        setSaveSuccess(true);

        // Clear success message after 3 seconds
        setTimeout(() => {
            setSaveSuccess(false);
        }, 3000);
    };

    const handleSaveSettings = () => {
        // TODO: Implement settings save functionality
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <FaUser /> },
        { id: 'security', label: 'Security', icon: <FaLock /> },
        { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
        { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
        { id: 'language', label: 'Language', icon: <FaGlobe /> },
    ];

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Settings"
                    description="Manage your account settings and preferences"
                />
            </div>

            <div className="grid gap-4 grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Update your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="john@example.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize your presentation settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Dark Mode</label>
                                <p className="text-sm text-muted-foreground">
                                    Enable dark mode for the application
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="darkMode"
                                    className="w-6 h-6"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Auto Save</label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically save presentations while editing
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="autoSave"
                                    className="w-6 h-6"
                                    defaultChecked
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveSettings} className="ml-auto">
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default SettingsPage 