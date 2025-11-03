const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { Types } = require('mongoose');

//Dashboard data
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const userObjectId = new Types.ObjectId(String(userId));

        // Fetch total income and expense
        const totalIncome = await Income.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const totalExpense = await Expense.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        // Get income transactions in the last 60 days
        const last60DaysIncomeTransactions = await Income.find({
            userId,
            date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        }).sort({ date: -1 });

        // Get total Income for last 60 days
        const incomeLast60Days = last60DaysIncomeTransactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            0
        );

        // Get expense Transaction in the last 30 days
        const last30DaysExpenseTransactions = await Expense.find({
            userId,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }).sort({ date: -1 });

        // Get total expenses for last 30 days
        const expensesLast30Days = last30DaysExpenseTransactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            0
        );

        // Fetch last transactions (income + expenses)
        const recentIncomes = (await Income.find({ userId }).sort({ date: -1 }).limit(5)).map(
            (txn) => ({ ...txn.toObject(), type: "income" })
        );
        
        const recentExpenses = (await Expense.find({ userId }).sort({ date: -1 }).limit(5)).map(
            (txn) => ({ ...txn.toObject(), type: "expense" })
        );

        // Combine, sort, and slice to get the 5 most recent transactions overall
        const lastTransactions = [...recentIncomes, ...recentExpenses]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        // Final Response
        res.json({
            totalBalance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
            totalIncome: totalIncome[0]?.total || 0,
            totalExpense: totalExpense[0]?.total || 0,
            expensesLast30Days: {
                total: expensesLast30Days,
                transactions: last30DaysExpenseTransactions
            },
            recentTransactions: lastTransactions,
            incomeLast60Days: {
                // ✅ FIX: Use the correct variable name here
                total: incomeLast60Days, 
                transactions: last60DaysIncomeTransactions
            }
        });

    } catch (error) {
        console.error("DASHBOARD ERROR:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};