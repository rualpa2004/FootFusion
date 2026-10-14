import { UserRole } from "../../entities/user.entity";

export class UserResponseDTO {
    id: number;
    name: string;
    email: string;
    profilePhoto?: string;
    role: UserRole;
    registerDate: Date;


    constructor(user:  {
        id: number;
        name: string;
        email: string;
        profilePhoto?: string;
        role: UserRole;
        registerDate: Date;
    }) {
        this.id = user.id;
        this.name = user.name;
        this.email = user.email;
        this.profilePhoto = user.profilePhoto;
        this.role = user.role;
        this.registerDate = user.registerDate;
    }
}