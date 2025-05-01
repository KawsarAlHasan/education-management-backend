const db = require("../../config/db");

// course_details: id courses_id course_topic_id teacher_id

// create new course_details
exports.createNewCoursesDetails = async (req, res) => {
  try {
    const {
      courses_id,
      course_topic_id,
      teacher_id,
      total_chapter,
      total_duration,
    } = req.body;

    if (!courses_id || !course_topic_id || !teacher_id) {
      return res.status(400).send({
        success: false,
        message:
          "Please provide courses_id, course_topic_id & teacher_id required fields",
      });
    }

    const query =
      "INSERT INTO course_details (courses_id, course_topic_id, teacher_id, total_chapter, total_duration) VALUES (?, ?, ?, ?, ?)";

    const values = [
      courses_id,
      course_topic_id,
      teacher_id,
      total_chapter || "",
      total_duration || "",
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

// // Get Single Courses Details
// exports.getSingleTeacherWithCoursesDetails2 = async (req, res) => {
//   try {
//     const { course_topic_id, teacher_id } = req.query;

//     const [data] = await db.query(
//       "SELECT * FROM course_details WHERE course_topic_id=? AND teacher_id=?",
//       [course_topic_id, teacher_id]
//     );

//     console.log("data", data);

//     if (data.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Data not found",
//       });
//     }

//     const [teacher] = await db.query(`SELECT * FROM users WHERE id=? `, [
//       teacher_id,
//     ]);

//     const [packages] = await db.query(
//       `SELECT * FROM packages WHERE course_details_id=?`,
//       [data[0].id]
//     );

//     for (const package of packages) {
//       const packageId = package.id;
//       const [videos] = await db.query(
//         `SELECT id, url, sr_no, title, duration FROM videos WHERE type_id=? AND type=? ORDER BY sr_no ASC`,
//         [packageId, "packages"]
//       );

//       package.videos = videos;
//     }

//     const [semesters] = await db.query(
//       `SELECT * FROM semester WHERE course_details_id=?`,
//       [data[0].id]
//     );

//     for (const semester of semesters) {
//       const semesterId = semester.id;
//       const [videos] = await db.query(
//         `SELECT id, url, sr_no, title, duration FROM videos WHERE type_id=? AND type=? ORDER BY sr_no ASC`,
//         [semesterId, "semester"]
//       );

//       semester.videos = videos;
//     }

//     const result = {
//       ...data[0],
//       teacher: teacher[0],
//       packages: packages,
//       semester: semesters,
//     };

//     res.status(200).json({
//       success: true,
//       message: "Get Single Course details with videos",
//       data: result,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error in fetching Course details",
//       error: error.message,
//     });
//   }
// };

// Get Single Courses Details
exports.getSingleTeacherWithCoursesDetails = async (req, res) => {
  try {
    const { course_topic_id, teacher_id } = req.query;

    const [data] = await db.query(
      "SELECT * FROM course_details WHERE course_topic_id=? AND teacher_id=?",
      [course_topic_id, teacher_id]
    );

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data not found",
      });
    }

    const [teacher] = await db.query(`SELECT * FROM users WHERE id=?`, [
      teacher_id,
    ]);

    const course_details_id = data[0].id;

    const [packages] = await db.query(
      `SELECT * FROM packages WHERE course_details_id=?`,
      [course_details_id]
    );

    for (const package of packages) {
      const packageId = package?.id;
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

    const [semesters] = await db.query(
      `SELECT * FROM semester WHERE course_details_id=?`,
      [course_details_id]
    );

    const semesterId = semesters[0]?.id;
    let semesterVideos = [];

    if (semesterId) {
      const [semVideos] = await db.query(
        `SELECT id, url, sr_no, title, duration, isPaid FROM videos WHERE type_id=? AND type=? ORDER BY sr_no ASC`,
        [semesterId, "semester"]
      );

      semesterVideos = semVideos;
    }

    const [chapter] = await db.query(
      `SELECT id, chapter_name FROM chapter WHERE course_details_id=?`,
      [course_details_id]
    );

    const semesterResult = {
      chapter: chapter,
      ...semesters[0],
      vedios: semesterVideos,
    };

    const result = {
      ...data[0],
      teacher: teacher[0],
      packages: packages,
      semester: semesterResult,
    };

    res.status(200).json({
      success: true,
      message: "Get Single Course details with videos",
      data: result,
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

    const {
      courses_id,
      course_topic_id,
      teacher_id,
      total_chapter,
      total_duration,
    } = req.body;

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
      `UPDATE course_details SET courses_id=?, course_topic_id=?, teacher_id=?, total_chapter=?, total_duration=? WHERE id =?`,
      [
        courses_id || data[0].courses_id,
        course_topic_id || data[0].course_topic_id,
        teacher_id || data[0].teacher_id,
        total_chapter || data[0].total_chapter,
        total_duration || data[0].total_duration,
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
