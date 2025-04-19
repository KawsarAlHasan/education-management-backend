const db = require("../config/db");

// create coupons
exports.createCoupons = async (req, res) => {
  try {
    const { title, code, discount, expiration_date, is_active } = req.body;
    if (!code || !discount) {
      return res.status(400).send({
        success: false,
        message: "Please provide code field",
      });
    }

    const [checkData] = await db.query("SELECT * FROM coupons WHERE code=?", [
      code,
    ]);

    if (checkData.length > 0) {
      return res.status(400).send({
        success: false,
        message: "This Code already used",
      });
    }

    // Insert coupons into the database
    const [result] = await db.query(
      "INSERT INTO coupons (title, code, discount, expiration_date, is_active) VALUES (?, ?, ?, ?, ?)",
      [title || "", code, discount, expiration_date || null, is_active || 1]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert coupons, please try again",
      });
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "coupons inserted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the coupons",
      error: error.message,
    });
  }
};

// Check Coupon
exports.checkCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).send({
        success: false,
        message: "Please provide code field",
      });
    }

    // Fetch the coupon from the database
    const [data] = await db.query("SELECT * FROM coupons WHERE code = ?", [
      code,
    ]);

    // Check if the coupon exists
    if (!data || data.length == 0) {
      return res.status(400).send({
        success: true,
        message: "No coupons found",
      });
    }

    const coupon = data[0];

    // Check if the coupon is expired
    const today = new Date();
    const expirationDate = new Date(coupon.expiration_date);

    if (expirationDate < today || !coupon.is_active) {
      return res.status(400).send({
        success: true,
        message: "Expired This Coupon",
      });
    }

    // If all checks pass, return the coupon data
    res.status(200).send({
      success: true,
      message: "Check coupons",
      data: coupon,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Check coupons",
      error: error.message,
    });
  }
};

// get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM coupons");

    res.status(200).send({
      success: true,
      message: "Get All coupons",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All coupons",
      error: error.message,
    });
  }
};

// get single coupons
exports.getSingleCoupons = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query("SELECT * FROM coupons WHERE id =?", [id]);

    if (!data || data.length == 0) {
      return res.status(400).send({
        success: true,
        message: "No coupons found",
      });
    }

    const [used_time] = await db.query(
      "SELECT SUM(used_time) AS total_used_time FROM user_coupons WHERE coupon_id =?",
      [id]
    );

    res.status(200).send({
      success: true,
      message: "Get Single coupons",
      totalUsedTime: used_time[0].total_used_time,
      data: data[0],
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get single coupons",
      error: error.message,
    });
  }
};

// update coupons
exports.updateCoupons = async (req, res) => {
  try {
    const id = req.params.id;

    const {
      name,
      image,
      code,
      discount_price,
      discount_percentage,
      is_discount_percentage,
      expiration_date,
      is_active,
    } = req.body;

    const [checkData] = await db.query(
      "SELECT * FROM coupons WHERE code=? AND id !=?",
      [code, id]
    );

    if (checkData.length > 0) {
      return res.status(400).send({
        success: false,
        message: "This Code already used",
      });
    }

    // Check if coupons exists
    const [existingCoupons] = await db.query(
      "SELECT * FROM coupons WHERE id = ?",
      [id]
    );

    if (!existingCoupons || existingCoupons.length === 0) {
      return res.status(404).send({
        success: false,
        message: "coupons not found",
      });
    }

    // Execute the update query
    const [result] = await db.query(
      "UPDATE coupons SET name=?, code = ?, discount_price= ?, discount_percentage=?, is_discount_percentage=?, expiration_date=?, is_active=? WHERE id = ?",
      [
        name || existingCoupons[0].name,
        code || existingCoupons[0].code,
        discount_price || existingCoupons[0].discount_price,
        discount_percentage || existingCoupons[0].discount_percentage,
        is_discount_percentage || existingCoupons[0].is_discount_percentage,
        expiration_date || existingCoupons[0].expiration_date,
        is_active || existingCoupons[0].is_active,
        id,
      ]
    );

    // Check if the coupons was updated successfully
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "coupons not found or no changes made",
      });
    }

    // Success response
    res.status(200).send({
      success: true,
      message: "coupons updated successfully",
    });
  } catch (error) {
    // Handle errors
    res.status(500).send({
      success: false,
      message: "Error updating coupons",
      error: error.message,
    });
  }
};

// delete coupons
exports.deleteCoupons = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if the coupons exists in the database
    const [coupons] = await db.query(`SELECT * FROM coupons WHERE id = ?`, [
      id,
    ]);

    // If coupons not found, return 404
    if (coupons.length === 0) {
      return res.status(404).send({
        success: false,
        message: "coupons not found",
      });
    }

    const [result] = await db.query(`DELETE FROM coupons WHERE id = ?`, [id]);

    // Check if deletion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to delete coupons",
      });
    }

    // Send success response
    res.status(200).send({
      success: true,
      message: "coupons deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error deleting coupons",
      error: error.message,
    });
  }
};

exports.sendCouponUser = async (req, res) => {
  try {
    const {
      user_ids,
      coupon_id,
      coupon_name,
      coupon_discount_percentage,
      coupon_code,
      coupon_discount_price,
      coupon_expiration_date,
      coupon_image,
      coupon_is_discount_percentage,
    } = req.body;

    const currentTime = new Date();

    const [existingUsers] = await db.query(
      `SELECT user_id, sent_time FROM user_coupons WHERE coupon_id = ? AND user_id IN (?)`,
      [coupon_id, user_ids]
    );

    const [users] = await db.query(
      `SELECT first_name, last_name, email FROM users WHERE id IN (?)`,
      [user_ids]
    );

    const existingUserIds = existingUsers.map((user) => user.user_id);
    const newUserIds = user_ids.filter((id) => !existingUserIds.includes(id));

    if (existingUsers.length > 0) {
      await Promise.all(
        existingUsers.map((user) =>
          db.query(
            `UPDATE user_coupons SET sent_time = ?, sent_at = ? WHERE user_id = ? AND coupon_id = ?`,
            [user.sent_time + 1, currentTime, user.user_id, coupon_id]
          )
        )
      );
    }

    if (newUserIds.length > 0) {
      const values = newUserIds.map((id) => [id, coupon_id, 1, currentTime]);
      await db.query(
        `INSERT INTO user_coupons (user_id, coupon_id, sent_time, sent_at) VALUES ?`,
        [values]
      );
    }

    const coupon = {
      id: coupon_id,
      name: coupon_name,
      discount_percentage: coupon_discount_percentage,
      code: coupon_code,
      discount_price: coupon_discount_price,
      expiration_date: coupon_expiration_date,
      image: coupon_image,
      is_discount_percentage: coupon_is_discount_percentage,
    };

    const emailSent = await sendBulkEmails(users, coupon);

    if (!emailSent) {
      return res.status(500).json({
        message: "Error sending emails",
      });
    }

    res.status(200).json({
      message: "Coupons sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error sending coupons",
      error: error.message,
    });
  }
};

exports.getCouponsSendUser = async (req, res) => {
  try {
    const { user_id, coupon_id, used_time } = req.query;

    let query = `
    SELECT 
      uc.*, 
      u.first_name AS first_name, 
      u.last_name AS last_name, 
      u.email AS email
    FROM user_coupons uc
    LEFT JOIN users u ON uc.user_id = u.id
  `;

    let conditions = [];
    let queryParams = [];

    if (user_id) {
      conditions.push("user_id = ?");
      queryParams.push(user_id);
    }

    if (coupon_id) {
      conditions.push("coupon_id = ?");
      queryParams.push(coupon_id);
    }

    if (used_time) {
      conditions.push("used_time = ?");
      queryParams.push(used_time);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    // Execute the query
    const [data] = await db.query(query, queryParams);

    res.status(200).send({
      success: true,
      message: "Get Coupon Send Users",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internel Server Error",
      error: error.message,
    });
  }
};
