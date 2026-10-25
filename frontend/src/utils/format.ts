import type { PlayerPosition } from "../services/dashboard.service";

const numberFormatter = new Intl.NumberFormat('es-ES');

const POSITION_LABELS: Record<PlayerPosition, string> = {
    GK: 'POR',
    DEF: 'DEF',
    MID: 'MED',
    FWD: 'DEL'
};

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

export function formatPositionLabel(position: PlayerPosition): string {
    return POSITION_LABELS[position];
}

export function formatPrice(priceInMillions: number): string {
    return `£${priceInMillions.toFixed(1)}M`;
}

/** Returns the remaining time until `isoDate` as "1d 14h 42m", or "0d 0h 0m" if it already passed. */
export function formatTimeRemaining(isoDate: string, now: number = Date.now()): string {
    const remainingMs = Math.max(0, new Date(isoDate).getTime() - now);
    const totalMinutes = Math.floor(remainingMs / 60_000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return `${days}d ${hours}h ${minutes}m`;
}

/**
 * Hides most of the part before the "@" so the address can be shown in notices without exposing it:
 * keeps its first and last characters ("pepe@gmail.com" -> "p***e@gmail.com").
 */
export function maskEmail(email: string): string {
    const atIndex = email.lastIndexOf('@');
    if (atIndex <= 0) {
        return email;
    }

    const localPart = email.slice(0, atIndex);
    const lastCharacter = localPart.length > 1 ? localPart[localPart.length - 1] : '';
    return `${localPart[0]}***${lastCharacter}${email.slice(atIndex)}`;
}
