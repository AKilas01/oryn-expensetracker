# Oryn — Expense Tracker
## Setup & Publishing Guide

> *Know where it goes.*

---

## What's inside

A complete React Native + Expo app:

- **Oryn** branding throughout — setup screen, lock screen, settings, deep links
- Income & expense tracking with live ECB exchange rates (no API key needed)
- First-launch onboarding — name, currency picker (20 currencies), Face ID setup
- Edit / delete / view all entries with receipt photos
- Monthly/weekly/daily filters + month navigation
- Spending comparison vs previous month + projected monthly spend
- Per-category budgets with push notifications at 80% and 100%
- Recurring expenses (daily/weekly/monthly/yearly)
- Auto-categorization by merchant name
- Duplicate detection
- Notes field on every entry
- CSV export
- Face ID / Touch ID lock screen
- Dark/light mode (dark default, lilac purple accent)
- Apple Pay Shortcut: `oryn://add` deep link

---

## Step 1 — Install Node.js

1. Go to **nodejs.org**
2. Download the **LTS** version (left button)
3. Install it
4. Open Terminal and run: `node -v` → should show `v20.x.x`

---

## Step 2 — Install Expo CLI

```bash
npm install -g expo-cli eas-cli
```

---

## Step 3 — Set up the project

```bash
cd path/to/oryn
npm install
```

---

## Step 4 — Preview on your iPhone (no Mac needed)

1. Install **Expo Go** on your iPhone (free, App Store)
2. Run:
```bash
npx expo start
```
3. Scan the QR code with your iPhone camera
4. Oryn opens instantly on your phone ✓

---

## Step 5 — Publish to the App Store

### Accounts needed
- **Apple Developer**: developer.apple.com — $99/year
- **Expo EAS**: expo.dev — free

### Configure app.json
- Change `"bundleIdentifier"` from `com.yourname.oryn` to something unique, e.g. `com.agit.oryn`
- After running `eas init`, paste your project ID into `"projectId"`

### Build & Submit
```bash
eas login
eas init
eas build --platform ios      # builds in Expo cloud, ~10-15 min
eas submit --platform ios     # uploads to App Store Connect
```

### App Store Connect
1. Go to appstoreconnect.apple.com
2. Fill in description, screenshots, category: **Finance**
3. Submit for review — Apple reviews in 1–3 days

---

## Apple Pay Shortcut (automatic logging)

1. Open **Shortcuts** app on iPhone
2. Tap **Automation** → **+** → **New Automation**
3. Choose **Notification** → select **Wallet**
4. Filter: notification contains `"paid"`
5. Add action: **Open URL** → type `oryn://add`
6. Turn OFF **"Ask Before Running"**
7. Done ✓

Every Apple Pay notification now instantly opens Oryn to the Add Expense screen.

---

## Trademark next steps

Now that you've chosen **Oryn**, consider registering the trademark:

1. **Switzerland (IPI)**: ipi.ch — CHF ~800 for Classes 9 + 36
2. **EU (EUIPO)**: euipo.europa.eu — €850 for one class, covers all EU countries
3. **USA (USPTO)**: uspto.gov — ~$350/class

File in:
- **Class 9** — downloadable mobile software
- **Class 36** — financial tracking services

Recommended: file in Switzerland first (your home market), then EU. USA optional unless you plan to market there. A trademark attorney can do the full filing for ~CHF 500–1500 depending on country.

---

## App icon & assets needed

Before App Store submission, create these in Canva (free):
- `assets/icon.png` — 1024×1024px app icon
- `assets/splash.png` — 1284×2778px splash screen
- `assets/adaptive-icon.png` — 1024×1024px (Android)
- `assets/notification-icon.png` — 96×96px white on transparent

Suggested icon concept: a stylized **O** or abstract shape in lilac purple on dark background.

---

## Project structure

```
oryn/
├── App.js                           ← Root + biometric lock + navigation
├── app.json                         ← Expo config (name: Oryn, scheme: oryn)
├── babel.config.js
├── package.json
└── src/
    ├── constants/theme.js           ← Colors, categories, typography
    ├── context/AppContext.js        ← Global state, storage, live FX rates
    ├── hooks/useTheme.js
    ├── utils/helpers.js             ← Filters, CSV export, date helpers
    ├── components/
    │   ├── UI.js                    ← Shared components
    │   └── TransactionRow.js
    └── screens/
        ├── SetupScreen.js           ← Oryn onboarding (5 steps)
        ├── HomeScreen.js            ← Dashboard
        ├── AddTransactionScreen.js  ← Add / Edit flow
        ├── TransactionDetailScreen.js
        ├── TransactionsScreen.js    ← Full history
        ├── InsightsScreen.js        ← Charts & analytics
        ├── BudgetsScreen.js         ← Budget management
        └── SettingsScreen.js        ← Oryn settings + export
```
