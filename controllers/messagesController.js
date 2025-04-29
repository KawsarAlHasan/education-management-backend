const db = require("../config/db");

// message send
exports.sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, message, type, type_id } = req.body;

    if (!sender_id || !receiver_id || !message) {
      return res.status(400).json({
        success: false,
        message: "sender_id, receiver_id, message is required",
      });
    }

    const [messages] = await db.execute(
      "INSERT INTO messages (sender_id, receiver_id, message, type, type_id) VALUES (?, ?, ?, ?, ?)",
      [sender_id, receiver_id, message, type || "none", type_id || 0]
    );

    res.status(200).json({
      success: true,
      messages: "Send messages",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// get message
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

// first code
// exports.usersListForMessage = async (req, res) => {
//   try {
//     const { receiver_id } = req.params;

//     const [messages] = await db.execute(
//       `SELECT m.sender_id, m.receiver_id, m.created_at
//        FROM messages m
//        WHERE m.id IN (
//            SELECT MAX(id) FROM messages
//            WHERE sender_id = ? OR receiver_id = ?
//            GROUP BY sender_id, receiver_id
//        )
//        ORDER BY m.created_at DESC`,
//       [receiver_id, receiver_id]
//     );

//     const usersMap = {};
//     const senderIds = new Set();

//     messages.forEach((row) => {
//       const senderId = row.sender_id;
//       const receiverId = row.receiver_id;

//       const participantId = senderId === receiver_id ? receiverId : senderId;

//       // Only consider users (IDs starting with "u")
//       if (participantId) {
//         senderIds.add(participantId);

//         if (!usersMap[participantId]) {
//           usersMap[participantId] = {
//             id: participantId,
//             unread_count: 0,
//             last_message_time: row.created_at,
//           };
//         }
//       }
//     });

//     const unreadCounts = await db.execute(
//       `SELECT sender_id, COUNT(*) as unread_count
//        FROM messages
//        WHERE receiver_id = ? AND is_read = 0
//        GROUP BY sender_id`,
//       [receiver_id]
//     );

//     unreadCounts[0].forEach(({ sender_id, unread_count }) => {
//       if (sender_id) {
//         if (usersMap[sender_id]) {
//           usersMap[sender_id].unread_count = unread_count;
//         }
//       }
//     });

//     const userQueries = Object.keys(usersMap).map(async (id) => {
//       const [user] = await db.execute(
//         "SELECT id, first_name, last_name, profile_pic FROM users WHERE id = ?",
//         [id]
//       );
//       return user.length > 0
//         ? {
//             ...user[0],
//             unread_count: usersMap[id].unread_count,
//             last_message_time: usersMap[id].last_message_time,
//           }
//         : null;
//     });

//     const usersInfo = await Promise.all(userQueries);
//     const filteredUsers = usersInfo.filter((user) => user !== null);

//     const sortedUsers = filteredUsers.sort(
//       (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
//     );

//     res.status(200).json({
//       success: true,
//       message: "Sender user details retrieved",
//       users: sortedUsers,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// deepseek code
exports.usersListForMessage = async (req, res) => {
  try {
    const { receiver_id } = req.params;

    const [conversations] = await db.execute(
      `SELECT 
          CASE 
              WHEN m.sender_id = ? THEN m.receiver_id 
              ELSE m.sender_id 
          END AS participant_id,
          MAX(m.created_at) AS last_message_time
       FROM messages m
       WHERE m.sender_id = ? OR m.receiver_id = ?
       GROUP BY participant_id
       ORDER BY last_message_time DESC`,
      [receiver_id, receiver_id, receiver_id]
    );

    // find un read message
    const [unreadCounts] = await db.execute(
      `SELECT sender_id, COUNT(*) as unread_count
       FROM messages
       WHERE receiver_id = ? AND is_read = 0
       GROUP BY sender_id`,
      [receiver_id]
    );

    const unreadMap = {};
    unreadCounts.forEach(({ sender_id, unread_count }) => {
      unreadMap[sender_id] = unread_count;
    });

    const userQueries = conversations.map(async (conv) => {
      const [user] = await db.execute(
        "SELECT id, first_name, last_name, profile_pic FROM users WHERE id = ?",
        [conv.participant_id]
      );

      return user.length > 0
        ? {
            ...user[0],
            unread_count: unreadMap[conv.participant_id] || 0,
            last_message_time: conv.last_message_time,
          }
        : null;
    });

    const usersInfo = await Promise.all(userQueries);
    const filteredUsers = usersInfo.filter((user) => user !== null);

    res.status(200).json({
      success: true,
      message: "Conversation partners retrieved successfully",
      users: filteredUsers,
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

    let userInfo = {};
    let vehicles = [];

    const [user] = await db.execute("SELECT * FROM users WHERE id = ?", [
      sender_id,
    ]);
    if (user.length > 0) {
      userInfo = user[0];

      // Fetch user's vehicles from messages table
      // const [userVehicles] = await db.execute(
      //   `SELECT DISTINCT v.id, v.make, v.model, v.year_of_manufacture, v.vehicle_code,
      //     v.thumbnail_image, v.trim
      //    FROM messages m
      //    LEFT JOIN vehicles v ON m.vehicle_id = v.id
      //    WHERE m.sender_id = ? AND m.receiver_id = ?
      //    ORDER BY m.id DESC`,
      //   [sender_id, receiver_id]
      // );

      // vehicles = userVehicles;
    }
    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: "User  not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sender user and type details details retrieved",
      data: {
        ...userInfo,
        //  vehicles
      },
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
