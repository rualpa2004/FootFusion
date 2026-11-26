import { User } from "lucide-react";
import { getInitials } from "../utils/profile";

interface UserAvatarProps {
    name: string;
    photoUrl?: string;
    className?: string;
    showInitials?: boolean;
}

/** Profile photo or, without one, the initials of the name (or a generic user icon). */
export function UserAvatar({name, photoUrl, className = 'size-9', showInitials = true}: Readonly<UserAvatarProps>) {
    if (photoUrl) {
        // no-referrer: Google profile photos can refuse requests that come from other sites.
        return (
            <img
                src={photoUrl}
                alt={name}
                referrerPolicy="no-referrer"
                className={`${className} shrink-0 rounded-full object-cover`}
            />
        );
    }

    const initials = showInitials ? getInitials(name) : '';
    return (
        <div
            role="img"
            aria-label={name}
            className={`${className} flex shrink-0 items-center justify-center rounded-full bg-surface-raised text-muted [container-type:size]`}
        >
            {initials ? (
                <span aria-hidden className="font-display text-[40cqh] leading-none font-extrabold text-primary">{initials}</span>
            ) : (
                <User className="size-[55%]" aria-hidden/>
            )}
        </div>
    );
}
