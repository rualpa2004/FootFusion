let isPending = false;

export function clearGoogleSignUpPending() {
    isPending = false;
}

export function markGoogleSignUpPending() {
    isPending = true;
}

export function isGoogleSignUpPending() {
    return isPending;
}