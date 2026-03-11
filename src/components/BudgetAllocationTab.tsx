import React from 'react';

// Define types for Expense data
interface Expense {
    category: string;
    allocatedBudget: number;
    committedAmount: number;
    spentAmount: number;
}

interface BudgetAllocationTabProps {
    expenses: Expense[];
}

const BudgetAllocationTab: React.FC<BudgetAllocationTabProps> = ({ expenses }) => {
    // Function to calculate category totals
    const totals = expenses.reduce((acc, expense) => {
        acc.allocatedBudget += expense.allocatedBudget;
        acc.committedAmount += expense.committedAmount;
        acc.spentAmount += expense.spentAmount;
        return acc;
    }, { allocatedBudget: 0, committedAmount: 0, spentAmount: 0 });

    // Calculate remaining balance
    const remainingBalance = totals.allocatedBudget - totals.spentAmount;

    return (
        <div className="bg-card rounded-lg nc-shadow-card p-4 text-foreground">
            <h2 className="text-lg font-bold">Budget Allocation</h2>
            <table className="min-w-full mt-4">
                <thead>
                    <tr className="border-b">
                        <th className="text-left py-2">Category</th>
                        <th className="text-right py-2">Allocated</th>
                        <th className="text-right py-2">Committed</th>
                        <th className="text-right py-2">Spent</th>
                        <th className="text-right py-2">Remaining</th>
                        <th className="text-right py-2">Progress</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map((expense, index) => {
                        const progress = expense.spentAmount / expense.allocatedBudget;
                        return (
                            <tr key={index} className="border-b">
                                <td className="py-2">{expense.category}</td>
                                <td className="text-right py-2">${expense.allocatedBudget.toFixed(2)}</td>
                                <td className="text-right py-2">${expense.committedAmount.toFixed(2)}</td>
                                <td className="text-right py-2">${expense.spentAmount.toFixed(2)}</td>
                                <td className="text-right py-2">${(remainingBalance).toFixed(2)}</td>
                                <td>
                                    <div className="h-4 bg-gray-200 rounded">
                                        <div className={`h-4 bg-accent rounded`} style={{ width: `${progress * 100}%` }}></div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <h3 className="mt-4 text-lg font-bold">Category Totals</h3>
            <div className="mt-2">
                <p>Allocated Budget: ${totals.allocatedBudget.toFixed(2)}</p>
                <p>Committed Amount: ${totals.committedAmount.toFixed(2)}</p>
                <p>Spent Amount: ${totals.spentAmount.toFixed(2)}</p>
                <p>Remaining Balance: ${remainingBalance.toFixed(2)}</p>
            </div>
        </div>
    );
};

export default BudgetAllocationTab;