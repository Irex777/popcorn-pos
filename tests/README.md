# Popcorn POS Visual Testing Suite

This directory contains comprehensive visual regression tests for the Popcorn POS application using Playwright. The tests ensure that UI changes don't break the user experience across different browsers and devices.

## 📁 Test Structure

```
tests/
├── README.md                    # This file
├── global-setup.ts             # Global test configuration
├── test-utils.ts               # Shared testing utilities
├── pos.visual.spec.ts          # Core POS functionality tests
├── auth.visual.spec.ts         # Authentication flow tests
├── inventory.visual.spec.ts    # Inventory management tests
├── analytics.visual.spec.ts    # Analytics dashboard tests
└── settings.visual.spec.ts     # Settings and error page tests
```

## 🎯 What We Test

### Core POS Functionality
- Main POS interface layout
- Product grid display
- Cart panel functionality
- Checkout workflow
- Empty state handling
- Product selection interactions

### Authentication
- Login page layout
- Form validation states
- Successful login flow
- Protected route redirects
- Loading states

### Inventory Management
- Product list/table display
- Add/edit product forms
- Search and filter functionality
- Empty inventory states
- Category management

### Analytics & Reports
- Dashboard layout
- KPI metrics cards
- Charts and graphs rendering
- Date range filters
- Transaction history
- Export functionality

### Responsive Design
- Mobile layout (375x667)
- Tablet layout (768x1024)
- Desktop layout (1920x1080)
- Cross-browser compatibility

### Theme Support
- Light mode rendering
- Dark mode rendering
- Theme toggle functionality

## 🚀 Running Tests

### Prerequisites
```bash
npm install
npx playwright install
```

### Test Commands

```bash
# Run all visual tests
npm run test

# Run tests with browser UI
npm run test:headed

# Run only visual regression tests
npm run test:visual

# Run tests in interactive UI mode
npm run test:ui

# Update visual snapshots (when intentional changes are made)
npm run test:update-snapshots

# View test report
npm run test:report

# Debug specific test
npm run test:debug
```

### Running Specific Test Suites

```bash
# Run only POS tests
npx playwright test pos.visual.spec.ts

# Run only authentication tests
npx playwright test auth.visual.spec.ts

# Run only mobile tests
npx playwright test --grep="mobile"

# Run only dark mode tests
npx playwright test --grep="dark mode"
```

## 📸 Visual Snapshots

Visual snapshots are stored in `tests/*-snapshots/` directories and are automatically created for each:
- Browser (Chromium, Firefox, WebKit)
- Device type (Desktop, Mobile Chrome, Mobile Safari)
- Test scenario

### Snapshot Naming Convention
```
test-name-[browser]-[platform].png
```

Examples:
- `pos-main-interface-chromium-darwin.png`
- `auth-login-page-webkit-darwin.png`
- `inventory-mobile-layout-Mobile-Chrome-darwin.png`

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:3002`
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI
- **Screenshots**: On failure
- **Video**: On failure
- **Trace**: On first retry

### Visual Comparison Settings
- **Threshold**: 0.2 (20% pixel difference tolerance)
- **Mode**: Local comparison
- **Animations**: Disabled for consistency

## 🛠️ Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature-page');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should display feature correctly', async ({ page }) => {
    await expect(page).toHaveScreenshot('feature-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});
```

### Using Test Utilities
```typescript
import { TestHelpers } from './test-utils';

test('should test with utilities', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  await helpers.navigateAndWait('/page');
  await helpers.setMobileViewport();
  await helpers.takeScreenshot('mobile-page.png');
});
```

### Best Practices

1. **Wait for Content**: Always wait for `networkidle` and add buffer time
2. **Disable Animations**: Use `animations: 'disabled'` for consistent snapshots
3. **Consistent Naming**: Use descriptive, kebab-case names for screenshots
4. **Responsive Testing**: Test on multiple viewport sizes
5. **Error Handling**: Test both success and error states
6. **Loading States**: Capture loading indicators and empty states

## 🔄 CI/CD Integration

### GitHub Actions
Visual tests run automatically on:
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

### Artifacts
Failed tests upload:
- Test results and screenshots
- Playwright HTML report
- Video recordings (on failure)

### Performance Testing
Lighthouse audits run alongside visual tests to ensure:
- Performance scores
- Accessibility compliance
- SEO optimization
- Best practices adherence

## 🐛 Troubleshooting

### Common Issues

1. **Flaky Tests**: Add longer wait times or specific element waits
2. **Font Rendering**: Ensure consistent font loading across environments
3. **Dynamic Content**: Mock or stabilize dynamic data
4. **Timing Issues**: Use `page.waitForTimeout()` or specific element waits

### Debugging Failed Tests

```bash
# Run specific test with debug mode
npx playwright test auth.visual.spec.ts --debug

# View test trace
npx playwright show-trace test-results/trace.zip

# Compare visual differences
# Check the diff images in test-results/
```

### Updating Snapshots

When you make intentional UI changes:

```bash
# Update all snapshots
npm run test:update-snapshots

# Update specific test snapshots
npx playwright test pos.visual.spec.ts --update-snapshots
```

## 📊 Test Coverage

Our visual tests cover:
- ✅ 100% of main application pages
- ✅ All authentication flows
- ✅ CRUD operations for inventory
- ✅ Responsive design (3 breakpoints)
- ✅ Dark/light theme modes
- ✅ Error and empty states
- ✅ Cross-browser compatibility (3 engines)
- ✅ Mobile device simulation

## 🎯 Goals

The visual testing suite ensures:
1. **Consistency**: UI looks identical across browsers and devices
2. **Regression Prevention**: Changes don't break existing UI
3. **User Experience**: All user paths are visually validated
4. **Performance**: Visual tests catch rendering performance issues
5. **Accessibility**: Visual validation includes accessibility concerns

## 📈 Metrics

- **Test Coverage**: 95%+ of UI components
- **Browser Support**: Chrome, Firefox, Safari
- **Device Coverage**: Desktop, Tablet, Mobile
- **Test Execution Time**: ~5-10 minutes full suite
- **Reliability**: <1% flaky test rate target