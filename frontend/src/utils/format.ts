import type { PlayerPosition } from "../services/dashboard.service";

const numberFormatter = new Intl.NumberFormat('es-ES');
// Spanish formatting skips the separator in 4-digit numbers ("1000"); amounts of money always use it.
const groupedNumberFormatter = new Intl.NumberFormat('es-ES', {useGrouping: 'always'});
const millionsFormatter = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 2});
const dateFormatter = new Intl.DateTimeFormat('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'});

const POSITION_LABELS: Record<PlayerPosition, string> = {
    GK: 'POR',
    DEF: 'DEF',
    MID: 'MED',
    FWD: 'DEL'
};

export function formatNumber(value: number): string {
    return numberFormatter.format(value);
}

/** Whole euros with thousands separator: 100000000 -> "100.000.000 €". */
export function formatEuros(value: number): string {
    return `${groupedNumberFormatter.format(value)} €`;
}

/** Euros in millions with up to two decimals: 12500000 -> "12,5 M€". */
export function formatMillions(value: number): string {
    return `${millionsFormatter.format(value / 1_000_000)} M€`;
}

/** Signed points of a scoring setting: 4 -> "+4", -2 -> "−2". */
export function formatSignedPoints(value: number): string {
    return value > 0 ? `+${value}` : `−${Math.abs(value)}`;
}

/** Date as dd/mm/yyyy. */
export function formatDate(isoDate: string): string {
    return dateFormatter.format(new Date(isoDate));
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
