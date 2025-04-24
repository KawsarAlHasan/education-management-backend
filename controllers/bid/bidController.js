const db = require("../../config/db");

// bid : `id`, `assignment_id`, `proposal_sender_id`, `bid_price`

// create bid
exports.createNewBid = async (req, res) => {
  try {
    const { assignment_id, bid_price } = req.body;

    if (!assignment_id || !bid_price) {
      return res.status(400).send({
        success: false,
        message: "Please provide assignment_id & bid_price field",
      });
    }

    const proposal_sender_id = req.decodedUser.id;

    const [checkBidData] = await db.query(
      `SELECT bid_price FROM bid WHERE assignment_id=? AND proposal_sender_id=?`,
      [assignment_id, proposal_sender_id]
    );

    if (checkBidData.length > 0) {
      await db.query(
        `DELETE FROM bid WHERE assignment_id=? AND proposal_sender_id=?`,
        [assignment_id, proposal_sender_id]
      );
    }

    const query =
      "INSERT INTO bid (assignment_id, proposal_sender_id, bid_price) VALUES (?, ?, ?)";

    const values = [assignment_id, proposal_sender_id, bid_price];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Bid, please try again",
      });
    }

    const [lowestBid] = await db.query(
      `SELECT bid_price FROM bid WHERE assignment_id = ? ORDER BY bid_price ASC LIMIT 1`,
      [assignment_id]
    );

    const [checkData] = await db.query(
      `SELECT is_bid FROM assignment WHERE id=?`,
      [assignment_id]
    );

    if (checkData[0].is_bid === 0) {
      const bid_time = new Date();

      await db.query(
        `UPDATE assignment SET is_bid=?, bid_time=?, lowest_bid=? WHERE id=?`,
        [1, bid_time, lowestBid[0].bid_price, assignment_id]
      );
    } else {
      await db.query(`UPDATE assignment SET lowest_bid=? WHERE id=?`, [
        lowestBid[0].bid_price,
        assignment_id,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Bid added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.myBid = async (req, res) => {
  try {
    const proposal_sender_id = req.decodedUser.id;

    const [data] = await db.query(
      `SELECT * FROM bid WHERE proposal_sender_id=?`,
      [proposal_sender_id]
    );

    if (!data || data.length === 0) {
      return res.status(404).send({
        success: true,
        message: "No Bid found",
        data: [],
      });
    }

    for (const bid of data) {
      const assignment_id = bid.assignment_id;

      const [assignment] = await db.query(
        `SELECT
          agnmt.*,
          ur.first_name AS user_first_name,
          ur.last_name AS user_last_name,
          ur.email AS user_email,
          ur.country AS user_country,
          ur.phone AS user_phone,
          ur.profile_pic AS user_profile_pic,
          ur.average_rating AS user_average_rating,
          ur.total_rating AS user_total_rating,
          curs.title AS courses_title,
          curs.image AS courses_image
         FROM assignment agnmt
         LEFT JOIN users ur ON agnmt.student_id = ur.id
         LEFT JOIN courses curs ON agnmt.courses_id = curs.id
         WHERE agnmt.id = ?`,
        [assignment_id]
      );

      const assgmt = assignment.length > 0 ? assignment[0] : {};
      bid.assignment = assgmt;
    }

    res.status(200).send({
      success: true,
      message: "Get My Bid",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// get all Bid
exports.getAllBid = async (req, res) => {
  try {
    const { order } = req.query;
    let query = "SELECT * FROM bid";

    let queryParams = [];

    if (
      order &&
      (order.toUpperCase() === "ASC" || order.toUpperCase() === "DESC")
    ) {
      query += " ORDER BY id " + order.toUpperCase();
    } else {
      query += " ORDER BY id ASC";
    }

    const [data] = await db.query(query, queryParams);

    if (!data || data.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No bid found",
        data: [],
      });
    }

    for (const singleData of data) {
      const studentID = singleData.student_id;
      const coursesID = singleData.courses_id;

      const [studentData] = await db.query(`SELECT * FROM users WHERE id=? `, [
        studentID,
      ]);

      singleData.student = studentData[0];

      const [coursesData] = await db.query(
        `SELECT * FROM courses WHERE id=? `,
        [coursesID]
      );

      singleData.courses = coursesData[0];
    }

    res.status(200).send({
      success: true,
      message: "All Bid",
      totalCoursesDetails: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Bid",
      error: error.message,
    });
  }
};

// Get Single Bid
exports.getSingleBid = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query(`SELECT * FROM bid WHERE id=?`, [id]);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    const [studentData] = await db.query(`SELECT * FROM users WHERE id=? `, [
      data[0].student_id,
    ]);

    const [coursesData] = await db.query(`SELECT * FROM courses WHERE id=? `, [
      data[0].courses_id,
    ]);

    res.status(200).json({
      success: true,
      message: "Get Single Bid",
      data: {
        ...data[0],
        student: studentData[0],
        courses: coursesData[0],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Bid",
      error: error.message,
    });
  }
};

// update Bid
exports.updateBid = async (req, res) => {
  try {
    const assignmentID = req.params.id;

    const { courses_id, courses_type, date, description } = req.body;

    const [data] = await db.query(`SELECT * FROM bid WHERE id=? `, [
      assignmentID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No bid found",
      });
    }

    const files = req.file;
    let file = data[0].file;
    if (files && files.path) {
      file = `https://education-management-backend-8jm1.onrender.com/public/files/${files.filename}`;
    }

    await db.query(
      `UPDATE bid SET courses_id=?, courses_type=?, date=?, description=?, file=? WHERE id =?`,
      [
        courses_id || data[0].courses_id,
        courses_type || data[0].courses_type,
        date || data[0].date,
        description || data[0].description,
        file,
        assignmentID,
      ]
    );

    res.status(200).send({
      success: true,
      message: "Assignment updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update bid ",
      error: error.message,
    });
  }
};

// delete Assignment
exports.deleteBid = async (req, res) => {
  try {
    const assignmentID = req.params.id;

    const [data] = await db.query(`SELECT * FROM bid WHERE id=? `, [
      assignmentID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No bid found",
      });
    }

    await db.query(`DELETE FROM bid WHERE id=?`, [assignmentID]);
    res.status(200).send({
      success: true,
      message: "Assignment Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Assignment",
      error: error.message,
    });
  }
};
