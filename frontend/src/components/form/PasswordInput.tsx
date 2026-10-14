import { Eye, EyeOff, Lock } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { TextInput } from "./TextInput";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    hasError?: boolean;
}

export function PasswordInput(props: PasswordInputProps) {
    //This useState is to change the password view from hidden view to show it to the user
    const [isVisible, setIsVisible] = useState(false);

    return (
        <TextInput
            {...props}
            icon={Lock}
            type={isVisible ? 'text' : 'password'}
            trailing={
                <button
                    type="button"
                    onClick={() => setIsVisible((visible) => !visible)}
                    aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="shrink-0 text-muted transition-colors hover:text-white"
                >
                    {isVisible
                        ? <EyeOff className="size-[18px]" aria-hidden/>
                        : <Eye className="size-[18px]" aria-hidden/>}
                </button>
            }
        />
    );
}
