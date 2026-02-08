# 🌿 Himorganic - Organic E-Commerce Platform

A modern, full-stack e-commerce platform for organic products built with React, TypeScript, and Node.js.

![Himorganic](https://images.unsplash.com/photo-1542838132-92c53300491e?w=800)

## ✨ Features

- **🛒 Consumer Features**
  - Browse organic products with beautiful UI
  - Add to cart & wishlist
  - Secure checkout process
  - Order tracking
  - User authentication (register/login)

- **👨‍💼 Admin Features**
  - Product catalog management (CRUD)
  - Order management
  - Analytics dashboard
  - Image upload support

- **🎨 Modern UI/UX**
  - Glassmorphism design
  - Smooth animations (Framer Motion)
  - 3D hero section (Three.js)
  - Fully responsive
  - Green/white organic theme

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

### Option 2: Use Concurrently (if configured)
```bash
npm run dev:all
```

### Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Admin Panel | http://localhost:5173/admin |

### Default Credentials

**Admin Login:**
- Email: `admin@himorganic.com`
- Password: `admin123`

**Test User:**
- Register a new account or use the app

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
Deploy `client/dist/` to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

#### Backend (Node.js Hosting)
Deploy to:
- Railway
- Render
- Heroku
- AWS EC2
- DigitalOcean

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
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Optional
CORS_ORIGIN=https://yourdomain.com
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
| GET | `/api/auth/me` | Get current user |

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
| GET | `/api/orders` | Get user orders |
| GET | `/api/orders/:id` | Get order details |
| POST | `/api/orders` | Create new order |
| PUT | `/api/orders/:id` | Update order (admin) |

### Analytics (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/stats` | Get dashboard stats |

---

## 🧪 Testing

```bash
# Run frontend tests
cd client
npm run test

# Run backend tests
npm run test
```

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