import { jwt } from "jsonwebtoken";

const genrateAccessToken = (userId) => {
    try {
        return jwt.sign(
            { userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );
    } catch (error) {
        console.log(`${error} | ${new Date()}`);
    }
};

const genrateRefreshToken = (userId) => {
    try {
        return jwt.sign(
            { userId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );
    } catch (error) {
        console.log(`${error} | ${new Date()}`);
    }
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );
    } catch (error) {
        console.log(`${error} | ${new Date()}`);
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (error) {
        console.log(`${error} | ${new Date()}`);
    }
};
module.exports = {
    genrateAccessToken,
    genrateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};