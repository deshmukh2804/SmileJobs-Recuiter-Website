const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const fs = require("fs");

class UserService {
  // ─── Register User ────────────────────────────────────────
  async registerUser({ name, email, password, avatarPath }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Clean up uploaded file if exists
      if (avatarPath) fs.unlinkSync(avatarPath);
      throw new ApiError(400, "User with this email already exists");
    }

    let avatar = { public_id: "", url: "" };

    // Upload avatar to Cloudinary if provided
    if (avatarPath) {
      try {
        const cloudinaryResult = await uploadToCloudinary(
          avatarPath,
          "avatars"
        );
        avatar = {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.url,
        };
        // Remove file from local storage after upload
        fs.unlinkSync(avatarPath);
      } catch (error) {
        fs.unlinkSync(avatarPath);
        throw new ApiError(500, "Error uploading avatar");
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      avatar,
    });

    // Generate token
    const token = user.generateToken();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
  }

  // ─── Login User ───────────────────────────────────────────
  async loginUser({ email, password }) {
    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, "Account is deactivated");
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Generate token
    const token = user.generateToken();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, token };
  }

  // ─── Get User Profile ─────────────────────────────────────
  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return user;
  }

  // ─── Update User Profile ──────────────────────────────────
  async updateUserProfile(userId, updateData, avatarPath) {
    const user = await User.findById(userId);
    if (!user) {
      if (avatarPath) fs.unlinkSync(avatarPath);
      throw new ApiError(404, "User not found");
    }

    // Update avatar if new file provided
    if (avatarPath) {
      try {
        // Delete old avatar from Cloudinary
        if (user.avatar && user.avatar.public_id) {
          await deleteFromCloudinary(user.avatar.public_id);
        }

        // Upload new avatar
        const cloudinaryResult = await uploadToCloudinary(
          avatarPath,
          "avatars"
        );
        updateData.avatar = {
          public_id: cloudinaryResult.public_id,
          url: cloudinaryResult.url,
        };

        // Remove temp file
        fs.unlinkSync(avatarPath);
      } catch (error) {
        if (avatarPath) fs.unlinkSync(avatarPath);
        throw new ApiError(500, "Error uploading avatar");
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    return updatedUser;
  }

  // ─── Delete User ──────────────────────────────────────────
  async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Delete avatar from Cloudinary
    if (user.avatar && user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    await User.findByIdAndDelete(userId);

    return { message: "User deleted successfully" };
  }

  // ─── Get All Users (Admin) ─────────────────────────────────
  async getAllUsers(query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new UserService();