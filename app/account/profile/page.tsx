"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, User as UserIcon, Phone, MapPin } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";

// Define interface for local/Firestore profile details
interface LocalProfileDetails {
    phone: string;
    address: string;
    // You would add other non-Auth fields here
}

export default function ProfilePage() {
  const { addNotification: notify } = useNotificationStore(); // Notification helper
  const { user: authUser, isLoggedIn, isInitialized } = useAuthStore(); // Get user from AuthStore

  // Local state for the form, initialized with Auth data
  const [displayName, setDisplayName] = useState(authUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(authUser?.photoURL || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // --- 1. Fetch Non-Auth Details (Phone/Address) on Load ---
  useEffect(() => {
    if (authUser && authUser.uid) {
        setDisplayName(authUser.displayName || "");
        setPhotoURL(authUser.photoURL || "");

        const fetchFirestoreDetails = async () => {
            const userRef = doc(db, 'users', authUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data() as LocalProfileDetails;
                // Update local state with data from Firestore
                setPhone(data.phone || '');
                setAddress(data.address || '');
            }
        };
        fetchFirestoreDetails();
    }
  }, [authUser]);

  // --- 2. Handle Profile Update (Auth + Firestore) ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return; // Should never happen, but safe check

    setIsUpdating(true);

    try {
      // A. Update Firebase Auth Profile (Name and Photo URL)
      await updateProfile(authUser, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim(),
      });

      // B. Update Firestore Document (Phone and Address)
      const userRef = doc(db, 'users', authUser.uid);
      await setDoc(userRef, {
        phone: phone.trim(),
        address: address.trim(),
        // NOTE: Preserve existing fields like role and email if you use merge: true
      }, { merge: true });

      // Since the Auth update completes quickly, we notify the user.
      notify("Profile details updated successfully!", "success");

      // OPTIONAL: Manually re-trigger global state sync to refresh Auth data instantly
      // (The onAuthStateChanged listener handles this, but forcing it can be faster)
      await authUser.reload();

    } catch (error) {
      console.error("Profile Update Error:", error);
      notify("Failed to update profile. Please try again.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- 3. Protection/Loading State ---
  if (!isInitialized || !isLoggedIn) {
    // Layout protection handles redirection; this is a safety loader
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFCE00]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      // ADDED: max-w-2xl and mx-auto for better responsiveness on large screens
      className="space-y-6 max-w-2xl mx-auto p-4 sm:p-6" 
    >
      <h2 className="text-3xl font-bold mb-6 text-[#FFCE00] text-center sm:text-left">Profile Settings ✨</h2>

      {/* Avatar Display (Using authUser for up-to-date name/photo) */}
      <div className="flex justify-center mb-8">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32"> {/* Slightly increased size */}
          <img
            src={authUser?.photoURL || "/default-avatar.png"}
            alt="Profile Avatar"
            className="w-full h-full rounded-full object-cover border-4 border-[#FFCE00] shadow-lg"
          />
        </div>
      </div>

      {/* Profile Update Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {/* Row 1: Name and Phone (side-by-side on md, stacked on small) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="displayName" className="flex items-center gap-2 mb-2 font-medium">
              <UserIcon className="w-4 h-4 text-[#FFCE00]" /> Name
            </Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone" className="flex items-center gap-2 mb-2 font-medium">
              <Phone className="w-4 h-4 text-[#FFCE00]" /> Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        {/* Row 2: Address (full width) */}
        <div>
          <Label htmlFor="address" className="flex items-center gap-2 mb-2 font-medium">
            <MapPin className="w-4 h-4 text-[#FFCE00]" /> Address
          </Label>
          <Input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address"
          />
        </div>

        {/* Row 3: Photo URL */}
        <div>
          <Label htmlFor="photoURL" className="flex items-center gap-2 mb-2 font-medium">
            <Mail className="w-4 h-4 text-[#FFCE00]" /> Avatar URL
          </Label>
          <Input
            id="photoURL"
            type="url"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            placeholder="Link to an image (optional)"
          />
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          disabled={isUpdating}
          className="w-full mt-8 bg-[#FFCE00] hover:bg-[#E6B800] text-black transition-colors"
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </motion.div>
  );
}