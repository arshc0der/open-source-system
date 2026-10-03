import argon2 from "argon2";

export const hashPassword = async (password) => {
  return argon2.hash(password);
};

export const verifyPassword = async (hashedPassword, password) => {
  return argon2.verify(hashedPassword, password);
};
