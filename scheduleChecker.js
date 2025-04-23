const schedule = require("node-schedule");
const db = require("./config/db");

const bidFinalBySchedule = async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // range of +-30 second
    const lowerBound = new Date(oneHourAgo.getTime() - 30 * 1000);
    const upperBound = new Date(oneHourAgo.getTime() + 30 * 1000);

    const [assignments] = await db.query(
      `SELECT * FROM assignment WHERE bid_time BETWEEN ? AND ?`,
      [lowerBound, upperBound]
    );

    for (const assignment of assignments) {
      const assignment_id = assignment.id;

      const [lowestBid] = await db.query(
        `SELECT proposal_sender_id, bid_price FROM bid WHERE assignment_id = ? ORDER BY bid_price ASC LIMIT 1`,
        [assignment_id]
      );

      await db.query(
        `UPDATE assignment SET winning_bidder=?, lowest_bid=?, status=? WHERE id=?`,
        [
          lowestBid[0].proposal_sender_id,
          lowestBid[0].bid_price,
          "Assigned",
          assignment_id,
        ]
      );
    }
  } catch (error) {
    console.log(`Error: `, error.message);
  }
};

// Run the job every 1 minute
schedule.scheduleJob("*/1 * * * *", bidFinalBySchedule);

module.exports = bidFinalBySchedule;
