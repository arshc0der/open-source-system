import User from "../models/userModel.js";
/*
import {
    hashPassword,
    verifyPassword
} from './hashService';
import {
    generateAccessToken,
    generateRefreshToken
} from './tokenService';

*/

const loginUser= async (email,password)=>{
    const user = await User.getByEmail(email);
    console.log(user);
}

export {loginUser};