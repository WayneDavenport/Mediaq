import bcrypt, { compare } from 'bcryptjs';

export async function hashPassword(password) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return hashedPassword
}

export async function verifyPassword(password, hashedPassword) {
    const isValid = await compare(password, hashedPassword);
    return isValid;
}