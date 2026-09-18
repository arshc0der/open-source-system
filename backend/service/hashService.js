import argon2 from "argon2";

const hashPassword = async (password) => {
    return await argon2.hash(password);
};

const verifyPassword = async (hashedPassword, password) => {
    return await argon2.verify(hashedPassword, password);
};

module.exports = {
    hashPassword,
    verifyPassword,
};