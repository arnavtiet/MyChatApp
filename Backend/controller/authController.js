const { profile } = require("console");
const { jwtGenerator } = require("../helpers/utils");
const user = require("../models/user");
const { default: User } = require("../models/user");
const bcrypt = require("bcrypt");
const { cloudinary } = require("../helpers/cloudinary");

//login
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loguser = await user.findOne({ email });
    if (!loguser) {
      return res
        .send({
          success: false,
          message: "User not Found. Please Create account first ",
        })
        .status(400);
    }
    const isPassword = await bcrypt.compare(password, loguser.password);
    if (!isPassword) {
      return res
        .send({ success: false, message: "Invalid Password " })
        .status(400);
    }
    jwtGenerator(loguser._id, res);
    res
      .json({
        name: loguser.name,
        email: loguser.email,
        _id: loguser._id,
        profilePic: loguser.profilePic,
        success: true,
      })
      .status(200);
  } catch (error) {
    console.log(error);
    res.send("Internal server error").status(500);
  }
};

//register
const regController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.send("Internal server error").status(500);
    }
    if (password.length < 6) {
      return res

        .send({ success: false, message: "Password length is short" })
        .status(400);
    }
    const log = await user.findOne({ email });
    if (log) {
      return res
        .send({ success: false, message: "User already exists" })
        .status(400);
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const newUser = new user({
      name: name,
      email: email,
      password: hashPassword,
    });

    if (newUser) {
      const jwtToken = jwtGenerator(newUser._id, res);
      await newUser.save();
      res
        .json({
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          profilePic: newUser.profilePic,
          createdAt: newUser.createdAt,
          success: true,
        })
        .status(201);
    }
  } catch (error) {
    console.log(error);
    res.send("Internal server error").status(500);
  }
};
const logoutController = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res
      .status(200)
      .send({ success: true, message: "Successfully logged Out" });
  } catch (error) {
    console.log(error);
    res.send("Internal server error.Couldnt log out").status(500);
  }
};
//Updating profile

const profileupdateController = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res
        .status(400)
        .json({ success: false, message: "Profile pic is required" });
    }
    const cloudResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await user.findByIdAndUpdate(
      userId,
      { profilePic: cloudResponse.secure_url },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.send("Internal server error.Could`nt update profile").status(500);
  }
};

//Checking
const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  loginController,
  regController,
  logoutController,
  checkAuth,
  profileupdateController,
};
