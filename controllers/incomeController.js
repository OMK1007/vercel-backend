const xlsx = require('xlsx');
const Income = require('../models/Income');

//Add income source
exports.addIncome = async (req, res) => {
    const userId = req.user.id;
    console.log("Adding income for user ID:", userId);

    try {
        const { icon, source, amount, date } = req.body;
        console.log("Request data:", { icon, source, amount, date }); // ✅ Fixed: Log actual data

        //Validation check for missing fields
        if (!source || !amount || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newIncome = new Income({
            userId,
            icon,
            source,
            amount,
            date: new Date(date)
        });

        await newIncome.save();
        console.log("Income created successfully:", newIncome); // ✅ Fixed: Log after creation
        res.status(200).json(newIncome);
    } catch (error) {
        console.error("ADD INCOME FAILED:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//Get all income source
exports.getAllIncome = async (req, res) => {
    const userId = req.user.id;

    try {
        const income = await Income.find({ userId }).sort({ date: -1 });
        res.json({ income });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//Delete Income Source
exports.deleteIncome = async (req, res) => {
    const userId = req.user.id;
    const incomeId = req.params.id;

    try {
        const income = await Income.findOneAndDelete({ _id: incomeId, userId: userId });

        if (!income) {
            return res.status(404).json({ message: "Income not found or you're not authorized to delete it." });
        }

        res.json({ message: "Income deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

//Download Excel
exports.downloadIncomeExcel = async (req, res) => {
    const userId = req.user.id;

    try {
        const income = await Income.find({ userId }).sort({ date: -1 });

        //Prepare data for excel
        const data = income.map((item) => ({
            Source: item.source,
            Amount: item.amount,
            Date: item.date
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Income");
        xlsx.writeFile(wb, 'income_details.xlsx');
        res.download('income_details.xlsx');
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};