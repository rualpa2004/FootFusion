import { User } from "lucide-react";

interface UserAvatarProps {
    name: string;
    photoUrl?: string;
    className?: string;
}

/** Profile photo, or a generic user icon when there is no photo. */
export function UserAvatar({name, photoUrl, className = 'size-9'}: UserAvatarProps) {
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

    return (
        <div
            role="img"
            aria-label={name}
            className={`${className} flex shrink-0 items-center justify-center rounded-full bg-surface-raised text-muted`}
        >
            <User className="size-[55%]" aria-hidden/>
        </div>
    );
}
