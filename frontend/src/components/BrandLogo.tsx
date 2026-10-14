import circleLogo from "../assets/logo/footfusion-logo-circle.png";
import horizontalLogo from "../assets/logo/footfusion-logo-horizontal.png";
import mainLogo from "../assets/logo/footfusion-logo-main.png";

const BRAND_NAME = 'FootFusion';
const BRAND_NAME_WITH_TAGLINE = 'FootFusion. Un club. Todas las ligas.';

type BrandLogoProps =
    | {
        /** Main logo (flags + "FOOTFUSION" + tagline) or horizontal logo (flags on the left, text on the right). */
        variant: 'main' | 'horizontal';
        className?: string;
    }
    | {
        /** Circular badge, used in navigation bars. */
        variant: 'circle';
        /** Shows the "FootFusion" wordmark next to the badge. */
        showName?: boolean;
        /** Classes of the wrapper element. */
        className?: string;
        /** Classes of the <img>; defaults to 48px. */
        imageClassName?: string;
    };

export function BrandLogo(props: BrandLogoProps) {
    if (props.variant !== 'circle') {
        return (
            <img
                src={props.variant === 'main' ? mainLogo : horizontalLogo}
                alt={BRAND_NAME_WITH_TAGLINE}
                className={props.className}
            />
        );
    }

    const {showName = false, className = '', imageClassName = 'size-12'} = props;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* When the name is visible the image is decorative, so screen readers do not read the name twice. */}
            <img src={circleLogo} alt={showName ? '' : BRAND_NAME} className={`${imageClassName} shrink-0`}/>
            {showName && <span className="font-display text-xl font-extrabold text-white">{BRAND_NAME}</span>}
        </div>
    );
}
