import { Check } from "lucide-react";
import { PASSWORD_REQUIREMENTS } from "../../utils/password";

export function PasswordRequirements({password}: Readonly<{password: string}>) {
    return (
        <ul aria-label="Requisitos de la contraseña" className="grid grid-cols-2 gap-x-3 gap-y-1">
            {PASSWORD_REQUIREMENTS.map(({id, label, isMet}) => {
                const met = isMet(password);
                return (
                    <li
                        key={id}
                        className={`flex items-center gap-1.5 text-[11px] leading-4 ${met ? 'text-[#B9F8D3]' : 'text-muted'} ${
                            id === 'special' ? 'col-span-2' : ''
                        }`}
                    >
                        {met ? (
                            <Check className="size-3.5 shrink-0 text-primary" aria-hidden/>
                        ) : (
                            <span className="flex size-3.5 shrink-0 items-center justify-center" aria-hidden>
                                <span className="size-[5px] rounded-full bg-subtle"/>
                            </span>
                        )}
                        {label}
                        <span className="sr-only">{met ? ' (cumplido)' : ' (pendiente)'}</span>
                    </li>
                );
            })}
        </ul>
    );
}
