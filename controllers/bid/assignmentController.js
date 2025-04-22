const db = require("../../config/db");

// `assignment`(`id`, `courses_id`, `courses_type`, `date`, `file`, `description`, `student_id`, lavel

// create Assignment
exports.createNewAssignment = async (req, res) => {
  try {
    const { courses_id, courses_type, date, description, lavel } = req.body;

    const student_id = req.decodedUser.id;

    const files = req.file;
    let file = "";
    if (files && files.path) {
      file = `https://education-management-backend-8jm1.onrender.com/public/files/${files.filename}`;
    }

    const query =
      "INSERT INTO assignment (courses_id, courses_type, date, file, description, student_id, lavel) VALUES (?, ?, ?, ?, ?, ?, ?)";

    const values = [
      courses_id,
      courses_type || "",
      date || "",
      file || "",
      description || "",
      student_id,
      lavel || "",
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Assignment, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all Assignment
exports.getAllAssignment = async (req, res) => {
  try {
    const { order } = req.query;
    let query = "SELECT * FROM assignment";

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
        message: "No Assignment found",
        data: [],
      });
    }

    for (const singleData of data) {
      const assignmentID = singleData.id;
      const studentID = singleData.student_id;
      const coursesID = singleData.courses_id;

      const [bidData] = await db.query(
        `SELECT 
        b.assignment_id,
        b.proposal_sender_id,
        b.bid_price,
        ur.first_name,
        ur.last_name,
        ur.email,
        ur.country,
        ur.phone,
        ur.profile_pic,
        ur.average_rating,
        ur.total_rating,
        ur.status AS proposal_sender_status
        FROM bid b
        LEFT JOIN users ur ON b.proposal_sender_id = ur.id
        WHERE b.assignment_id=? `,
        [assignmentID]
      );

      singleData.bid = bidData;

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
      message: "All Assignment",
      totalCoursesDetails: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Assignment",
      error: error.message,
    });
  }
};

// Get Single Assignment
exports.getSingleAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query(`SELECT * FROM assignment WHERE id=?`, [id]);

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
      message: "Get Single Assignment",
      data: {
        ...data[0],
        student: studentData[0],
        courses: coursesData[0],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Assignment",
      error: error.message,
    });
  }
};

// update Assignment
exports.updateAssignment = async (req, res) => {
  try {
    const assignmentID = req.params.id;

    const { courses_id, courses_type, date, description } = req.body;

    const [data] = await db.query(`SELECT * FROM assignment WHERE id=? `, [
      assignmentID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No assignment found",
      });
    }

    const files = req.file;
    let file = data[0].file;
    if (files && files.path) {
      file = `https://education-management-backend-8jm1.onrender.com/public/files/${files.filename}`;
    }

    await db.query(
      `UPDATE assignment SET courses_id=?, courses_type=?, date=?, description=?, file=? WHERE id =?`,
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
      message: "Error in Update Assignment ",
      error: error.message,
    });
  }
};

// delete Assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignmentID = req.params.id;

    const [data] = await db.query(`SELECT * FROM assignment WHERE id=? `, [
      assignmentID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No assignment found",
      });
    }

    await db.query(`DELETE FROM assignment WHERE id=?`, [assignmentID]);
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
