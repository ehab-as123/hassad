const bcrypt =require ("bcryptjs");

const hashPassword = (password)=> bcrypt.hash (password,12);

const comparePassword = (password,hashPassword)=> bcrypt.compare(password,hashPassword);

module.exports ={hashPassword,comparePassword};