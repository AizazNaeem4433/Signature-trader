// signature-trader/components/ui/ToastNotification.tsx
"use client";

import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  success: {
    bg: "bg-green-500",
    icon: CheckCircle,
    iconColor: "text-white",
    progressBar: "bg-green-700/70",
  },
  error: {
    bg: "bg-red-500",
    icon: XCircle,
    iconColor: "text-white",
    progressBar: "bg-red-700/70",
  },
  info: {
    bg: "bg-blue-500",
    icon: Info,
    iconColor: "text-white",
    progressBar: "bg-blue-700/70",
  },
};

export default function ToastNotification() {
  const { message, type, show, clearNotification } = useNotificationStore();

  const currentVariant = type ? variantClasses[type] : null;

  // Auto-hide the notification after 4 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, clearNotification]);

  return (
    <AnimatePresence>
      {show && currentVariant && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className={cn(
            "fixed bottom-6 right-6 z-100 w-full max-w-sm overflow-hidden rounded-lg shadow-xl"
          )}
          onClick={clearNotification}
        >
          {/* Main Notification Card (uiverse.io inspired) */}
          <div className={cn("p-4 flex items-center space-x-4", currentVariant.bg)}>
            {/* Icon */}
            <div className="shrink-0">
              <currentVariant.icon className={cn("h-6 w-6", currentVariant.iconColor)} />
            </div>
            
            {/* Message Content */}
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{message}</p>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); clearNotification(); }}
              className="text-white opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress Bar (Indicates remaining time) */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
              className={cn("h-full", currentVariant.progressBar)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}