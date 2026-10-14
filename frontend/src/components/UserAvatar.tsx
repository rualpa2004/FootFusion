import { getInitials } from "../utils/format";

interface UserAvatarProps {
    name: string;
    photoUrl?: string;
    className?: string;
}

/** Profile photo, or the user's initials when there is no photo. */
export function UserAvatar({name, photoUrl, className = 'size-9'}: UserAvatarProps) {
    if (photoUrl) {
        return <img src={photoUrl} alt={name} className={`${className} shrink-0 rounded-full object-cover`}/>;
    }

    return (
        <div
            className={`${className} flex shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-bold text-primary`}
            aria-label={name}
        >
            {getInitials(name)}
        </div>
    );
}
