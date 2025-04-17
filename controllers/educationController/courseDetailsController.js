const db = require("../../config/db");

// course_details: id courses_id courses_topic_id teacher_id packages semister

// create new course_details
exports.createNewCoursesDetails = async (req, res) => {
  try {
    const { courses_id, courses_topic_id, teacher_id, packages, semister } =
      req.body;

    if (!courses_id || !courses_topic_id || !teacher_id) {
      return res.status(400).send({
        success: false,
        message:
          "Please provide courses_id, courses_topic_id & teacher_id required fields",
      });
    }

    const query =
      "INSERT INTO course_details (courses_id, courses_topic_id, teacher_id, packages, semister) VALUES (?, ?, ?, ?, ?)";

    const values = [
      courses_id,
      courses_topic_id,
      teacher_id,
      packages || "",
      semister || "",
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Course details, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course details added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// status
// profile_pic
// phone
// country
// email
// last_name
// first_name

// // Get Single Courses Topic
// exports.getSingleTeacherWithCoursesDetails = async (req, res) => {
//   try {
//     const { teacher_id, course_topic_id } = req.query;

//     const [data] = await db.query("SELECT * FROM course_topic WHERE id = ?", [
//       course_topic_id,
//     ]);

//     if (data.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Data not found",
//       });
//     }

//     const [teachers] = await db.query(
//       `SELECT
//       tfct.teacher_id,
//       u.*
//       FROM teachers_for_course_topic tfct
//       LEFT JOIN users u ON tfct.teacher_id = u.id
//       WHERE tfct.course_topic_id = ?`,
//       [course_topic_id]
//     );

//     const result = {
//       ...data[0],
//       teachers,
//     };

//     res.status(200).json({
//       success: true,
//       message: "Get Single Course Topic",
//       data: result,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error in fetching Course Topic",
//       error: error.message,
//     });
//   }
// };

// get all courses Details
exports.getAllCoursesDetails = async (req, res) => {
  try {
    const { order } = req.query;
    let query = "SELECT * FROM course_details";

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
        message: "No Course details found",
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
      message: "All Courses Details",
      totalCoursesDetails: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Courses Details",
      error: error.message,
    });
  }
};

// Get Single Courses Details
exports.getSingleTeacherWithCoursesDetails = async (req, res) => {
  try {
    const { course_topic_id, teacher_id } = req.query;

    const [data] = await db.query(
      "SELECT * FROM course_details WHERE courses_topic_id = ? AND teacher_id =?",
      [course_topic_id, teacher_id]
    );

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Get Single Course details",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Course details",
      error: error.message,
    });
  }
};

// Get Single Courses Details
exports.getSingleCoursesDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query("SELECT * FROM course_details WHERE id = ?", [
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
      message: "Get Single Course details",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Course details",
      error: error.message,
    });
  }
};

// update courses Details
exports.updateCoursesDetails = async (req, res) => {
  try {
    const coursesDetailsID = req.params.id;

    const { courses_id, courses_topic_id, teacher_id, packages, semister } =
      req.body;

    const [data] = await db.query(`SELECT * FROM course_details WHERE id=? `, [
      coursesDetailsID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No course_details found",
      });
    }

    await db.query(
      `UPDATE course_details SET courses_id=?, courses_topic_id=?, teacher_id=?, packages=?, semister=? WHERE id =?`,
      [
        courses_id || data[0].courses_id,
        courses_topic_id || data[0].courses_topic_id,
        teacher_id || data[0].teacher_id,
        packages || data[0].packages,
        semister || data[0].semister,
        coursesDetailsID,
      ]
    );

    res.status(200).send({
      success: true,
      message: "Course details updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update Course details ",
      error: error.message,
    });
  }
};

// delete courses Details
exports.deleteCoursesDetails = async (req, res) => {
  try {
    const coursesDetailsID = req.params.id;

    const [data] = await db.query(`SELECT * FROM course_details WHERE id=? `, [
      coursesDetailsID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No course_details found",
      });
    }

    await db.query(`DELETE FROM course_details WHERE id=?`, [coursesDetailsID]);
    res.status(200).send({
      success: true,
      message: "Courses Details Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Courses Details",
      error: error.message,
    });
  }
};
