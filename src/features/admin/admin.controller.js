const AdminService = require('./admin.service');

class AdminController {
    static async addAdmin(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }
            const result = await AdminService.addAdmin(username, password);
            return res.status(result.status).json(result);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async getAllLabs(req, res) {
        try {
            const result = await AdminService.getAllLabs();
            return res.status(result.status).json(result);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async registerDelivery(req, res) {
        try {
            const { username, phoneNumber, email, buildNo, floorNo, address, password } = req.body;
            if (!username || !phoneNumber || !email || !buildNo || !floorNo || !address || !password) {
                return res.status(400).json({ error: "All fields are required" });
            }
            const result = await AdminService.registerDelivery(
                username,
                phoneNumber,
                email,
                buildNo,
                floorNo,
                address,
                password
            );
            return res.status(result.status).json(result);
        } catch (error) {
            return res.status(error.statusCode || 500).json({ error: error.message });
        }
    }

    static async loginAdmin(req, res) {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required" });
            }
            const result = await AdminService.loginAdmin(username, password);
            return res.status(result.status).json(result);
        } catch (error) {
            return res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
}

module.exports = AdminController;