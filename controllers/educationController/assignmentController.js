const db = require("../../config/db");

// `assignment`(`id`, `courses_id`, `courses_type`, `date`, `file`, `description`, `student_id`

// create Assignment
exports.createNewAssignment = async (req, res) => {
  try {
    const { courses_id, courses_type, date, description } = req.body;

    const student_id = req.decodedUser.id;

    const files = req.file;
    let file = "";
    if (files && files.path) {
      file = `https://education-management-backend-8jm1.onrender.com/public/files/${files.filename}`;
    }

    const query =
      "INSERT INTO assignment (courses_id, courses_type, date, file, description, student_id) VALUES (?, ?, ?, ?, ?, ?)";

    const values = [
      courses_id,
      courses_type || "",
      date || "",
      file || "",
      description || "",
      student_id,
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
      const teacher_id = singleData.teacher_id;

      const [teacherData] = await db.query(`SELECT * FROM users WHERE id=? `, [
        teacher_id,
      ]);

      singleData.teacher = teacherData[0];
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

    const [data] = await db.query("SELECT * FROM assignment WHERE id = ?", [
      id,
    ]);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Get Single Assignment",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Assignment",
      error: error.message,
    });
  }
};

// const [teachers] = await db.query(
//     `SELECT
//     c_d.teacher_id,
//     c_d.total_duration,
//     c_d.total_chapter,
//     u.*
//     FROM course_details c_d
//     LEFT JOIN users u ON c_d.teacher_id = u.id
//     WHERE c_d.course_topic_id = ?`,
//     [id]
//   );

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
