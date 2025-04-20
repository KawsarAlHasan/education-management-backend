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

    console.log(
      `   c_number,
      sub_total,
      tax,
      coupon_discount,
      total_price,
      coupon_code,
      orders_items,`,
      c_number,
      sub_total,
      tax,
      coupon_discount,
      total_price,
      coupon_code,
      orders_items
    );

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

    // Send success response
    res.status(200).send({
      success: true,
      message: "Order inserted successfully",

      check: {
        c_number,
        sub_total,
        tax,
        coupon_discount,
        total_price,
        coupon_code,
        orders_items,
      },
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

// // get all Orders with pagination, filtering, and search
// exports.getAllOrders = async (req, res) => {
//   try {
//     // Get query parameters for pagination, filtering, and searching
//     const {
//       page = 1,
//       limit = 20,
//       status,
//       order_id,
//       later_date,
//       isLater,
//     } = req.query;
//     const laterDate = new Date(later_date);

//     // Calculate the offset for pagination
//     const offset = (page - 1) * limit;

//     // Build the base SQL query
//     let query = "SELECT * FROM orders";
//     let conditions = [];
//     let queryParams = [];

//     if (isLater) {
//       conditions.push("isLater = ?");
//       queryParams.push(isLater);
//     }

//     // Add status filter if provided
//     if (status) {
//       conditions.push("status = ?");
//       queryParams.push(status);
//     }

//     // Add order_id search if provided
//     if (order_id) {
//       conditions.push("order_id LIKE ?");
//       queryParams.push(`%${order_id}%`);
//     }

//     // Add later_date search if provided
//     if (later_date) {
//       const startDate = `${later_date} 00:00:00`;
//       const endDate = `${later_date} 23:59:59`;
//       conditions.push("later_date BETWEEN ? AND ?");
//       queryParams.push(startDate, endDate);
//     }

//     // Add conditions to the query if any
//     if (conditions.length > 0) {
//       query += " WHERE " + conditions.join(" AND ");
//     }

//     // Add ordering and pagination
//     query += " ORDER BY id DESC LIMIT ? OFFSET ?";
//     queryParams.push(parseInt(limit), parseInt(offset));

//     // Execute the query
//     const [orders] = await db.query(query, queryParams);

//     // Get the total count of orders (without pagination)
//     let countQuery = "SELECT COUNT(*) as total FROM orders";
//     if (conditions.length > 0) {
//       countQuery += " WHERE " + conditions.join(" AND ");
//     }
//     const [countResult] = await db.query(countQuery, queryParams.slice(0, -2)); // Exclude limit & offset from count query
//     const total = countResult[0].total;

//     // Send response with the structured order data
//     res.status(200).send({
//       success: true,
//       message: "Get all Orders",
//       pagination: {
//         total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         totalPages: Math.ceil(total / limit),
//       },
//       data: orders,
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Error in Get All Orders",
//       error: error.message,
//     });
//   }
// };

// // get single order
// exports.getSingleOrder = async (req, res) => {
//   try {
//     // Get order_id from request parameters
//     const order_id = req.params.id;

//     // Get the specific order from the orders table
//     const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [
//       order_id,
//     ]);

//     // If no order is found, return an error message
//     if (orders.length === 0) {
//       return res.status(404).send({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     const order = orders[0]; // Since we are fetching only one order

//     // Get all foods related to the current order
//     const [foods] = await db.query(
//       "SELECT * FROM orders_foods WHERE order_id = ?",
//       [order.id]
//     );

//     // Loop through each food item to get its addons by type
//     for (const food of foods) {
//       // Get all addons for the current food item, grouped by type
//       const [addons] = await db.query(
//         "SELECT * FROM addons WHERE food_id = ?",
//         [food.id]
//       );

//       // Structure addons in food object by type
//       food.addons = {
//         flavor: addons
//           .filter((addon) => addon.type === "flavor")
//           .map((flavor) => ({
//             name: flavor.name,
//             quantity: flavor.quantity,
//             rating: flavor.rating,
//           })),
//         toppings: addons
//           .filter((addon) => addon.type === "toppings")
//           .map((toppings) => ({
//             name: toppings.name,
//             quantity: toppings.quantity,
//             price: toppings.price,
//             isPaid: toppings.isPaid,
//           })),
//         sandCust: addons
//           .filter((addon) => addon.type === "sandCust")
//           .map((sandCust) => ({
//             name: sandCust.name,
//             quantity: sandCust.quantity,
//             price: sandCust.price,
//             isPaid: sandCust.isPaid,
//           })),
//         dip: addons
//           .filter((addon) => addon.type === "dip")
//           .map((dip) => ({
//             name: dip.name,
//             quantity: dip.quantity,
//             price: dip.price,
//             isPaid: dip.isPaid,
//           })),
//         side: addons
//           .filter((addon) => addon.type === "side")
//           .map((side) => ({
//             name: side.name,
//             quantity: side.quantity,
//             price: side.price,
//             isPaid: side.isPaid,
//           })),
//         drink: addons
//           .filter((addon) => addon.type === "drink")
//           .map((drink) => ({
//             name: drink.name,
//             quantity: drink.quantity,
//             price: drink.price,
//             isPaid: drink.isPaid,
//           })),
//         beverage: addons
//           .filter((addon) => addon.type === "beverage")
//           .map((beverage) => ({
//             name: beverage.name,
//             quantity: beverage.quantity,
//             price: beverage.price,
//             isPaid: beverage.isPaid,
//           })),
//       };
//     }

//     // Attach foods with addons to the order
//     order.foods = foods;

//     // Send response with the structured order data
//     res.status(200).send({
//       success: true,
//       message: "Get Single Order",
//       data: order,
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Error in Get Single Order",
//       error: error.message,
//     });
//   }
// };

// // get user order
// exports.getUserOrders = async (req, res) => {
//   try {
//     // Get user_id from request parameters
//     const { user_id } = req.params;

//     // Fetch all orders for the specific user from the orders table
//     const [orders] = await db.query(
//       "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
//       [user_id]
//     );

//     // If no orders found, return a message
//     if (orders.length === 0) {
//       return res.status(404).send({
//         success: false,
//         message: "No orders found for this user",
//       });
//     }

//     // Send response with the structured orders data
//     res.status(200).send({
//       success: true,
//       message: "Get all orders for the user",
//       data: orders,
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Error in getting user orders",
//       error: error.message,
//     });
//   }
// };

// // update order status
// exports.orderStatus = async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     if (!orderId) {
//       return res.status(404).send({
//         success: false,
//         message: "order Id is required in params",
//       });
//     }

//     const { status } = req.body;
//     if (!status) {
//       return res.status(404).send({
//         success: false,
//         message: "status is requied in body",
//       });
//     }

//     const [data] = await db.query(`SELECT * FROM orders WHERE id=? `, [
//       orderId,
//     ]);
//     if (!data || data.length === 0) {
//       return res.status(404).send({
//         success: false,
//         message: "No Order found",
//       });
//     }

//     const [updateData] = await db.query(
//       `UPDATE orders SET status=?  WHERE id =?`,
//       [status, orderId]
//     );

//     if (updateData.changedRows) {
//       // Notification Details
//       const type = "User";
//       const receiver_id = data[0].user_id;
//       const sander_id = 1;
//       const url = `/orderdetails/${data[0].id}`;

//       // Define notification title and message based on order status
//       let title = "Order Status Updated";
//       let message = "";

//       switch (status) {
//         case "Pending":
//           message =
//             "Your order is now pending. We'll notify you once it progresses.";
//           break;
//         case "Processing":
//           message =
//             "Your order is currently being processed. Please wait for further updates.";
//           break;
//         case "Completed":
//           message =
//             "Congratulations! Your order has been successfully completed.";
//           break;
//         case "Cancelled":
//           message =
//             "We're sorry to inform you that your order has been cancelled.";
//           break;
//         default:
//           message =
//             "The status of your order has been updated. Please check the details.";
//       }

//       // Insert Notification for User
//       const [notification] = await db.query(
//         "INSERT INTO notifications (type, receiver_id, sander_id, url, title, message) VALUES (?, ?, ?, ?, ?, ?)",
//         [type, receiver_id, sander_id, url, title, message]
//       );
//     }

//     res.status(200).send({
//       success: true,
//       message: "Order status updated successfully",
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Error in Update order status ",
//       error: error.message,
//     });
//   }
// };
