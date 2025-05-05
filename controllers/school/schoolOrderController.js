const db = require("../../config/db");

// create school Orders
exports.createSchoolOrders = async (req, res) => {
  try {
    const {
      home_tutoring_id,
      study_notes_id,
      type,
      city,
      block,
      floor,
      apartment,
      contact_number,
      date,
      fromTime,
      toTime,
      totalHourse,
      totalPayment,
      coupon_code,
      coupon_discount,
      sub_total_price,
      total_price,
    } = req.body;

    const student_id = req.decodedUser.id;

    if (!type) {
      return res.status(400).send({
        success: false,
        message: "Please provide type required fields",
      });
    }

    // Insert order into the 'orders' table
    const [orderResult] = await db.query(
      "INSERT INTO school_orders ( student_id, home_tutoring_id, study_notes_id, type, city, block, floor, apartment, contact_number, date, fromTime, toTime, totalHourse, totalPayment, coupon_code, coupon_discount, sub_total_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        student_id,
        home_tutoring_id || 0,
        study_notes_id || 0,
        type,
        city || "",
        block || "",
        floor || "",
        apartment || "",
        contact_number || "",
        date || "",
        fromTime || "",
        toTime || "",
        totalHourse || "",
        totalPayment || 0,
        coupon_code || "",
        coupon_discount || "",
        sub_total_price || 0,
        total_price || 0,
      ]
    );

    const orderId = orderResult.insertId;

    // Send success response
    res.status(200).send({
      success: true,
      message: "School Order inserted successfully",
      schoolOrderId: orderId,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the order",
      error: error.message,
    });
  }
};

// get my school Orders
exports.getMySchoolOrders = async (req, res) => {
  try {
    const student_id = req.decodedUser.id;

    // Get all school orders for the student
    const [myOrders] = await db.query(
      `SELECT * FROM school_orders WHERE student_id=?`,
      [student_id]
    );

    if (!myOrders || myOrders.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Order Found",
      });
    }

    // Initialize arrays to hold different types of data
    const tutorData = [];
    const studyNotesData = [];

    // Process each order
    for (const order of myOrders) {
      if (order.type === "home_tutoring") {
        // Fetch home tutoring data
        const [homeTutoring] = await db.query(
          `SELECT * FROM home_tutoring WHERE id=?`,
          [order.home_tutoring_id]
        );

        if (homeTutoring && homeTutoring.length > 0) {
          // Fetch teacher data
          const [teacher] = await db.query(`SELECT * FROM users WHERE id=?`, [
            homeTutoring[0].teacher_id,
          ]);

          // Fetch school course data
          const [course] = await db.query(
            `SELECT * FROM school_courses WHERE id=?`,
            [homeTutoring[0].school_courses_id]
          );

          const datas = {
            ...order,
            teacher_details: teacher[0],
            course_details: course[0],
          };

          tutorData.push(datas);
        }
      } else if (order.type === "study_nodes") {
        // Fetch study notes data
        const [studyNotes] = await db.query(
          `SELECT * FROM study_notes WHERE id=?`,
          [order.study_notes_id]
        );

        if (studyNotes && studyNotes.length > 0) {
          // Fetch school course data
          const [course] = await db.query(
            `SELECT * FROM school_courses WHERE id=?`,
            [studyNotes[0].school_courses_id]
          );

          const datas = {
            ...order,
            study_notes: studyNotes[0],
            course_details: course[0],
          };

          studyNotesData.push(datas);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Get My School Orders",
      data: {
        tutorData: tutorData,
        studyNotesData: studyNotesData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// get single school order
exports.getMySchoolOrder = async (req, res) => {
  try {
    const order_id = req.params.id;

    // Get the specific school order for the student
    const [order] = await db.query(`SELECT * FROM school_orders WHERE id=?`, [
      order_id,
    ]);

    if (!order || order.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Order not found or doesn't belong to you",
      });
    }

    const orderDetails = order[0];
    let responseData = {};

    if (orderDetails.type === "home_tutoring") {
      // Fetch home tutoring data
      const [homeTutoring] = await db.query(
        `SELECT * FROM home_tutoring WHERE id=?`,
        [orderDetails.home_tutoring_id]
      );

      if (homeTutoring && homeTutoring.length > 0) {
        // Fetch teacher data
        const [teacher] = await db.query(`SELECT * FROM users WHERE id=?`, [
          homeTutoring[0].teacher_id,
        ]);

        // Fetch school course data
        const [course] = await db.query(
          `SELECT * FROM school_courses WHERE id=?`,
          [homeTutoring[0].school_courses_id]
        );

        responseData = {
          ...orderDetails,
          teacher_details: teacher[0],
          course_details: course[0],
        };
      }
    } else if (orderDetails.type === "study_nodes") {
      // Fetch study notes data
      const [studyNotes] = await db.query(
        `SELECT * FROM study_notes WHERE id=?`,
        [orderDetails.study_notes_id]
      );

      if (studyNotes && studyNotes.length > 0) {
        // Fetch school course data
        const [course] = await db.query(
          `SELECT * FROM school_courses WHERE id=?`,
          [studyNotes[0].school_courses_id]
        );

        responseData = {
          ...orderDetails,
          study_notes: studyNotes[0],
          course_details: course[0],
        };
      }
    }

    res.status(200).json({
      success: true,
      message: "Get My School Order Details",
      type: orderDetails.type,
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// update School order status
exports.schollOrderStatus = async (req, res) => {
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

    const [data] = await db.query(`SELECT * FROM school_orders WHERE id=? `, [
      orderId,
    ]);
    if (!data || data.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No Order found",
      });
    }

    await db.query(`UPDATE school_orders SET status=?  WHERE id =?`, [
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
