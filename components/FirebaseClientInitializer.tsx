// signature-trader/components/FirebaseClientInitializer.tsx
"use client";

import { useFirebaseClientInit } from "@/lib/firebase-client-init";

/**
 * A Client Component wrapper whose only job is to safely call the 
 * useFirebaseClientInit hook to enable Firestore persistence.
 */
export default function FirebaseClientInitializer() {
    // Calling the client hook is safe here because this component is marked "use client"
    useFirebaseClientInit();

    // It renders nothing, as its purpose is side-effects (initialization).
    return null;
}