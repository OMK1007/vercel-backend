const xlsx = require('xlsx');
const Expense = require('../models/Expense');

//Add expense source
exports.addExpense = async (req, res) => {
    const userId = req.user.id;

    try {
        const { icon, category, amount, date } = req.body;
        
        //Validaton check for missing fields
        if (!category || !amount || !date) {
            return res.status(400).json({ message: "All fields are required" });
        }
        
        const newExpense = new Expense({
            userId,
            icon,
            category,
            amount,
            date: new Date(date)
        });

        await newExpense.save();
        res.status(200).json(newExpense);
    } catch (error) {
        // IMPROVEMENT: Added better logging to help you debug
        console.error("ADD EXPENSE FAILED:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//Get all Expense source
exports.getAllExpense = async (req, res) => {
    const userId = req.user.id;

    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });
        res.json({ expense });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

//Delete Expense Source
exports.deleteExpense = async (req, res) => {
    const userId = req.user.id;
    const expenseId = req.params.id;

    try {
        // FIX: Security vulnerability patched.
        // Now checks that the expense belongs to the user before deleting.
        const expense = await Expense.findOneAndDelete({ _id: expenseId, userId: userId });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found or you're not authorized." });
        }

        res.json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

//Download Excel
exports.downloadExpenseExcel = async (req, res) => {
    // FIX: Changed variable name 'user' to 'userId'
    const userId = req.user.id;

    try {
        // This query now correctly uses the 'userId' variable
        const expense = await Expense.find({ userId }).sort({ date: -1 });
    
        //Prepare data for excel
        const data = expense.map((item) => ({
            Category: item.category,
            Amount: item.amount,
            Date: item.date
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "expense");
        xlsx.writeFile(wb, 'expense_details.xlsx');
        res.download('expense_details.xlsx');
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};