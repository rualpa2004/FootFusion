import { SetMetadata } from "@nestjs/common";

export const ALLOW_UNVERIFIED_EMAIL_KEY = 'allowUnverifiedEmail';

//This allow steps for users before verifying the email (for example: creating the profile)
export const AllowUnverifiedEmail = () => SetMetadata(ALLOW_UNVERIFIED_EMAIL_KEY, true);
