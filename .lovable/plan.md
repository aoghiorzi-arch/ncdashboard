

# Plan: Partial Payments, Class Tagging, Instructor Revenue Sharing, and Doc Updates

This covers four areas: expense instalments, cost-per-class tracking, instructor revenue sharing, and updating help/SharePoint docs.

---

## 1. Partial Payments on Expenses

**Problem:** Some expenses (honoraria, videographer fees) are paid in instalments. Currently an expense is a single amount with one status.

**Solution:** Add a `payments` array to the `Expense` interface tracking individual instalments.

- **`storage.ts`** — Extend `Expense` with:
  - `totalAmount: number` (the full contracted amount)
  - `payments: { id: string; amount: number; date: string; reference: string; status: 'Pending' | 'Paid' }[]`
  - Keep existing `amount` as computed "total paid so far" for backward compat, or migrate to use `totalAmount`
- **`BudgetExpenses.tsx` — ExpenseDialog** — Add a "Payments" section inside the expense edit dialog:
  - Show total amount field at the top
  - List of instalment rows (amount, date, reference, status) with Add/Remove buttons
  - Auto-calculate: paid so far, remaining balance, progress bar
  - Expense status auto-derives: all paid = "Paid", some paid = "Partially Paid", none = keeps current status
- **Add "Partially Paid" to expense statuses** in the constants and badge colours
- **Budget overview cards** — "Spent" should sum actual payments marked as Paid, not just full expense amounts
- **Table view** — Show "£X / £Y" format (paid / total) in the Amount column for expenses with multiple payments

---

## 2. Class Tagging on Expenses (Cost per Class)

**Problem:** No way to see how much a class costs in total across all its expenses.

**Solution:** Add an optional `classId` field to `Expense`.

- **`storage.ts`** — Add `classId?: string` to `Expense`
- **`BudgetExpenses.tsx` — ExpenseDialog** — Add a "Linked Class" dropdown populated from `classCRUD.getAll()`, showing class titles
- **Table view** — Add a "Class" column showing the linked class title
- **`ClassesPipeline.tsx`** — Add a "Cost Summary" section to the class edit dialog showing all expenses tagged to that class, with a total
- **Budget page** — Add a new tab or summary card: "Cost per Class" — a table listing each class with total expenses, paid, and remaining

---

## 3. Instructor Revenue Sharing Module

**Problem:** Need to track the two-part instructor compensation: 15% direct sales commission + 7.5% IRP pool allocation.

**Suggestion:** Since actual revenue data and learner progress come from Kajabi (external), the dashboard should focus on **recording and tracking** the revenue share calculations, not computing them live. I recommend:

### 3a. Add Revenue Share fields to Instructor

- **`storage.ts`** — Extend `Instructor` with:
  - `referralCode: string`
  - `revenueShareRate: number` (default 15, customisable per instructor if amended in writing)
  - `irpEligibleUntil: string` (date — 12 months after class launch)

### 3b. New "Revenue Share" tab on Budget page

A third tab alongside Expenses and Income, containing:

- **Revenue Share Entries** — A CRUD table for monthly entries:
  - `instructorId`, `month` (YYYY-MM), `directSalesRevenue`, `commissionAmount` (15% of net), `irpPoolTotal` (7.5% of platform net), `qualifiedCompletions`, `totalPlatformCompletions`, `irpShare` (calculated), `status` ('Draft' | 'Approved' | 'Paid'), `paymentDate`
- Auto-calculates: IRP allocation = (instructor completions / total completions) * IRP pool
- Summary cards: Total commissions this month, Total IRP distributed, Outstanding payments
- Export to CSV for finance team

### 3c. Instructor CRM integration

- In the instructor edit dialog, show a "Revenue Share" section with their referral code, rate, IRP eligibility window, and a mini-table of their last 6 months of payouts

---

## 4. Update Help & SharePoint Docs

### DashboardHelp.tsx updates:
- Update **Budget & Expenses** section to mention partial payments, class tagging, and revenue sharing
- Add a new help entry for **Instructor Revenue Sharing** explaining the two-part model

### SharePoint Integration Guide updates:
- Add columns to **NC_Expenses** schema: `TotalAmount`, `Payments` (JSON), `ClassId`
- Add new **NC_RevenueShare** list schema
- Update **NC_Instructors** schema with `ReferralCode`, `RevenueShareRate`, `IRPEligibleUntil`

---

## 5. Additional Suggested Improvements

These are quick wins I noticed while reviewing:

1. **Expense filtering by class** — Filter dropdown on the expenses table to show only expenses for a specific class
2. **Instructor payout summary on Dashboard** — A small widget showing upcoming/overdue instructor payments
3. **Budget burn-down by class** — Extend the existing burn-down chart to optionally break down by class

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/lib/storage.ts` | Extend `Expense` (payments array, classId), extend `Instructor` (referralCode, revenueShareRate, irpEligibleUntil), new `RevenueShareEntry` interface + CRUD |
| `src/pages/BudgetExpenses.tsx` | Partial payment UI in ExpenseDialog, class dropdown, new Revenue Share tab, updated budget calculations |
| `src/pages/ClassesPipeline.tsx` | Cost summary in class edit dialog |
| `src/pages/InstructorCRM.tsx` | Revenue share fields in edit dialog, payout history mini-table |
| `src/components/DashboardHelp.tsx` | Update Budget and add Revenue Sharing help sections |
| `public/docs/SharePoint-Integration-Guide.md` | New list schemas for revenue share, updated expense/instructor columns |

