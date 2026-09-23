import React from "react";
import { useAuth } from "auth-context/src/auth.context";
import { User } from "lucide-react";
import { cn } from "ui/lib/utils";

interface UserIdentityProps {
  small?: boolean;
}

const UserIdentity: React.FC<UserIdentityProps> = ({ small }) => {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <div className="bg-[#e7ebee] rounded-full p-2">
        <User size={14} />
      </div>
      <p className={cn("break-words", small && "text-sm")}>
        {user?.name} {user?.surname}
      </p>
    </div>
  );
};

export default UserIdentity;
