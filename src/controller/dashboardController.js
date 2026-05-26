const Dashboard = require("../models/dashboard");

const DashboardController = {
  getSummaryArea: async (req, res) => {
    try {
      const idUser = req.user.id_user;
      data = await Dashboard.getSummaryArea(idUser);
      res.status(200).json({
        success: true,
        message: "Data Dashboard berhasil didapatkan",
        data: {
          data,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = DashboardController;
