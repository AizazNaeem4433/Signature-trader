"use client";

import { useEffect, useState } from 'react';
import { db } from './firebase'; 
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Prevents persistence from being enabled multiple times
let persistenceEnabled = false;

export const useFirebaseClientInit = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only attempt persistence once per client session
    if (persistenceEnabled) {
      setIsReady(true);
      return;
    }

    // Enable offline persistence for Firestore
    enableIndexedDbPersistence(db)
      .then(() => {
        persistenceEnabled = true;
        console.log("Firestore persistence enabled successfully.");
        setIsReady(true);
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore persistence could not be enabled (multiple tabs).");
        } else if (err.code === 'unimplemented') {
          console.error("Firestore persistence failed: Unimplemented (browser issue).");
        }
        // Still allow the app to run even if persistence fails
        setIsReady(true); 
      });
  }, []);

  return isReady;
};