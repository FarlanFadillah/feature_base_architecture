import { matchedData } from "express-validator";
import { asyncHandler } from "../../shared/utils/asyncHandler.mjs";
import * as authService from "./auth.service.mjs";
import { ExpressError } from "../../shared/utils/custom.error.mjs";

export const register = asyncHandler(async (req, res, next) => {
    const id = await authService.registerUser(req.matchedData);
    res.json({ success: true, message: "User created", data: { id: id } });
});

export const login = asyncHandler(async (req, res, next) => {
    const { username, password } = req.matchedData;

    const { user, match } = await authService.verifyPassword(
        username,
        password,
    );
    if (!match) return next(new ExpressError("Password missmatch", 400));

    const token = await authService.generateToken({ username });

    res.json({
        success: true,
        message: "User log in successfully",
        data: {
            token: token,
            user: {
                username: user.username,
                fullname: user.first_name + " " + user.last_name,
                role: user.role,
            },
        },
    });
});

export const updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    if (!id) return next(new ExpressError("Invalid id", 400));
    await authService.updateUser(id, req.matchedData);
    res.status(200).json({
        success: true,
        message: "User updated successfully",
    });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    if (!id) return next(new ExpressError("Invalid id", 400));
    await authService.deleteUser(id, req.user.username);
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});

export const verifyToken = asyncHandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Token Valid",
        data: {
            user: req.user,
        },
    });
});
