import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UserAvatar } from '../../../src/components/UserAvatar';

describe('UserAvatar', () => {
    it('shows the photo when there is one', () => {
        // Expected: an <img> with the photo, the name as alternative text and no referrer
        // (Google photos may refuse requests coming from other sites).
        render(<UserAvatar name="ApexManager" photoUrl="https://photos.example.com/apex.png"/>);

        const photo = screen.getByRole('img', {name: 'ApexManager'});
        expect(photo.tagName).toBe('IMG');
        expect(photo).toHaveAttribute('src', 'https://photos.example.com/apex.png');
        expect(photo).toHaveAttribute('referrerpolicy', 'no-referrer');
    });

    it('shows the generic user icon when there is no photo', () => {
        // Expected: an element with role "img" named after the user, which is not an <img> and has no initials.
        render(<UserAvatar name="ApexManager"/>);

        const avatar = screen.getByRole('img', {name: 'ApexManager'});
        expect(avatar.tagName).not.toBe('IMG');
        expect(avatar.querySelector('svg')).not.toBeNull();
        expect(avatar).toHaveTextContent('');
    });
});
