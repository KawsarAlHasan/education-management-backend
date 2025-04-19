const db = require("../config/db");

// add card
exports.addCard = async (req, res) => {
  try {
    const { user_id, type, type_id } = req.body;

    if (!user_id || !type || !type_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide user_id, type & type_id field",
      });
    }

    // Insert card into the database
    const [result] = await db.query(
      "INSERT INTO card (user_id, type, type_id) VALUES (?, ?, ?)",
      [user_id, type, type_id]
    );

    // Check if the insertion was successful
    if (result.affectedRows === 0) {
      return res.status(500).send({
        success: false,
        message: "Failed to insert Card, please try again",
      });
    }

    const card_id = result.insertId;

    // Send success response
    res.status(200).send({
      success: true,
      message: "Card inserted successfully",
      card_id: card_id,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occurred while inserting the Card",
      error: error.message,
    });
  }
};

// card এ আছে user_id, packages_id ।
// packages টেবিলে আছে id, course_details_id, title, price, duration, intro_url
// course_details টেবিলে আছে `id`, `courses_id`, `course_topic_id`, `teacher_id`, `total_duration`, `total_chapter`
// users থেকে id === course_details এর teacher_id ধরে ডাটা দেখাবো
// courses থেকে id === course_details এর courses_id ধরে ডাটা দেখাবো status, image, title,
// course_topic থেকে id === course_details এর course_topic_id ধরে ডাটা দেখাবো

exports.getMyCard = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide user_id field",
      });
    }

    const [package] = await db.query(
      `
      SELECT 
        c.id AS card_id,
        c.user_id,
        p.id AS package_id,
        p.title AS package_title,
        p.price,
        p.duration AS package_duration,
        p.intro_url,
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
      FROM card c
      LEFT JOIN packages p ON c.type_id = p.id
      LEFT JOIN course_details cd ON p.course_details_id = cd.id
      LEFT JOIN users u ON cd.teacher_id = u.id
      LEFT JOIN courses crs ON cd.courses_id = crs.id
      LEFT JOIN course_topic ct ON cd.course_topic_id = ct.id
      WHERE c.user_id = ? AND type =?
      `,
      [user_id, "packages"]
    );

    const [semester] = await db.query(
      `
      SELECT 
        c.id AS card_id,
        c.user_id,
        p.id AS package_id,
        p.title AS package_title,
        p.price,
        p.duration AS package_duration,
        p.intro_url,
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
      FROM card c
      LEFT JOIN semester p ON c.type_id = p.id
      LEFT JOIN course_details cd ON p.course_details_id = cd.id
      LEFT JOIN users u ON cd.teacher_id = u.id
      LEFT JOIN courses crs ON cd.courses_id = crs.id
      LEFT JOIN course_topic ct ON cd.course_topic_id = ct.id
      WHERE c.user_id = ? AND type =?
      `,
      [user_id, "semester"]
    );

    const result = {
      package: package,
      semester: semester,
    };

    res.status(200).send({
      success: true,
      message: "Get My Card",
      data: result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// delete All card
exports.deleteAllCard = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide user_id field",
      });
    }

    const [data] = await db.query(`SELECT * FROM card WHERE user_id=? `, [
      user_id,
    ]);

    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Product found from card",
      });
    }

    await db.query(`DELETE FROM card WHERE user_id=?`, [user_id]);
    res.status(200).send({
      success: true,
      message: "Delete all product from card",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in delete all product from card",
      error: error.message,
    });
  }
};

// delete Single card
exports.deleteSingleCard = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(`SELECT * FROM card WHERE id=? `, [id]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Data found from card",
      });
    }

    await db.query(`DELETE FROM card WHERE id=?`, [id]);
    res.status(200).send({
      success: true,
      message: "Delete Data from card",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in delete Data from card",
      error: error.message,
    });
  }
};
