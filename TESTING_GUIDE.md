# 🧪 Testing Guide - Casa Gestión PWA

## Overview

This project includes a comprehensive testing infrastructure using **Vitest** and **@testing-library/react**. All calculation utilities are thoroughly tested with 30+ test cases covering normal operation, edge cases, and error scenarios.

---

## 📦 Testing Stack

| Package | Version | Purpose |
|---------|---------|---------|
| **vitest** | ^4.0.18 | Fast unit testing framework |
| **@vitest/ui** | ^4.0.18 | Visual test runner interface |
| **happy-dom** | ~10.10 | Lightweight DOM for testing |
| **@testing-library/react** | ^16.3.2 | React component testing utilities |
| **@testing-library/jest-dom** | ^6.9.1 | DOM matchers for assertions |

---

## 🚀 Quick Start

### Run Tests

```bash
# Watch mode (re-runs on file changes)
npm run test

# Single run
npm run test:run

# Visual interface
npm run test:ui

# With coverage report
npm run test:coverage
```

### Expected Output

```
✓ utils/__tests__/calculations.test.ts (30 tests) 16ms
  ✓ calculateMonthlyOccupancy (9)
  ✓ calculateFinancialBalance (6)
  ✓ calculateADR (5)
  ✓ calculateAverageStayDuration (4)
  ✓ calculateRevPAR (4)
  ✓ calculateAllMetrics (2)

Test Files  1 passed (1)
Tests  30 passed (30)
```

---

## 📁 Project Structure

```
src/
├── utils/
│   ├── calculations.ts          # Pure calculation functions
│   └── __tests__/
│       └── calculations.test.ts # Comprehensive test suite
├── components/
│   └── Dashboard.tsx            # Uses calculation utils
├── hooks/
│   └── useData.ts
├── contexts/
│   └── DataContext.tsx
└── types.ts
```

---

## 🧮 Calculation Utilities

All calculation functions are pure (no side effects) and heavily tested.

### Available Functions

#### 1. **calculateMonthlyOccupancy**
- **Purpose**: Calculate monthly occupancy percentage
- **Parameters**: `reservations: Reservation[], totalCabins: number`
- **Returns**: `number (0-100)`
- **Tests**: 9 cases (empty data, zero cabins, single reservations, long stays, multi-cabin)

```typescript
import { calculateMonthlyOccupancy } from '../utils/calculations';

const occupancy = calculateMonthlyOccupancy(reservations, 5);
// Returns: 45.5 (45.5% occupied)
```

#### 2. **calculateFinancialBalance**
- **Purpose**: Calculate income, expenses, profit, and profit margin
- **Parameters**: `transactions: Transaction[]`
- **Returns**: Object with `{ totalIncome, totalExpenses, netProfit, profitMargin }`
- **Tests**: 6 cases (no transactions, income only, expenses only, negative profit)

```typescript
import { calculateFinancialBalance } from '../utils/calculations';

const balance = calculateFinancialBalance(transactions);
// Returns: { totalIncome: 5000, totalExpenses: 3000, netProfit: 2000, profitMargin: 40 }
```

#### 3. **calculateADR** (Average Daily Rate)
- **Purpose**: Calculate average revenue per night
- **Parameters**: `reservations: Reservation[]`
- **Returns**: `number`
- **Tests**: 5 cases (no reservations, cancelled only, single/multi-cabin, multiple)

```typescript
import { calculateADR } from '../utils/calculations';

const adr = calculateADR(reservations);
// Returns: 150.75 (average revenue per night)
```

#### 4. **calculateAverageStayDuration**
- **Purpose**: Calculate average stay duration in days
- **Parameters**: `reservations: Reservation[]`
- **Returns**: `number`
- **Tests**: 4 cases (no reservations, single, multiple, excluding cancelled)

```typescript
import { calculateAverageStayDuration } from '../utils/calculations';

const avgStay = calculateAverageStayDuration(reservations);
// Returns: 3.5 (average 3.5 days per stay)
```

#### 5. **calculateRevPAR** (Revenue Per Available Room)
- **Purpose**: Calculate revenue per available room
- **Parameters**: `occupancyRate: number, adr: number`
- **Returns**: `number`
- **Tests**: 4 cases (zero occupancy, zero ADR, normal, full occupancy)

```typescript
import { calculateRevPAR } from '../utils/calculations';

const revPar = calculateRevPAR(45.5, 150);
// Returns: 68.25 (45.5% occupancy × $150 ADR)
```

#### 6. **calculateAllMetrics** (Aggregate)
- **Purpose**: Calculate all metrics in one call
- **Parameters**: `reservations: Reservation[], transactions: Transaction[], totalCabins: number`
- **Returns**: Object with all metrics
- **Tests**: 2 cases (no data, realistic scenario)

```typescript
import { calculateAllMetrics } from '../utils/calculations';

const metrics = calculateAllMetrics(reservations, transactions, 5);
// Returns: { 
//   occupancy: 45.5, 
//   adr: 150.75, 
//   avgStay: 3.5, 
//   revPar: 68.25,
//   totalIncome: 5000,
//   totalExpenses: 3000,
//   netProfit: 2000,
//   profitMargin: 40
// }
```

---

## ✅ Test Coverage

### Test File: `utils/__tests__/calculations.test.ts`

**Total: 30 test cases across 6 describe blocks**

#### calculateMonthlyOccupancy (9 tests)
- ✓ Empty reservations → 0%
- ✓ Zero cabins → 0%
- ✓ Single short reservation
- ✓ Long stay reservation
- ✓ Excludes cancelled reservations
- ✓ Excludes information status
- ✓ Multiple reservations
- ✓ Caps at 100%
- ✓ Multi-cabin reservations

#### calculateFinancialBalance (6 tests)
- ✓ No transactions → all zeros
- ✓ Income only → positive profit
- ✓ Expenses only → negative profit
- ✓ Multiple with negative profit
- ✓ Correct profit margin calculation
- ✓ Expenses exceed income → zero margin

#### calculateADR (5 tests)
- ✓ No reservations → 0
- ✓ Only cancelled → 0
- ✓ Single confirmed
- ✓ Multi-cabin calculation
- ✓ Multiple reservations average

#### calculateAverageStayDuration (4 tests)
- ✓ No reservations → 0
- ✓ Single reservation
- ✓ Multiple reservations average
- ✓ Excludes cancelled

#### calculateRevPAR (4 tests)
- ✓ Zero occupancy → 0
- ✓ Zero ADR → 0
- ✓ Normal calculation
- ✓ Full occupancy

#### calculateAllMetrics (2 tests)
- ✓ No data → all zeros
- ✓ Realistic data → all metrics

---

## 🔧 Integration with Dashboard

The `Dashboard.tsx` component uses these utilities:

```typescript
import { 
  calculateMonthlyOccupancy, 
  calculateFinancialBalance, 
  calculateADR, 
  calculateAverageStayDuration, 
  calculateRevPAR 
} from '../utils/calculations';

// In component
const financialBalance = useMemo(
  () => calculateFinancialBalance(transactions),
  [transactions]
);

const kpiData = useMemo(() => {
  const occupancyRate = calculateMonthlyOccupancy(reservations, totalAvailableCabins);
  const adr = calculateADR(reservations);
  const avgStayDuration = calculateAverageStayDuration(reservations);
  const revPar = calculateRevPAR(occupancyRate, adr);

  return { 
    occupancyRate: occupancyRate.toFixed(0), 
    adr: adr.toFixed(0), 
    avgStayDuration: avgStayDuration.toFixed(1), 
    revPar: revPar.toFixed(0) 
  };
}, [reservations, totalAvailableCabins]);
```

**Benefits**:
- ✅ Cleaner component code (no inline calculations)
- ✅ Reusable utilities
- ✅ Easy to test
- ✅ Performance optimized with `useMemo`

---

## 📝 Test Examples

### Example 1: Testing Occupancy with Empty Data

```typescript
it('should return 0 when there are no reservations', () => {
  const reservations: Reservation[] = [];
  const occupancy = calculateMonthlyOccupancy(reservations, 3);
  expect(occupancy).toBe(0);
});
```

### Example 2: Testing Financial Balance with Loss

```typescript
it('should handle expenses exceeding income', () => {
  const transactions: Transaction[] = [
    { id: '1', type: TransactionType.INCOME, amount: 500, ... },
    { id: '2', type: TransactionType.EXPENSE, amount: 800, ... }
  ];

  const balance = calculateFinancialBalance(transactions);

  expect(balance.totalIncome).toBe(500);
  expect(balance.totalExpenses).toBe(800);
  expect(balance.netProfit).toBe(-300);
  expect(balance.profitMargin).toBe(0); // Zero margin when loss
});
```

### Example 3: Testing Long Stay Reservation

```typescript
it('should handle a long stay reservation correctly', () => {
  const reservations: Reservation[] = [
    {
      id: '1',
      clientId: '1',
      startDate: '2026-01-10',
      endDate: '2026-02-20', // 41 days
      cabinCount: 1,
      totalAmount: 1000,
      status: ReservationStatus.CONFIRMED,
    }
  ];

  const occupancy = calculateMonthlyOccupancy(reservations, 3);
  expect(occupancy).toBeGreaterThan(0);
  expect(occupancy).toBeLessThanOrEqual(100);
});
```

---

## 🎯 Writing New Tests

### Template

```typescript
describe('calculateNewFunction', () => {
  it('should handle [scenario]', () => {
    // ARRANGE
    const testData = { /* ... */ };
    
    // ACT
    const result = calculateNewFunction(testData);
    
    // ASSERT
    expect(result).toBe(expectedValue);
  });
});
```

### Best Practices

1. **Use clear test names**: Describe what's being tested
2. **Follow AAA Pattern**: Arrange, Act, Assert
3. **Test edge cases**: Empty data, zero values, negative numbers
4. **Use realistic data**: Dates, amounts that make sense
5. **Group related tests**: Use `describe()` blocks

---

## 🐛 Debugging Tests

### Run Single Test File
```bash
npm run test:run -- utils/__tests__/calculations.test.ts
```

### Run Specific Test
```bash
npm run test:run -- -t "should return 0 when"
```

### Watch Mode
```bash
npm run test
```
(Stops and re-runs on file changes)

### Visual Interface
```bash
npm run test:ui
```
(Open in browser for interactive debugging)

### Coverage Report
```bash
npm run test:coverage
```
(Generates coverage/index.html)

---

## 📊 Configuration

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    environment: 'happy-dom', // Lightweight DOM
    globals: true,            // describe/it/expect without imports
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
```

---

## ✨ Key Features

| Feature | Benefit |
|---------|---------|
| **30+ Tests** | Comprehensive coverage |
| **Pure Functions** | Easy to test, no side effects |
| **Type Safe** | Full TypeScript support |
| **Fast** | Tests run in ~16ms |
| **Watch Mode** | Instant feedback during development |
| **UI Mode** | Visual test runner |
| **Coverage** | Generate coverage reports |
| **No Props Drilling** | Tests don't require component tree |

---

## 🚨 Common Issues

### Issue: Test fails with "Cannot find module"
**Solution**: Make sure imports use correct paths and file exists

### Issue: Test times out
**Solution**: Increase timeout or check for infinite loops
```typescript
it('test name', () => { /* ... */ }, 10000); // 10 second timeout
```

### Issue: Date calculations are off
**Solution**: Remember calculations use current date. Use `new Date()` in tests

### Issue: Type errors in tests
**Solution**: Ensure Transaction/Reservation objects match types.ts

---

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Matchers](https://jestjs.io/docs/expect)

---

## 🎉 Summary

You now have:
- ✅ **6 calculation utilities** extracted to `utils/calculations.ts`
- ✅ **30 test cases** covering all scenarios
- ✅ **4 npm scripts** for running tests
- ✅ **Dashboard refactored** to use utilities
- ✅ **Type-safe** calculations
- ✅ **100% passing tests**

All calculations are now:
- **Testable**: Pure functions with no dependencies
- **Reusable**: Import anywhere in the project
- **Maintainable**: Centralized logic
- **Performant**: Used with `useMemo` in components

**Happy testing! 🚀**
