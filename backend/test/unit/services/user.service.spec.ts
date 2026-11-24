import { UserRepository } from "../../../src/repositories/user.repository";
import { UserService } from "../../../src/services/user.service";
import { User, UserRole } from "../../../src/entities/user.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { CreateUserDTO } from "../../../src/dtos/user/create-user.dto";
import { UpdateUserDTO } from "../../../src/dtos/user/update-user.dto";
import { ConflictException, NotFoundException } from "@nestjs/common";

jest.mock('../../../src/repositories/user.repository', () => ({
  UserRepository: class UserRepository {},
}));

jest.mock('../../../src/entities/user.entity', () => ({
  User: class User {},
  UserRole: { ADMIN: 'ADMIN', USER: 'USER' },
}));

describe('UserService', () => {
    let userService: UserService;
    let userRepository: jest.Mocked<Pick<UserRepository, 'findByFirebaseUid' | 'create' | 'save'>>;

    const buildUser = (overrides: Partial<User> = {}): User => ({
        id: 1,
        firebaseUid: 'uid-123',
        name: 'Ana',
        email: 'ana@gmail.com',
        profilePhoto: undefined,
        role: UserRole.USER,
        registerDate: new Date('2023-01-01'),
        ...overrides
    }) as User;

    beforeEach(async () => {
        userRepository = {
            findByFirebaseUid: jest.fn(),
            create: jest.fn(),
            save: jest.fn().mockImplementation((user: User) => Promise.resolve(user))
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {provide: UserRepository, useValue: userRepository}
            ]
        }).compile();

        userService = module.get(UserService);
    })

    describe('register', () => {
        const dto: CreateUserDTO = {name: 'Ana'};

        it('creates an user when the firebaseUid is not registered', async () => {
            userRepository.findByFirebaseUid.mockResolvedValue(null);
            userRepository.create.mockResolvedValue(buildUser());

            const result = await userService.register('uid-123', 'ana@gmail.com', dto);

            expect(userRepository.create).toHaveBeenCalledWith({
                firebaseUid: 'uid-123',
                email: 'ana@gmail.com',
                name: 'Ana'
            });

            expect(result.email).toBe('ana@gmail.com');
            expect(result.name).toBe('Ana');
        });

        it('throws ConflictException when the firebaseUid is already registered', async () => {
            userRepository.findByFirebaseUid.mockResolvedValue(buildUser());

            await expect(userService.register('uid-123', 'ana@gmail.com', dto)).rejects.toThrow(ConflictException);
            expect(userRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('findByFirebaseUid', () => {
        it('returns de user profile when it exists', async () => {
            userRepository.findByFirebaseUid.mockResolvedValue(buildUser());

            const result = await userService.findByFirebaseUid('uid-123');

            expect(result.id).toBe(1);
            expect(result.role).toBe(UserRole.USER);
        });
        
        it('throws NotFoundException when the user does not exist', async () => {
            userRepository.findByFirebaseUid.mockResolvedValue(null);

            await expect(userService.findByFirebaseUid('uid-123')).rejects.toThrow(NotFoundException);
        })
    })

    describe('updateProfile', () => {
        const dto: UpdateUserDTO = {name: 'Ana la Mánager'};

        it('saves the new manager name of the authenticated user', async () => {
            // Expected: the user found by his uid is saved with the new name and returned as a profile.
            userRepository.findByFirebaseUid.mockResolvedValue(buildUser());

            const result = await userService.updateProfile('uid-123', dto);

            expect(userRepository.findByFirebaseUid).toHaveBeenCalledWith('uid-123');
            expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({id: 1, name: 'Ana la Mánager'}));
            expect(result).toMatchObject({id: 1, name: 'Ana la Mánager', email: 'ana@gmail.com'});
        });

        it('throws NotFoundException when the user has no profile', async () => {
            // Expected: 404 and nothing is saved.
            userRepository.findByFirebaseUid.mockResolvedValue(null);

            await expect(userService.updateProfile('uid-123', dto)).rejects.toThrow(NotFoundException);
            expect(userRepository.save).not.toHaveBeenCalled();
        });
    });
});