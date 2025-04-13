const db = require("../../config/db");

// create new course_topic
exports.createNewCourseTopic = async (req, res) => {
  try {
    const { courses_id, name } = req.body;

    if (!courses_id || !name) {
      return res.status(400).send({
        success: false,
        message: "Please provide courses_id & name required fields",
      });
    }

    const query = "INSERT INTO course_topic (courses_id, name) VALUES (?, ?)";

    const values = [courses_id, name];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Course Topic, please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course Topic added successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// get all coursesTopic
exports.getAllCoursesTopic = async (req, res) => {
  try {
    const { order } = req.query;
    let query = "SELECT * FROM course_topic";
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
        message: "No course topic found",
        data: [],
      });
    }

    res.status(200).send({
      success: true,
      message: "All Courses Topic",
      totalCoursesTopic: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Get All Courses Topic",
      error: error.message,
    });
  }
};

// Get Single Courses Topic
exports.getSingleCoursesTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const [data] = await db.query("SELECT * FROM course_topic WHERE id = ?", [
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
      message: "Get Single Course Topic",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching Course Topic",
      error: error.message,
    });
  }
};

// update courses Topic
exports.updateCoursesTopic = async (req, res) => {
  try {
    const coursesTopicID = req.params.id;

    const { name } = req.body;

    const [data] = await db.query(`SELECT * FROM course_topic WHERE id=? `, [
      coursesTopicID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No course_topic found",
      });
    }

    await db.query(`UPDATE course_topic SET name=? WHERE id =?`, [
      name || data[0].name,
      coursesTopicID,
    ]);

    res.status(200).send({
      success: true,
      message: "course topic updated successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Update course topic ",
      error: error.message,
    });
  }
};

// delete courses Topic
exports.deleteCoursesTopic = async (req, res) => {
  try {
    const coursesTopicID = req.params.id;

    const [data] = await db.query(`SELECT * FROM course_topic WHERE id=? `, [
      coursesTopicID,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No course_topic found",
      });
    }

    await db.query(`DELETE FROM course_topic WHERE id=?`, [coursesTopicID]);
    res.status(200).send({
      success: true,
      message: "Courses topic Deleted Successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Delete Courses topic",
      error: error.message,
    });
  }
};
