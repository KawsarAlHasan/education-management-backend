const db = require("../config/db");

exports.getMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.query;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Sender ID and Receiver ID required",
      });
    }

    const [messages] = await db.query(
      "SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC",
      [sender_id, receiver_id, receiver_id, sender_id]
    );

    res.status(200).json({
      success: true,
      messages: "Get messages",
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.usersListForMessage = async (req, res) => {
  try {
    const { receiver_id } = req.params;

    // Fetch all unique conversations where the user is either sender or receiver
    const [messages] = await db.execute(
      `SELECT m.sender_id, m.receiver_id, m.created_at
       FROM messages m
       WHERE m.id IN (
           SELECT MAX(id) FROM messages 
           WHERE sender_id = ? OR receiver_id = ? 
           GROUP BY sender_id, receiver_id
       )
       ORDER BY m.created_at DESC`,
      [receiver_id, receiver_id]
    );

    const usersMap = {};
    const vendorsMap = {};
    const senderIds = new Set();

    messages.forEach((row) => {
      const senderId = row.sender_id;
      const receiverId = row.receiver_id;
      const participantId = senderId === receiver_id ? receiverId : senderId;
      senderIds.add(participantId);

      if (participantId.startsWith("u")) {
        const userId = participantId.replace("u", "");
        if (!usersMap[userId]) {
          usersMap[userId] = {
            id: userId,
            unread_count: 0,
            last_message_time: row.created_at,
          };
        }
      } else if (participantId.startsWith("v")) {
        if (!vendorsMap[participantId]) {
          vendorsMap[participantId] = {
            busn_id: participantId,
            unread_count: 0,
            last_message_time: row.created_at,
          };
        }
      }
    });

    // Fetch unread message count for each participant
    const unreadCounts = await db.execute(
      `SELECT sender_id, COUNT(*) as unread_count
       FROM messages
       WHERE receiver_id = ? AND is_read = 0
       GROUP BY sender_id`,
      [receiver_id]
    );

    // Map unread counts to users/vendors
    unreadCounts[0].forEach(({ sender_id, unread_count }) => {
      if (sender_id.startsWith("u")) {
        const userId = sender_id.replace("u", "");
        if (usersMap[userId]) {
          usersMap[userId].unread_count = unread_count;
        }
      } else if (sender_id.startsWith("v")) {
        if (vendorsMap[sender_id]) {
          vendorsMap[sender_id].unread_count = unread_count;
        }
      }
    });

    // Fetch user details
    const userQueries = Object.keys(usersMap).map(async (id) => {
      const [user] = await db.execute(
        "SELECT id, name, profile_pic, is_active FROM users WHERE id = ?",
        [id]
      );
      return user.length > 0
        ? {
            ...user[0],
            unread_count: usersMap[id].unread_count,
            last_message_time: usersMap[id].last_message_time,
          }
        : null;
    });

    // Fetch vendor details
    const vendorQueries = Object.keys(vendorsMap).map(async (busn_id) => {
      const [vendor] = await db.execute(
        "SELECT busn_id, name, profile_picture, is_active FROM vendor_busn_info WHERE busn_id = ?",
        [busn_id]
      );
      return vendor.length > 0
        ? {
            ...vendor[0],
            unread_count: vendorsMap[busn_id].unread_count,
            last_message_time: vendorsMap[busn_id].last_message_time,
          }
        : null;
    });

    // Resolve all queries
    const usersInfo = await Promise.all(userQueries);
    const vendorsInfo = await Promise.all(vendorQueries);

    const filteredUsers = usersInfo.filter((user) => user !== null);
    const filteredVendors = vendorsInfo.filter((vendor) => vendor !== null);

    // Final sorting based on last message time (latest first)
    const sortedUsers = filteredUsers.sort(
      (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
    );
    const sortedVendors = filteredVendors.sort(
      (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
    );

    res.status(200).json({
      success: true,
      message: "Sender user and vendor details retrieved",
      users: sortedUsers,
      vendors: sortedVendors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.singleUserMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.query;

    const uID = sender_id.slice(1);
    const type = sender_id.charAt(0);

    let userInfo = null;
    let vehicles = [];

    if (type === "u") {
      // Fetch user details
      const [user] = await db.execute("SELECT * FROM users WHERE id = ?", [
        uID,
      ]);
      if (user.length > 0) {
        userInfo = user[0];

        // Fetch user's vehicles from messages table
        const [userVehicles] = await db.execute(
          `SELECT DISTINCT v.id, v.make, v.model, v.year_of_manufacture, v.vehicle_code, 
            v.thumbnail_image, v.trim 
           FROM messages m
           LEFT JOIN vehicles v ON m.vehicle_id = v.id
           WHERE m.sender_id = ? AND m.receiver_id = ?
           ORDER BY m.id DESC`,
          [sender_id, receiver_id]
        );

        vehicles = userVehicles;
      }
    } else if (type === "v") {
      // Fetch vendor details
      const [vendor] = await db.execute(
        "SELECT * FROM vendor_busn_info WHERE busn_id = ?",
        [sender_id]
      );
      if (vendor.length > 0) {
        userInfo = vendor[0];

        // Fetch vendor's vehicles from messages table
        const [vendorVehicles] = await db.execute(
          `SELECT DISTINCT v.id, v.make, v.model, v.year_of_manufacture, v.vehicle_code, 
            v.thumbnail_image, v.trim 
           FROM messages m
           LEFT JOIN vehicles v ON m.vehicle_id = v.id
           WHERE m.sender_id = ? AND m.receiver_id = ?
           ORDER BY m.id DESC`,
          [sender_id, receiver_id]
        );

        vehicles = vendorVehicles;
      }
    }

    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: "User or Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sender user/vendor and associated vehicle details retrieved",
      type: type === "u" ? "user" : "vendor",
      data: { ...userInfo, vehicles },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.messageRead = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;

    await db.query(
      `UPDATE messages SET is_read=?  WHERE (sender_id =? AND receiver_id =?) AND is_read=?`,
      [1, sender_id, receiver_id, 0]
    );

    res.status(200).json({
      success: true,
      message: "Message Read Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
