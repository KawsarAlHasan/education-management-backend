const db = require("../../config/db");

// create new courses
exports.createNewCourses = async (req, res) => {
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

    const query = "INSERT INTO courses (title, image, status) VALUES (?, ?, ?)";

    const values = [title, image, status || "Active"];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Courses, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Courses added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const { status, order } = req.query;
    let query = "SELECT * FROM courses";
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
        message: "No Courses found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Courses",
      totalCourses: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Courses",
      error: error.message,
    });
  }
};

// Get Single Courses
exports.getSingleCourses = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Get Single Course",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Course",
      error: error.message,
    });
  }
};

// Get Single Courses with topic
exports.getSingleCoursesWithTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    const [courseTopic] = await db.query(
      "SELECT * FROM course_topic WHERE courses_id=?",
      [id]
    );

    const result = {
      ...data[0],
      courseTopic: courseTopic,
    };

    res.status(200).json({
      success: true,
      message: "Get Single Course with courses topic",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Course  with courses topic",
      error: error.message,
    });
  }
};

// update courses
exports.updateCourses = async (req, res) => {
  try {
    const coursesID = req.params.id;

    const { title } = req.body;

    const [data] = await db.query(`SELECT * FROM courses WHERE id=? `, [
      coursesID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Courses found",
      });
    }

    const images = req.file;
    let image = data[0].image;
    if (images && images.path) {
      image = `https://education-management-backend-8jm1.onrender.com/public/images/${images.filename}`;
    }

    await db.query(`UPDATE courses SET title=?, image=? WHERE id =?`, [
      title || data[0].title,
      image,
      coursesID,
    ]);

    res.status(200).send({
      success: true,
      message: "Courses updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update Courses ",
      error: error.message,
    });
  }
};

// courses status
exports.coursesStatusUpdate = async (req, res) => {
  try {
    const coursesID = req.params.id;

    const { status } = req.body;
    if (!status) {
      return res.status(201).send({
        success: false,
        message: "status is requied in body",
      });
    }

    const [data] = await db.query(`SELECT * FROM courses WHERE id=? `, [
      coursesID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No courses found",
      });
    }

    await db.query(`UPDATE courses SET status=?  WHERE id =?`, [
      status,
      coursesID,
    ]);

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

// delete courses
exports.deleteCourses = async (req, res) => {
  try {
    const coursesID = req.params.id;

    const [data] = await db.query(`SELECT * FROM courses WHERE id=? `, [
      coursesID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Courses found",
      });
    }

    await db.query(`DELETE FROM courses WHERE id=?`, [coursesID]);
    res.status(200).send({
      success: true,
      message: "Courses Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Courses",
      error: error.message,
    });
  }
};
