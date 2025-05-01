const db = require("../../config/db");

// create new School courses
exports.createNewSchoolCourses = async (req, res) => {
  try {
    const { title, status } = req.body;

    if (!title) {
      return res.status(400).send({
        success: false,
        message: "Please provide title required fields",
      });
    }

    const images = req.file;
    let image = "";
    if (images && images.path) {
      image = `https://education-management-backend-8jm1.onrender.com/public/images/${images.filename}`;
    }

    const query =
      "INSERT INTO school_courses (title, image, status) VALUES (?, ?, ?)";

    const values = [title, image, status || "Active"];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert school courses, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "school courses added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all School courses
exports.getAllSchoolCourses = async (req, res) => {
  try {
    const { status, order } = req.query;
    let query = "SELECT * FROM school_courses";
    let queryParams = [];

    if (status) {
      query += " WHERE status = ?";
      queryParams.push(status);
    }

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
        message: "No school courses found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All school courses",
      totalSchoolCourses: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All School Courses",
      error: error.message,
    });
  }
};

// Get Single School Courses
exports.getSingleSchoolCourses = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query("SELECT * FROM school_courses WHERE id = ?", [
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
      message: "Get Single school courses",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching school courses",
      error: error.message,
    });
  }
};

// Get Home Tutoring By Course Id
exports.getHomeTutoringByCourseId = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query("SELECT * FROM school_courses WHERE id = ?", [
      id,
    ]);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    const [homeTutoringData] = await db.query(
      `SELECT 
        hmt.school_courses_id,
        hmt.teacher_id,
        ur.first_name,
        ur.last_name,
        ur.uid,
        ur.sign_up_method,
        ur.email,
        ur.password,
        ur.country,
        ur.phone,
        ur.profile_pic,
        ur.role,
        ur.average_rating,
        ur.total_rating,
        ur.intro_video,
        ur.description,
        ur.price_per_hour,
        ur.status
      FROM home_tutoring hmt
      LEFT JOIN users ur ON hmt.teacher_id = ur.id
      WHERE hmt.school_courses_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Get Single school courses",
      data: {
        ...data[0],
        homeTutoringData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching school courses",
      error: error.message,
    });
  }
};

// update School courses
exports.updateSchoolCourses = async (req, res) => {
  try {
    const coursesID = req.params.id;

    const { title } = req.body;

    const [data] = await db.query(`SELECT * FROM school_courses WHERE id=? `, [
      coursesID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No school courses found",
      });
    }

    const images = req.file;
    let image = data[0].image;
    if (images && images.path) {
      image = `https://education-management-backend-8jm1.onrender.com/public/images/${images.filename}`;
    }

    await db.query(`UPDATE school_courses SET title=?, image=? WHERE id =?`, [
      title || data[0].title,
      image,
      coursesID,
    ]);

    res.status(200).send({
      success: true,
      message: "School courses updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update School courses ",
      error: error.message,
    });
  }
};

// school courses status
exports.schoolCoursesStatusUpdate = async (req, res) => {
  try {
    const coursesID = req.params.id;

    const { status } = req.body;
    if (!status) {
      return res.status(201).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM school_courses WHERE id=? `, [
      coursesID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No school courses found",
      });
    }

    await db.query(`UPDATE school_courses SET status=?  WHERE id =?`, [
      status,
      coursesID,
    ]);

    res.status(200).send({
      success: true,
      message: "Status updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update Status ",
      error: error.message,
    });
  }
};

// delete School courses
exports.deleteSchoolCourses = async (req, res) => {
  try {
    const coursesID = req.params.id;

    const [data] = await db.query(`SELECT * FROM school_courses WHERE id=? `, [
      coursesID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No school courses found",
      });
    }

    await db.query(`DELETE FROM school_courses WHERE id=?`, [coursesID]);
    res.status(200).send({
      success: true,
      message: "School courses Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete School courses",
      error: error.message,
    });
  }
};
