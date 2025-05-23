const db = require("../../config/db");
const { generateUserToken } = require("../../config/userToken");
const firebaseAdmin = require("../../config/firebase");
const bcrypt = require("bcrypt");
const axios = require("axios");
require("dotenv").config();

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

exports.signupForEmailPassword = async (req, res) => {
  const { first_name, last_name, email, password, country, phone, role } =
    req.body;
  try {
    // Check if all required fields are provided
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Please provide email, password required fields",
      });
    }

    // Chack Duplicate entry
    const [checkEmail] = await db.query(`SELECT id FROM users WHERE email=?`, [
      email,
    ]);

    if (checkEmail.length > 0) {
      return res.status(400).send({
        success: false,
        message: "Email already exists. Please use a different email.",
      });
    }

    const user = await firebaseAdmin.auth().createUser({
      email,
      password,
    });

    const uid = user.uid;

    if (user) {
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const sign_up_method = "password";

      await db.query(
        `INSERT INTO users (uid, first_name, last_name, sign_up_method, email, password, country, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uid,
          first_name || "",
          last_name || "",
          sign_up_method,
          email,
          hashedPassword,
          country || "",
          phone || "",
          role || "",
        ]
      );
    }

    const [userData] = await db.query(`SELECT * FROM users WHERE uid=?`, [uid]);

    const authToken = generateUserToken({ uid: uid });

    res.status(200).json({
      success: true,
      message: "User created successfully",
      data: {
        user: userData[0],
        token: authToken,
      },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.loginForEmailPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        success: false,
        error: "Please provide your credentials",
      });
    }
    const [results] = await db.query(`SELECT * FROM users WHERE email=?`, [
      email,
    ]);
    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Email and Password is not correct",
      });
    }
    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Email and Password is not correct",
      });
    }
    const token = generateUserToken({ uid: user.uid });
    const { password: pwd, ...usersWithoutPassword } = user;
    res.status(200).json({
      success: true,
      message: "Successfully logged in",
      data: {
        user: usersWithoutPassword,
        token,
      },
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.resetPasswordRequest = async (req, res) => {
  const { email } = req.body;

  try {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        requestType: "PASSWORD_RESET",
        email,
      }
    );

    res.status(200).json({
      success: true,
      message: "Reset code sent to email",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message:
        err.response?.data?.error?.message || "Failed to send reset code",
      error: err.message,
    });
  }
};

exports.resetPasswordConfirm = async (req, res) => {
  const { oobCode, newPassword } = req.body;

  try {
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${FIREBASE_API_KEY}`,
      {
        oobCode,
        newPassword,
      }
    );

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.response?.data?.error?.message || "Failed to reset password",
      error: err.message,
    });
  }
};

// verify user
exports.verifyTokenForSocailMedia = async (req, res) => {
  const { token, role } = req.body;

  if (!token || !role) {
    return res.status(201).send({
      success: false,
      message: "token and role is required in body",
    });
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    const { uid, name, email, picture, firebase } = decodedToken;

    // Extract sign-in provider
    const signUpMethod = firebase?.sign_in_provider || "unknown";

    // Check if user already exists
    const [checkData] = await db.query(`SELECT * FROM users WHERE uid=?`, [
      uid,
    ]);

    if (checkData.length > 0) {
      const existingUser = checkData[0];
      const authToken = generateUserToken({ uid: existingUser.uid });

      res.status(200).json({
        success: true,
        message: "User already exists",
        data: {
          user: existingUser,
          token: authToken,
        },
      });
    } else {
      await db.query(
        `INSERT INTO users (uid, first_name, sign_up_method, email, picture, country, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uid,
          name || "",
          signUpMethod,
          email || "",
          picture || "",
          country || "",
          phone || "",
          role,
        ]
      );

      const [userData] = await db.query(`SELECT * FROM users WHERE uid=?`, [
        uid,
      ]);

      const authToken = generateUserToken({ uid: uid });

      res.status(200).json({
        success: true,
        message: "User registered",
        data: {
          user: userData[0],
          token: authToken,
        },
      });
    }
  } catch (error) {
    return res.status(401).send({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};

// get all Users
exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit, status } = req.query;

    // Default pagination values
    page = parseInt(page) || 1; // Default page is 1
    limit = parseInt(limit) || 20; // Default limit is 20
    const offset = (page - 1) * limit; // Calculate offset for pagination

    // Initialize SQL query and parameters array
    let sqlQuery = "SELECT * FROM users WHERE 1=1"; // 1=1 makes appending conditions easier
    const queryParams = [];

    // Add filters for status if provided
    if (status) {
      sqlQuery += " AND status LIKE ?";
      queryParams.push(`%${status}%`); // Using LIKE for partial match
    }

    // Add pagination to the query
    sqlQuery += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    // Execute the query with filters and pagination
    const [data] = await db.query(sqlQuery, queryParams);

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No users found",
        data: [],
      });
    }

    // Get total count of users for pagination info (with the same filters)
    let countQuery = "SELECT COUNT(*) as count FROM users WHERE 1=1";
    const countParams = [];

    // Add the same filters for total count query
    if (status) {
      countQuery += " AND status LIKE ?";
      countParams.push(`%${status}%`);
    }

    const [totalUsersCount] = await db.query(countQuery, countParams);
    const totalUsers = totalUsersCount[0].count;

    // Send response with users data and pagination info
    res.status(200).send({
      success: true,
      message: "All Users",
      totalUsers: totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      data: data,
    });
  } catch (error) {
    // Error handling
    res.status(500).send({
      success: false,
      message: "Error in Get All Users",
      error: error.message,
    });
  }
};

// get single user by id
exports.getSingleUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(201).send({
        success: false,
        message: "User ID is required in params",
      });
    }

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userId]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No user found",
      });
    }
    res.status(200).send({
      success: true,
      message: "Get Single User",
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in getting user",
      error: error.message,
    });
  }
};

// user role
exports.userRoleUpdate = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(201).send({
        success: false,
        message: "User ID is required in params",
      });
    }

    const { role } = req.body;
    if (!role) {
      return res.status(201).send({
        success: false,
        message: "role is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userId]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No user found",
      });
    }

    await db.query(`UPDATE users SET role=?  WHERE id =?`, [role, userId]);

    res.status(200).send({
      success: true,
      message: "role updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update role",
      error: error.message,
    });
  }
};

// user status
exports.userStatusUpdate = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(201).send({
        success: false,
        message: "User ID is required in params",
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(201).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userId]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No user found",
      });
    }

    await db.query(`UPDATE users SET status=?  WHERE id =?`, [status, userId]);

    res.status(200).send({
      success: true,
      message: "status updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update status ",
      error: error.message,
    });
  }
};

// delete user
exports.deleteUser = async (req, res) => {
  try {
    const userID = req.params.id;

    const [data] = await db.query(`SELECT * FROM users WHERE id=? `, [userID]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No user found",
      });
    }
    await db.query(`DELETE FROM users WHERE id=?`, [userID]);
    res.status(200).send({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete User",
      error: error.message,
    });
  }
};

// get me User
exports.getMeUser = async (req, res) => {
  try {
    const user = req.decodedUser;
    res.status(200).json({
      success: true,
      message: "Get Me User",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update user
exports.updateUser = async (req, res) => {
  try {
    const userPreData = req.decodedUser;

    // Extract data from the request body
    const {
      first_name,
      last_name,
      email,
      phone,
      country,
      role,
      intro_video,
      description,
      price_per_hour,
    } = req.body;

    const images = req.file;
    let profile_pic = userPreData?.profile_pic;
    if (images && images.path) {
      profile_pic = `https://education-management-backend-8jm1.onrender.com/public/images/${images.filename}`;
    }

    // Update the user data in the database
    const [data] = await db.query(
      `UPDATE users SET first_name=?, last_name=?, email=?, phone=?, profile_pic=?, country=?, role=?, intro_video=?, description=?, price_per_hour=? WHERE id = ?`,
      [
        first_name || userPreData.first_name,
        last_name || userPreData.last_name,
        email || userPreData.email,
        phone || userPreData.phone,
        profile_pic,
        country || userPreData.country,
        role || userPreData.role,
        intro_video || userPreData.intro_video,
        description || userPreData.description,
        price_per_hour || userPreData.price_per_hour,
        userPreData.id,
      ]
    );

    if (!data) {
      return res.status(500).send({
        success: false,
        message: "Error in updating user",
      });
    }

    res.status(200).send({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in updating user",
      error: error.message,
    });
  }
};

exports.teachersSearch = async (req, res) => {
  try {
    let { name } = req.query;

    // Initialize SQL query and parameters array
    let sqlQuery = "SELECT * FROM users WHERE 1=1";
    const queryParams = [];

    // Add name search if provided
    if (name) {
      const searchTerm = name.trim();
      const nameParts = searchTerm.split(/\s+/); // Split search term by spaces

      if (nameParts.length === 1) {
        // Single word search - check both first and last names
        sqlQuery += " AND (first_name LIKE ? OR last_name LIKE ?)";
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
      } else {
        // Multiple words search - more sophisticated matching
        sqlQuery += " AND (";

        // Option 1: Exact match for first_name + last_name
        sqlQuery += "(first_name = ? AND last_name = ?)";
        queryParams.push(
          searchTerm.split(" ")[0],
          searchTerm.split(" ").slice(1).join(" ")
        );

        // Option 2: Exact match for last_name + first_name (reverse order)
        sqlQuery += " OR (first_name = ? AND last_name = ?)";
        queryParams.push(
          searchTerm.split(" ").slice(-1)[0],
          searchTerm.split(" ").slice(0, -1).join(" ")
        );

        // Option 3: Partial match for compound names (like "Shakib Al")
        sqlQuery += " OR (CONCAT(first_name, ' ', last_name) LIKE ?";
        queryParams.push(`%${searchTerm}%`);

        // Option 4: Partial match within first_name (for "Shakib Al Hasan")
        sqlQuery += " OR first_name LIKE ?";
        queryParams.push(`%${searchTerm}%`);

        sqlQuery += ")";
      }
    }

    // Execute the query with filters
    const [data] = await db.query(sqlQuery, queryParams);

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No users found",
        data: [],
      });
    }

    // Send response
    res.status(200).send({
      success: true,
      message: "Users found",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in user search",
      error: error.message,
    });
  }
};
