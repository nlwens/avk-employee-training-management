import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "@ui/hooks/use-toast";

export interface ToastAndNavigateProps {
  message: string;
  to: string;
  variant?: "destructive" | "success" | "default";
  replace?: boolean;
}

export function ToastAndNavigate({
  message,
  to,
  variant = "destructive",
  replace = true,
}: ToastAndNavigateProps) {
  const { toast } = useToast();

  useEffect(() => {
    toast({ variant, description: message });
  }, [message, toast, variant]);

  return <Navigate to={to} replace={replace} />;
}

export default ToastAndNavigate;
