// src/lib/type.ts
export type Category =
    | 'accomodation'
    | 'food'
    | 'transport'
    | 'activities'
    | 'shopping'
    | 'health'
    | 'other';

export type Expense = {
    id: string;
    amount: number;
    amountUSD: number;
    category: Category;
    note: string;
    date: string;
    country: string;
};

export type Trip = {
    id: string;
    name: string;
    currency: string;
    dailyBudgetUSD: number;
    startDate: string;
    expenses: Expense[];
};