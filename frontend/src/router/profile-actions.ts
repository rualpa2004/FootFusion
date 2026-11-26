import type { ActionFunctionArgs } from "react-router-dom";
import { MANAGER_NAME_ERROR } from "../config/user.constants";
import { sendPasswordChangeEmail, updateProfile } from "../services/auth.service";
import { maskEmail } from "../utils/format";
import { getErrorMessage, isValidManagerName, readText, type FormActionResult } from "./actions";

/** Values of the "intent" field: the profile page has two forms that submit to the same action. */
export const RENAME_INTENT = 'rename';
export const CHANGE_PASSWORD_INTENT = 'changePassword';

export interface ProfileActionResult extends FormActionResult<'name'> {
    nameUpdated?: boolean;
    passwordEmailSentTo?: string;
}

export async function profileAction({request}: ActionFunctionArgs): Promise<ProfileActionResult> {
    const formData = await request.formData();

    if (formData.get('intent') === CHANGE_PASSWORD_INTENT) {
        try {
            return {passwordEmailSentTo: maskEmail(await sendPasswordChangeEmail())};
        } catch (error) {
            return {formError: getErrorMessage(error)};
        }
    }

    const name = readText(formData, 'name');
    if (!isValidManagerName(name)) {
        return {fieldErrors: {name: MANAGER_NAME_ERROR}};
    }

    try {
        await updateProfile(name);
        return {nameUpdated: true};
    } catch (error) {
        return {formError: getErrorMessage(error)};
    }
}
