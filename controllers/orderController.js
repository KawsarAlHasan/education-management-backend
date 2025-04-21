const db = require("../config/db");

// create Orders
exports.createOrders = async (req, res) => {
  try {
    const {
      c_number,
      sub_total,
      tax,
      coupon_discount,
      total_price,
      coupon_code,
      orders_items,
    } = req.body;

    const user_id = req.decodedUser.id;

    if (!total_price) {
      return res.status(400).send({
        success: false,
        message: "Please provide total_price required fields",
      });
    }

    // Generate unique Order Id
    async function generateUniqueOrderId(length, batchSize = 6) {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

      // Helper function to generate a single random code
      function generateRandomCode(length) {
        let result = "";
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          result += characters[randomIndex];
        }
        return result;
      }

      let uniqueCode = null;

      while (!uniqueCode) {
        // Step 1: Generate a batch of random codes
        const codesBatch = [];
        for (let i = 0; i < batchSize; i++) {
          codesBatch.push(generateRandomCode(length));
        }

        // Step 2: Check these codes against the database
        const placeholders = codesBatch.map(() => "?").join(",");
        const [existingCodes] = await db.query(
          `SELECT order_id FROM orders WHERE order_id IN (${placeholders})`,
          codesBatch
        );

        // Step 3: Filter out codes that already exist in the database
        const existingCodeSet = new Set(
          existingCodes.map((row) => row.order_id)
        );

        // Step 4: Find the first code that doesn't exist in the database
        uniqueCode = codesBatch.find((code) => !existingCodeSet.has(code));
      }

      return uniqueCode;
    }

    // Generate unique Order Id (if not provided)
    const order_id = await generateUniqueOrderId(6);

    // Insert order into the 'orders' table
    const [orderResult] = await db.query(
      "INSERT INTO orders (order_id, user_id, c_number, sub_total, tax, coupon_discount, total_price, coupon_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        order_id,
        user_id,
        c_number || "",
        sub_total || 0,
        tax || 0,
        coupon_discount || 0,
        total_price,
        coupon_code || "",
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of orders_items) {
      const { type, type_id } = item;

      await db.query(
        "INSERT INTO orders_items (order_id, type, type_id) VALUES (?, ?, ?)",
        [orderId, type, type_id]
      );
    }

    await db.query(`DELETE FROM card WHERE user_id=?`, [user_id]);

    // Send success response
    res.status(200).send({
      success: true,
      message: "Order inserted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the order",
      error: error.message,
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const [orders] = await db.query(`SELECT * FROM orders WHERE user_id=?`, [
      user_id,
    ]);

    if (!orders || orders.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Order Found",
      });
    }

    for (const order of orders) {
      const orderId = order.id;

      const getOrderData = async (type, tableName) => {
        const [data] = await db.query(
          `
          SELECT 
            or_it.type,
            t.id AS ${type}_id,
            t.title AS ${type}_title,
            t.price,
            t.duration AS ${type}_duration,
            t.intro_url,
            t.description,
            cd.id AS course_detail_id,
            cd.total_duration,
            cd.total_chapter,
            u.id AS teacher_id,
            u.first_name AS teacher_first_name,
            u.last_name AS teacher_last_name,
            u.email AS teacher_email,
            u.phone AS teacher_phone,
            u.country AS teacher_country,
            u.profile_pic AS teacher_profile_pic,
            u.average_rating AS teacher_average_rating,
            u.total_rating AS teacher_total_rating,
            crs.id AS course_id,
            crs.title AS course_title,
            crs.image AS course_image,
            ct.id AS topic_id,
            ct.name AS topic_name
          FROM orders_items or_it
          LEFT JOIN ${tableName} t ON or_it.type_id = t.id
          LEFT JOIN course_details cd ON t.course_details_id = cd.id
          LEFT JOIN users u ON cd.teacher_id = u.id
          LEFT JOIN courses crs ON cd.courses_id = crs.id
          LEFT JOIN course_topic ct ON cd.course_topic_id = ct.id
          WHERE or_it.order_id = ? AND or_it.type = ?
          `,
          [orderId, type]
        );
        return data;
      };

      const packageData = await getOrderData("packages", "packages");
      const semesterData = await getOrderData("semester", "semester");

      const result = [...packageData, ...semesterData];

      order.order_items = result;
    }

    res.status(200).json({
      success: true,
      message: "Get My Orders",
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getItemsOfMyOrder = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const [orders] = await db.query(
      `SELECT id, status, create_at, updated_at FROM orders WHERE user_id=?`,
      [user_id]
    );

    if (!orders || orders.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Order Found",
      });
    }

    let results = [];

    for (const order of orders) {
      const orderId = order.id;

      const getOrderData = async (type, tableName) => {
        const [data] = await db.query(
          `
          SELECT 
            or_it.type,
            t.id AS ${type}_id,
            t.title AS ${type}_title,
            t.price,
            t.duration AS ${type}_duration,
            t.intro_url,
            t.description,
            cd.id AS course_detail_id,
            cd.total_duration,
            cd.total_chapter,
            u.id AS teacher_id,
            u.first_name AS teacher_first_name,
            u.last_name AS teacher_last_name,
            u.email AS teacher_email,
            u.phone AS teacher_phone,
            u.country AS teacher_country,
            u.profile_pic AS teacher_profile_pic,
            u.average_rating AS teacher_average_rating,
            u.total_rating AS teacher_total_rating,
            crs.id AS course_id,
            crs.title AS course_title,
            crs.image AS course_image,
            ct.id AS topic_id,
            ct.name AS topic_name
          FROM orders_items or_it
          LEFT JOIN ${tableName} t ON or_it.type_id = t.id
          LEFT JOIN course_details cd ON t.course_details_id = cd.id
          LEFT JOIN users u ON cd.teacher_id = u.id
          LEFT JOIN courses crs ON cd.courses_id = crs.id
          LEFT JOIN course_topic ct ON cd.course_topic_id = ct.id
          WHERE or_it.order_id = ? AND or_it.type = ?
          `,
          [orderId, type]
        );

        return data.map((item) => ({
          order_id: order.id,
          order_status: order.status,
          order_create_at: order.create_at,
          order_updated_at: order.updated_at,
          ...item,
        }));
      };

      const packageData = await getOrderData("packages", "packages");
      const semesterData = await getOrderData("semester", "semester");

      results.push(...packageData, ...semesterData);
    }

    res.status(200).json({
      success: true,
      message: "Get My Orders",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getItemsOfMyOrderWithVideos = async (req, res) => {
  try {
    const user_id = req.decodedUser.id;

    const [orders] = await db.query(
      `SELECT id, status, create_at, updated_at FROM orders WHERE user_id=?`,
      [user_id]
    );

    if (!orders || orders.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Order Found",
      });
    }

    let results = [];

    for (const order of orders) {
      const orderId = order.id;

      const getOrderData = async (type, tableName) => {
        const [data] = await db.query(
          `
          SELECT 
            or_it.type,
            t.id AS ${type}_id,
            t.title AS ${type}_title,
            t.price,
            t.duration AS ${type}_duration,
            t.intro_url,
            t.description,
            cd.id AS course_detail_id,
            cd.total_duration,
            cd.total_chapter,
            u.id AS teacher_id,
            u.first_name AS teacher_first_name,
            u.last_name AS teacher_last_name,
            u.email AS teacher_email,
            u.phone AS teacher_phone,
            u.country AS teacher_country,
            u.profile_pic AS teacher_profile_pic,
            u.average_rating AS teacher_average_rating,
            u.total_rating AS teacher_total_rating,
            crs.id AS course_id,
            crs.title AS course_title,
            crs.image AS course_image,
            ct.id AS topic_id,
            ct.name AS topic_name
          FROM orders_items or_it
          LEFT JOIN ${tableName} t ON or_it.type_id = t.id
          LEFT JOIN course_details cd ON t.course_details_id = cd.id
          LEFT JOIN users u ON cd.teacher_id = u.id
          LEFT JOIN courses crs ON cd.courses_id = crs.id
          LEFT JOIN course_topic ct ON cd.course_topic_id = ct.id
          WHERE or_it.order_id = ? AND or_it.type = ?
          `,
          [orderId, type]
        );
        return data.map((item) => ({
          order_id: order.id,
          order_status: order.status,
          order_create_at: order.create_at,
          order_updated_at: order.updated_at,
          ...item,
        }));
      };

      const packageData = await getOrderData("packages", "packages");
      const semesterData = await getOrderData("semester", "semester");

      results.push(...packageData, ...semesterData);
    }

    for (const package of results) {
      const packageId = package?.topic_id;
      if (packageId) {
        const [videos] = await db.query(
          `SELECT id, url, sr_no, title, duration, isPaid FROM videos WHERE type_id=? AND type=? ORDER BY sr_no ASC`,
          [packageId, "packages"]
        );

        package.videos = videos;
      } else {
        package.videos = [];
      }
    }

    res.status(200).json({
      success: true,
      message: "Get My Orders",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getSingleOrder = async (req, res) => {
  try {
    const id = req.params.id;

    const [orders] = await db.query(`SELECT * FROM orders WHERE id=?`, [id]);

    if (!orders || orders.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Order Found",
      });
    }

    const getOrderData = async (type, tableName) => {
      const [data] = await db.query(
        `
        SELECT 
          or_it.type,
          t.id AS ${type}_id,
          t.title AS ${type}_title,
          t.price,
          t.duration AS ${type}_duration,
          t.intro_url,
          t.description,
          cd.id AS course_detail_id,
          cd.total_duration,
          cd.total_chapter,
          u.id AS teacher_id,
          u.first_name AS teacher_first_name,
          u.last_name AS teacher_last_name,
          u.email AS teacher_email,
          u.phone AS teacher_phone,
          u.country AS teacher_country,
          u.profile_pic AS teacher_profile_pic,
          u.average_rating AS teacher_average_rating,
          u.total_rating AS teacher_total_rating,
          crs.id AS course_id,
          crs.title AS course_title,
          crs.image AS course_image,
          ct.id AS topic_id,
          ct.name AS topic_name
        FROM orders_items or_it
        LEFT JOIN ${tableName} t ON or_it.type_id = t.id
        LEFT JOIN course_details cd ON t.course_details_id = cd.id
        LEFT JOIN users u ON cd.teacher_id = u.id
        LEFT JOIN courses crs ON cd.courses_id = crs.id
        LEFT JOIN course_topic ct ON cd.course_topic_id = ct.id
        WHERE or_it.order_id = ? AND or_it.type = ?
        `,
        [id, type]
      );
      return data;
    };

    const packageData = await getOrderData("packages", "packages");
    const semesterData = await getOrderData("semester", "semester");

    const result = [...packageData, ...semesterData];

    const finalResult = {
      ...orders[0],
      order_items: result,
    };

    res.status(200).json({
      success: true,
      message: "Get Single Order",
      data: finalResult,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// update order status
exports.orderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(404).send({
        success: false,
        message: "order Id is required in params",
      });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(404).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM orders WHERE id=? `, [
      orderId,
    ]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Order found",
      });
    }

    await db.query(`UPDATE orders SET status=?  WHERE id =?`, [
      status,
      orderId,
    ]);

    res.status(200).send({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update order status ",
      error: error.message,
    });
  }
};
