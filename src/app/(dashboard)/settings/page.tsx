'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { Heading } from "@/components/ui/heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/Button"
import { Save } from "lucide-react"
import { toast } from "sonner"

// export const metadata = {
//     title: "Settings",
//     description: "Manage your account settings and preferences"
// }

const SettingsPage = () => {
    const { data: session, update } = useSession();
    const [name, setName] = useState(session?.user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthentication = async () => {
        try {
            console.log('Checking authentication status...');
            const authResponse = await fetch('/api/auth/check');
            const authData = await authResponse.json();
            console.log('Authentication check result:', authData);
            
            if (!authData.authenticated) {
                console.error('User not authenticated properly');
                toast.error('Authentication error. Please sign in again.');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Authentication check error:', error);
            toast.error('Authentication error. Please try again.');
            return false;
        }
    };

    // Load user preferences
    useEffect(() => {
        const fetchUserPreferences = async () => {
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) return;
            
            try {
                console.log('Fetching user preferences...');
                const response = await fetch('/api/user/preferences');
                console.log('Preferences response status:', response.status);
                
                if (response.status === 401) {
                    console.log('User not authenticated, cannot fetch preferences');
                    setIsLoading(false);
                    return;
                }
                
                const data = await response.json();
                console.log('Preferences data:', data);
                
                if (response.ok) {
                    if (data.preferences?.emailPreferences?.updates !== undefined) {
                        setEmailUpdates(data.preferences.emailPreferences.updates);
                        console.log('Setting email updates to:', data.preferences.emailPreferences.updates);
                    } else {
                        console.log('No email preferences found in response, using default');
                        setEmailUpdates(true);
                    }
                } else {
                    console.error('Error fetching preferences:', data.message);
                    toast.error('Failed to load preferences');
                }
            } catch (error) {
                console.error('Error fetching preferences:', error);
                toast.error('Failed to load preferences');
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user) {
            console.log('Session is available, user ID:', session.user.id, 'name:', session.user.name);
            fetchUserPreferences();
            setName(session.user.name || '');
        } else {
            console.log('No session available');
            setIsLoading(false);
        }
    }, [session]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        console.log('Saving profile with name:', name);
        console.log('User session ID:', session?.user?.id);

        // Check authentication before proceeding
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            setIsSaving(false);
            return;
        }

        try {
            console.log('Making API request to /api/user/profile');
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });
            console.log('Profile update response status:', response.status);

            const data = await response.json();
            console.log('Profile update response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }
            
            // Update the session to reflect the name change
            console.log('Updating session with new name');
            await update({ name });
            console.log('Session updated successfully');
            
            // Refresh the page to ensure session state is updated everywhere
            window.location.reload();
            
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error('Profile update error complete details:', error);
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }
        
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        
        setIsSaving(true);
        
        // Check authentication before proceeding
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            setIsSaving(false);
            return;
        }
        
        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    currentPassword, 
                    newPassword 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }
            
            toast.success("Password changed successfully");
            
            // Reset password fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to change password");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmailPreferences = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        // Check authentication before proceeding
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            setIsSaving(false);
            return;
        }
        
        console.log('Saving email preferences, updates set to:', emailUpdates);
        
        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    emailUpdates 
                }),
            });

            const data = await response.json();
            console.log('Email preferences response:', response.status, data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update preferences');
            }
            
            toast.success("Email preferences updated");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update preferences");
            console.error('Email preferences error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

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
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
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
                                    value={session?.user?.email || ''}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50"
                                    readOnly
                                />
                                <p className="text-xs text-muted-foreground">
                                    Your email address cannot be changed
                                </p>
                            </div>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="currentPassword" className="text-sm font-medium">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="newPassword" className="text-sm font-medium">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Changing...' : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Email Preferences</CardTitle>
                        <CardDescription>Manage notification settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleEmailPreferences} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label htmlFor="emailUpdates" className="text-sm font-medium">Updates and Announcements</label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive emails about product updates and announcements
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="emailUpdates"
                                        checked={emailUpdates}
                                        onChange={(e) => {
                                            const newValue = e.target.checked;
                                            console.log('Checkbox toggled to:', newValue);
                                            setEmailUpdates(newValue);
                                        }}
                                        className="w-6 h-6"
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={isSaving} className="mt-4">
                                {isSaving ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default SettingsPage 