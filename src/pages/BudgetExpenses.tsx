import React from 'react';
import { Card, ProgressBar } from 'react-bootstrap';

const BudgetAllocation = () => {
    const categories = [
        { name: 'Instructor Fees', allocated: 5000, committed: 3000, spent: 2000 },
        { name: 'Production', allocated: 7000, committed: 4000, spent: 3000 },
        { name: 'Platform & Tech', allocated: 6000, committed: 3500, spent: 2500 },
        { name: 'Legal & Compliance', allocated: 2000, committed: 800, spent: 1200 },
        { name: 'Marketing', allocated: 8000, committed: 5000, spent: 3000 },
        { name: 'Events', allocated: 4500, committed: 2500, spent: 2000 },
        { name: 'Staff', allocated: 9000, committed: 6000, spent: 3000 },
        { name: 'Miscellaneous', allocated: 3000, committed: 1500, spent: 1500 }
    ];

    const getRemaining = (allocated, spent) => allocated - spent;

    return (
        <div>
            <h2>Budget Allocation</h2>
            {categories.map((category, index) => (
                <Card key={index} style={{ margin: '1rem' }}>
                    <Card.Body>
                        <Card.Title>{category.name}</Card.Title>
                        <Card.Text>Allocated Budget: ${category.allocated}</Card.Text>
                        <Card.Text>Committed: ${category.committed}</Card.Text>
                        <Card.Text>Spent: ${category.spent}</Card.Text>
                        <Card.Text>Remaining: ${getRemaining(category.allocated, category.spent)}</Card.Text>
                        <ProgressBar now={(category.spent / category.allocated) * 100} />
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default BudgetAllocation;