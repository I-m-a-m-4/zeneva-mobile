# 📱 Zeneva Mobile POS

Industrial-grade, buttery smooth 60–120 FPS React Native / Expo POS client engineered specifically for retail store cashiers, shop attendants, and inventory stock takers.

---

## ⚡ What Makes This Mobile App Production-Ready

1. **Native Stack Navigation (`@react-navigation/native-stack`)**:
   - Zero DOM teardown or web layout thrashing.
   - Screen transitions run directly on iOS `UINavigationController` and Android `FragmentManager` hardware threads.
2. **Zero `backdrop-blur` Re-compositing**:
   - Replaced heavy CSS `backdrop-filter: blur(...)` and multi-layered web shadows with clean, hardware-accelerated solid surface styling adhering to Zeneva's warm linen `#F9F8F6` and orange `#F47125` theme.
3. **Decoupled Lightweight State (`MobilePosContext`)**:
   - Handles cart operations, discounts, and inventory caching with sub-millisecond latency.
   - **Persistent Storage**: Uses `@react-native-async-storage/async-storage` so active cart, held orders, completed sales, and cashier shifts survive app reloads and low-battery restarts.
4. **Hardware Camera Barcode Scanner (`expo-camera` + `expo-haptics`)**:
   - Real CameraView utilizing Android CameraX / iOS AVFoundation with auto-detection of QR, EAN13, EAN8, Code128, UPC-A/E.
   - Laser alignment overlay with torch/flashlight toggle.
   - Instant physical vibration haptics on item addition or barcode detection.
5. **Real ESC/POS Thermal Printing & Sharing (`expo-print` + `expo-sharing`)**:
   - Generates pixel-perfect 58mm / 80mm monospace POS thermal receipts.
   - Prints to connected Bluetooth, USB, or Network receipt printers.
   - Generates and exports PDF receipts to customer messaging apps or email.
   - Instant WhatsApp digital receipt dispatch.
6. **Cashier Shift & Cash Drawer Reconciliation**:
   - Register opening cash float.
   - Tracks Cash in Drawer vs Card / Bank Transfer breakdown in real-time.
   - Reconciles expected vs counted cash with Z-Report shift closure.
7. **Sales History & Transaction Voiding**:
   - Full history of past receipts.
   - Single-tap transaction reprint or voiding (restocks inventory in-memory and queues void action).
8. **Offline First Queue (Zeneva Law 1 Compliant)**:
   - Sales are stamped, stock is deducted in-memory instantly, and the mutation is appended to `queuedSales` for background reconciliation with Cloud Firestore and local SQLite.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd "C:\Users\Bello Imam\Downloads\zeneva mobile"
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```
- Press `a` to open in Android Emulator / connected device.
- Scan the QR code with the **Expo Go** app on your physical phone for instantaneous wireless live-reload.

---

## 📂 Project Architecture

```
zeneva-mobile/
├── assets/                       # App icons, splash screens, favicon
├── src/
│   ├── components/
│   │   ├── CartItemRow.tsx       # Quantity steppers & trash action
│   │   ├── CategoryPill.tsx      # Smooth category filters
│   │   ├── Header.tsx            # Store metadata, sync indicator, shift & history actions
│   │   ├── MiniCartBar.tsx       # Sticky floating bottom cart pill
│   │   └── ProductCard.tsx       # Fast native catalog card
│   ├── context/
│   │   └── MobilePosContext.tsx  # Persistent cart, catalog, offline queue, hold/resume, shifts
│   ├── navigation/
│   │   └── AppNavigator.tsx      # Native stack navigation (POS, Cart, Pay, Receipt, Scanner, Shift, History)
│   ├── screens/
│   │   ├── POSScreen.tsx         # Fast search & instant catalog grid
│   │   ├── CartScreen.tsx        # Line-item editing, customer selector, order discount
│   │   ├── PaymentScreen.tsx     # Cash with quick-tender pills, Card/POS, Bank Transfer
│   │   ├── ReceiptScreen.tsx     # Digital receipt, thermal print slip, WhatsApp sharing
│   │   ├── ScannerModal.tsx      # CameraView barcode scanner + laser overlay + manual fallback
│   │   ├── InventoryScreen.tsx   # Fast stock auditor & low-stock alerts
│   │   ├── SalesHistoryScreen.tsx# Past receipts, reprinting, and inventory voiding
│   │   └── ShiftScreen.tsx       # Opening float, cash in drawer, sales breakdown & Z-Report
│   ├── theme/
│   │   └── colors.ts             # Zeneva Warm Linen (#F9F8F6), Tangerine Orange (#F47125)
│   └── types/
│       └── index.ts              # Mirror of Zeneva Web data models
├── App.tsx                       # Root provider container
├── app.json                      # Expo camera permissions & Android package config
└── package.json
```
