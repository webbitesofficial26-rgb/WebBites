import userData from '../models/User.js';
import cloudinary from "../config/cloudinary.js";


export const updateUser = async (req, res) => {
    try {
        // Users can only update their own account
        if (req.params.uid !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to update this user",
                status: 0,
            });
        }

        const { name, phone } = req.body;

        if (
            name !== undefined &&
            (typeof name !== "string" || !name.trim())
        ) {
            return res.status(400).json({
                message: "Please enter a valid name",
                status: 0,
            });
        }

        if (
            phone !== undefined &&
            (typeof phone !== "string" || !/^\d{10}$/.test(phone.trim()))
        ) {
            return res.status(400).json({
                message: "Please enter a valid 10-digit phone number",
                status: 0,
            });
        }

        const updates = {};

        if (name !== undefined) {
            updates.name = name.trim();
        }

        if (phone !== undefined) {
            updates.phone = phone.trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid profile fields provided",
                status: 0,
            });
        }

        const updatedUser = await userData.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password -resetPasswordToken -resetPasswordExpires");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found",
                status: 0,
            });
        }

        return res.status(200).json({
            message: "User updated successfully",
            status: 1,
            data: updatedUser,
        });

    } catch (error) {
        console.error("Update user error:", error);

        return res.status(500).json({
            message: "Failed to update user",
            status: 0,
        });
    }
};


export const getUserById = async (req, res) => {
    try {
        // Users can only access their own account
        if (req.params.uid !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to access this user",
                status: 0,
            });
        }

        const singleUser = await userData
            .findById(req.user.id)
            .select("-password -resetPasswordToken -resetPasswordExpires");

        if (!singleUser) {
            return res.status(404).json({
                message: "User not found",
                status: 0,
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            status: 1,
            data: singleUser,
        });

    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            message: "Failed to fetch user",
            status: 0,
        });
    }
};

export const getCustomerProfile = async (req, res) => {
  try {
    const user = await userData
      .findById(req.user.id)
      .select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({
        message: "Customer not found",
        status: 0,
      });
    }

    const data = user.toObject();
    // Older accounts may only have the legacy single-address field.
    if ((!data.addresses || data.addresses.length === 0) && data.address?.trim()) {
      data.addresses = [{ label: "Home", address: data.address, isDefault: true }];
    }
    res.status(200).json({
      message: "Customer profile fetched successfully",
      status: 1,
      data,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Failed to fetch customer profile",
      status: 0,
    });
  }
};


export const updateCustomerProfile = async (req, res) => {
  try {
    const { name, phone, address, addresses } = req.body || {};
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Please enter a valid name", status: 0 });
      }
      updates.name = name.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || !/^\d{10}$/.test(phone.trim())) {
        return res.status(400).json({ message: "Please enter a valid 10-digit phone number", status: 0 });
      }
      updates.phone = phone.trim();
    }

    if (address !== undefined) {
      if (typeof address !== "string") {
        return res.status(400).json({ message: "Please enter a valid address", status: 0 });
      }
      updates.address = address.trim();
    }

    if (addresses !== undefined) {
      if (!Array.isArray(addresses) || addresses.length > 20) {
        return res.status(400).json({ message: "Please provide a valid list of up to 20 addresses", status: 0 });
      }
      const cleanedAddresses = [];
      for (const item of addresses) {
        if (!item || typeof item.address !== "string" || !item.address.trim() || typeof (item.label || "Home") !== "string") {
          return res.status(400).json({ message: "Each saved address needs a label and address", status: 0 });
        }
        cleanedAddresses.push({
          label: (item.label || "Home").trim().slice(0, 40) || "Home",
          address: item.address.trim().slice(0, 300),
          isDefault: Boolean(item.isDefault),
        });
      }
      if (cleanedAddresses.length && !cleanedAddresses.some((item) => item.isDefault)) cleanedAddresses[0].isDefault = true;
      let defaultChosen = false;
      cleanedAddresses.forEach((item) => {
        if (item.isDefault && !defaultChosen) defaultChosen = true;
        else if (item.isDefault) item.isDefault = false;
      });
      updates.addresses = cleanedAddresses;
      updates.address = cleanedAddresses.find((item) => item.isDefault)?.address || cleanedAddresses[0]?.address || "";
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No profile changes were provided", status: 0 });
    }

    const user = await userData.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ message: "Customer not found", status: 0 });
    }

    return res.status(200).json({
      message: "Customer profile updated successfully",
      status: 1,
      data: user,
    });
  } catch (error) {
    console.error("Update customer profile error:", error.message);
    return res.status(500).json({
      message: "Failed to update customer profile",
      status: 0,
    });
  }
};


export const updateCustomerProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please choose an image", status: 0 });
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: "Profile picture storage is not configured", status: 0 });
    }
    const currentUser = await userData.findById(req.user.id).select("profilePicturePublicId");
    if (!currentUser) return res.status(404).json({ message: "Customer not found", status: 0 });
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: "webbites/profiles",
        resource_type: "image",
        transformation: [{ width: 500, height: 500, crop: "limit" }],
      }, (error, uploadResult) => error ? reject(error) : resolve(uploadResult));
      stream.end(req.file.buffer);
    });
    const updated = await userData.findByIdAndUpdate(req.user.id, {
      $set: { profilePicture: result.secure_url, profilePicturePublicId: result.public_id },
    }, { new: true }).select("-password -resetPasswordToken -resetPasswordExpires");
    if (currentUser.profilePicturePublicId) {
      cloudinary.uploader.destroy(currentUser.profilePicturePublicId).catch((error) => console.error("Old profile picture cleanup failed:", error.message));
    }
    return res.status(200).json({ message: "Profile picture updated successfully", status: 1, data: updated });
  } catch (error) {
    console.error("Update profile picture error:", error.message);
    return res.status(500).json({ message: "Failed to update profile picture", status: 0 });
  }
};
