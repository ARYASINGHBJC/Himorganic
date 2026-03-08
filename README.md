# 🌿 Himorganic - Organic E-Commerce Platform

A modern, full-stack e-commerce platform for organic products built with React, TypeScript, and Node.js.

## ✨ Features

- **🛒 Consumer Features:** Browse organic products with a polished storefront, choose product-specific quantity variants such as 500 gm, 1 Kg, 2 Kg, and 5 Kg, use the product detail experience, complete checkout, track orders, authenticate with email/password or phone OTP, and send messages through the Web3Forms contact form.
- **👨‍💼 Admin Features:** Manage products with full CRUD support, upload product images, maintain product variants from the admin modal, manage orders, and review analytics.
- **🎨 Modern UI/UX:** Glassmorphism styling, Framer Motion animations, a Three.js hero section, responsive layouts, and a green-and-white visual theme.

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Three.js / React Three Fiber** - 3D graphics
- **Zustand** - State management
- **React Router** - Navigation
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Mongoose** - MongoDB ODM (optional)
- **Multer** - File uploads

### Database
- **MongoDB** (production) or **JSON files** (development)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB (optional, for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Himorganic
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env with your settings
   ```

---

## 💻 Development Mode

### Option 1: Run Both Servers Separately

**Terminal 1 - Backend Server:**
```bash
npm run dev
# or
node server.js
```
Backend runs on: `http://localhost:3000`

**Terminal 2 - Frontend Dev Server:**
```bash
cd client
npm run dev
```
Frontend runs on: `http://localhost:5173`

### Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Admin Panel | http://localhost:5173/admin |


### Hot Reload

- Frontend: Vite provides instant HMR (Hot Module Replacement)
- Backend: Use `nodemon` for auto-restart
  ```bash
  npm install -g nodemon
  nodemon server.js
  ```

---

## 🏭 Production Mode

### Option 1: Build & Serve Together

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **The build output** will be in `client/dist/`

3. **Start production server**
   ```bash
   NODE_ENV=production node server.js
   ```

4. **Access the app** at `http://localhost:3000`

### Option 2: Deploy Separately

#### Frontend (Static Hosting)
Deploy `client/dist/` to a static host such as Netlify.

#### Backend (Node.js Hosting)
Deploy the Express API to a Node host such as Render.

Current production architecture used by this repo:
- Frontend: Netlify
- Backend: Render

### Environment Variables for Production

Create a `.env` file in the root:

```env
# Server
NODE_ENV=production
PORT=3000

# Database (choose one)
DB_TYPE=mongodb
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/himorganic

# Or use JSON files
# DB_TYPE=json

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-separate-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d

# Frontend origin allowed by CORS
CLIENT_ORIGIN=https://your-netlify-site.netlify.app

# OTP / SMS provider
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your-fast2sms-key

# Optional alternatives
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_FROM_NUMBER=...
# MSG91_API_KEY=...
# MSG91_TEMPLATE_ID=...
# MSG91_SENDER_ID=HIMORG
```

Frontend environment variables live in `client/.env`:

```env
VITE_API_URL=https://your-backend-host.com
VITE_MERCHANT_UPI=your-upi-id@bank
VITE_MERCHANT_NAME=Himorganic
VITE_WEB3FORMS_KEY=your-web3forms-access-key
```

### Production Build Commands

```bash
# Full production build
cd client && npm run build && cd ..

# Start production server
NODE_ENV=production node server.js

# Or with PM2 (recommended)
pm2 start server.js --name himorganic
```

---

## 📁 Project Structure

```
Himorganic/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── lib/            # API utilities
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── src/                    # Backend source
│   ├── config/             # Configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── utils/              # Utilities
│
├── data/                   # JSON database files
│   ├── products.json
│   ├── users.json
│   ├── orders.json
│   └── admins.json
│
├── uploads/                # Uploaded images
├── server.js               # Express server entry
├── package.json
├── .env.example
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/send-otp` | Send phone OTP |
| POST | `/api/auth/verify-otp` | Verify phone OTP |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update current user profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/my-orders` | Get current user's orders |
| GET | `/api/orders/:id` | Get order details |
| GET | `/api/orders` | Get all orders (admin) |
| PATCH | `/api/orders/:id/status` | Update order status (admin) |

### Analytics (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Get dashboard stats |
| GET | `/api/analytics/sales` | Get sales analytics |
| GET | `/api/analytics/customers` | Get customer analytics |
| GET | `/api/analytics/events` | Get event log |

### Uploads (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/product-image` | Upload a product image |

---

## 🧪 Testing

There is currently no automated test suite configured in this repository.

Recommended manual checks before deployment:
- `cd client && npm run build`
- Verify admin login and product CRUD
- Verify homepage product loading and navbar section links
- Verify contact form submission with the active Web3Forms key
- Verify OTP delivery with valid production SMS credentials

---

## 🔧 Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**2. npm install fails (corporate network)**
```bash
npm install --registry https://registry.npmjs.org
```

**3. MongoDB connection fails**
- Check if MongoDB is running
- Verify connection string in `.env`
- Set `DB_TYPE=json` to use file-based storage

**4. CORS errors**
- Ensure backend is running on port 3000
- Check proxy settings in `vite.config.ts`

---

## 📝 Scripts Reference

### Root (Backend)
```bash
npm start          # Start production server
npm run dev        # Start development server
```

### Client (Frontend)
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Three.js](https://threejs.org/)
- [Lucide Icons](https://lucide.dev/)
- [Unsplash](https://unsplash.com/) for images

---

Made with 💚 for organic living