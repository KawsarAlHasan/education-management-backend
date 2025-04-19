const db = require("../config/db");

// add card
exports.addCard = async (req, res) => {
  try {
    const { user_id, teacher_id, packages_id, semester_id } = req.body;

    if (!user_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide user_id field",
      });
    }

    // Insert card into the database
    const [result] = await db.query(
      "INSERT INTO card (user_id, teacher_id, packages_id, semester_id) VALUES (?, ?, ?, ?)",
      [user_id, teacher_id || 0, packages_id || 0, semester_id || 0]
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

// get My Card
exports.getMyCard = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide user_id field",
      });
    }

    const [data] = await db.query(
      `SELECT
        crd.*,
        fd.name AS food_name,
      FROM card crd
      LEFT JOIN packages packg ON crd.packages_id = packg.id
      WHERE crd.user_id = ?`,
      [user_id]
    );

    const [packages] = await db.query(
      `SELECT * FROM packages WHERE course_details_id=?`,
      [course_details_id]
    );

    if (data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Data found in card",
      });
    }

    res.status(200).send({
      success: true,
      message: "Get My Card",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Internel Server Error",
      error: error.message,
    });
  }
};

// delete All Food from card
exports.deleteAllFoodFromCard = async (req, res) => {
  try {
    const guest_user_id = req.params.id;

    if (!guest_user_id) {
      return res.status(400).send({
        success: false,
        message: "Please provide guest_user_id field",
      });
    }

    const [data] = await db.query(`SELECT * FROM card WHERE guest_user_id=? `, [
      guest_user_id,
    ]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Product found from card",
      });
    }

    for (const singleData of data) {
      const card_id = singleData.id;
      await db.query(`DELETE FROM card_addons WHERE card_id=?`, [card_id]);
      await db.query(`DELETE FROM flavers_for_card WHERE card_id=?`, [card_id]);
      await db.query(`DELETE FROM toppings_for_card WHERE card_id=?`, [
        card_id,
      ]);
      await db.query(`DELETE FROM sandCust_for_card WHERE card_id=?`, [
        card_id,
      ]);
    }

    await db.query(`DELETE FROM card WHERE guest_user_id=?`, [guest_user_id]);
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

// delete Single Food from card
exports.deleteSingleFoodFromCard = async (req, res) => {
  try {
    const id = req.params.id;

    const [data] = await db.query(`SELECT * FROM card WHERE id=? `, [id]);
    if (!data || data.length === 0) {
      return res.status(201).send({
        success: false,
        message: "No Food found from card",
      });
    }

    await db.query(`DELETE FROM card_addons WHERE card_id=?`, [id]);
    await db.query(`DELETE FROM flavers_for_card WHERE card_id=?`, [id]);
    await db.query(`DELETE FROM toppings_for_card WHERE card_id=?`, [id]);
    await db.query(`DELETE FROM sandCust_for_card WHERE card_id=?`, [id]);

    await db.query(`DELETE FROM card WHERE id=?`, [id]);
    res.status(200).send({
      success: true,
      message: "Delete Single Food from card",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in delete Single Food from card",
      error: error.message,
    });
  }
};
