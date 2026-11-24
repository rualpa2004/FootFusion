import type { PlayerPosition } from "../services/dashboard.service";

const numberFormatter = new Intl.NumberFormat('es-ES');
// Spanish formatting skips the separator in 4-digit numbers ("1000"); amounts of money always use it.
const groupedNumberFormatter = new Intl.NumberFormat('es-ES', {useGrouping: 'always'});
const millionsFormatter = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 2});
const dateFormatter = new Intl.DateTimeFormat('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'});

const MATCHDAY_TIME_ZONE = 'Europe/Madrid';
const weekdayFormatter = new Intl.DateTimeFormat('es-ES', {weekday: 'long', timeZone: MATCHDAY_TIME_ZONE});

const dayMonthFormatter = new Intl.DateTimeFormat('es-ES', {day: 'numeric', month: 'numeric', timeZone: MATCHDAY_TIME_ZONE});
const timeFormatter = new Intl.DateTimeFormat('es-ES', {hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: MATCHDAY_TIME_ZONE});

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

/** Day and time of a matchday event in Spanish time: "sábado 22/11 a las 14:00". */
export function formatMatchdayTime(isoDate: string): string {
    const date = new Date(isoDate);
    const parts = Object.fromEntries(dayMonthFormatter.formatToParts(date).map((part) => [part.type, part.value]));
    const dayMonth = `${parts.day.padStart(2, '0')}/${parts.month.padStart(2, '0')}`;
    return `${weekdayFormatter.format(date)} ${dayMonth} a las ${timeFormatter.format(date)}`;
}

export function formatRank(position: number): string {
    return `${position}.º`;
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
    const lastCharacter = localPart.length > 1 ? localPart.at(-1) : '';
    return `${localPart[0]}***${lastCharacter}${email.slice(atIndex)}`;
}
