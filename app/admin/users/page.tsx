// signature-trader/app/admin/users/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, AlertTriangle, Mail, User } from 'lucide-react'; 
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, setDoc } from 'firebase/firestore';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useNotificationStore } from '@/lib/store/useNotificationStore';
import { cn } from '@/lib/utils';

// Define a type for the user document data
interface UserData {
    uid: string;
    displayName: string;
    email: string;
    role: 'user' | 'admin';
}

export default function AdminUsersPage() {
    const { user: currentUser } = useAuthStore();
    const { addNotification } = useNotificationStore();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // 1. Real-Time Fetch of All Users
    useEffect(() => {
        const usersQuery = query(collection(db, 'users'));
        
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            // SUCCESS HANDLER: This runs when data is received
            const usersList: UserData[] = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
            } as UserData));

            setUsers(usersList);
            setLoading(false);
            setFetchError(null);
            
        }, (error) => {
            // ERROR HANDLER: This runs only on network/permission failures
            console.error("Error fetching users:", error);
            addNotification("Failed to load user list. Check network or security rules.", "error");
            
            setFetchError(error.message); 
            setLoading(false);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, [addNotification]);

    // 2. Handler to Change Role in Firestore
    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
        if (currentUser?.uid === userId) {
            addNotification("You cannot change your own role from this interface.", "error");
            return;
        }

        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, { role: newRole }, { merge: true });
            addNotification(`Role for ${users.find(u => u.uid === userId)?.displayName} updated to ${newRole}!`, "success");
        } catch (error) {
            console.error("Error updating user role:", error);
            addNotification("Failed to update role. Check Firestore permissions.", "error");
        }
    };
    
    // Utility to determine badge class
    const getRoleBadgeClass = (role: string) => {
        return role === 'admin' 
            ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' 
            : 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200';
    };


    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold mb-4 text-red-600 flex items-center gap-2">
                <Users className='w-6 h-6'/> User & Role Management 🛡️
            </h2>
            <p className="text-muted-foreground">Centralized control over user accounts and permission levels.</p>

            {/* Conditional Rendering: Loading, Error, Empty States */}
            {loading && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-red-500" />
                    Loading users...
                </div>
            )}
            
            {fetchError && !loading && (
                <div className="text-center py-6 text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Error fetching users: {fetchError}. Check console for details.
                </div>
            )}

            {!loading && !fetchError && users.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground italic border border-border rounded-lg bg-muted/50">
                    No users found in the database.
                </div>
            )}

            {/* --- Main Content (Only shows if loaded and not empty/error) --- */}
            {!loading && !fetchError && users.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* 1. Mobile/Small Screen Card View (Hidden on MD+) */}
                    <div className="space-y-4 md:hidden">
                        {users.map((user) => (
                            <div 
                                key={user.uid} 
                                className={cn(
                                    "p-4 border border-border rounded-lg shadow-sm bg-card space-y-3",
                                    user.role === 'admin' && 'border-red-600/50 bg-red-500/10' // Highlight admin users
                                )}
                            >
                                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                    <p className="text-base font-semibold flex items-center gap-2">
                                        <User className='w-4 h-4 text-foreground'/> {user.displayName}
                                        {user.uid === currentUser?.uid && <span className="text-red-600 font-bold text-xs">(You)</span>}
                                    </p>
                                    <span className={cn(
                                        "px-3 inline-flex text-xs leading-5 font-semibold rounded-full capitalize",
                                        getRoleBadgeClass(user.role)
                                    )}>
                                        {user.role}
                                    </span>
                                </div>

                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className='w-4 h-4' /> {user.email}
                                </p>

                                {/* Role Selector Action (Full width on mobile) */}
                                <div className="pt-3 border-t border-border/50">
                                    <Select
                                        value={user.role}
                                        onValueChange={(newRole: 'user' | 'admin') => handleRoleChange(user.uid, newRole)}
                                        disabled={user.uid === currentUser?.uid}
                                    >
                                        <SelectTrigger className="w-full h-9 text-sm">
                                            <SelectValue placeholder="Change Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="user">User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 2. Desktop/Tablet Table View (Hidden on Small Screens) */}
                    <div className="hidden md:block overflow-x-auto border border-border rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    {["Display Name", "Email", "Role", "Actions"].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((user) => (
                                    <tr 
                                        key={user.uid} 
                                        className={cn(user.role === 'admin' ? 'bg-red-500/10' : 'hover:bg-muted/20')}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                            {user.displayName} {user.uid === currentUser?.uid && <span className="text-red-500 font-semibold">(You)</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={cn(
                                                "px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize",
                                                getRoleBadgeClass(user.role)
                                            )}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <Select
                                                value={user.role}
                                                onValueChange={(newRole: 'user' | 'admin') => handleRoleChange(user.uid, newRole)}
                                                disabled={user.uid === currentUser?.uid}
                                            >
                                                <SelectTrigger className="w-[120px] h-9">
                                                    <SelectValue placeholder="Change Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="user">User</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}