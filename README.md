https://lexury-ecommerce-website.vercel.app/

# Lexury E-commerce Website

A modern, luxury e-commerce platform built with React, TypeScript, and Node.js.

## Features

### Frontend
- 🛍️ Product browsing with filters and search
- 🛒 Shopping cart with persistent storage
- ❤️ Wishlist functionality
- 🔐 User authentication and authorization
- 💳 Checkout process
- 👤 User profile management
- 🏪 Merchant dashboard
- 👨‍💼 Admin dashboard
- 📱 Responsive design

### Backend
- 🔒 JWT-based authentication
- 👥 Role-based access control (User, Merchant, Admin)
- 📦 Product management (CRUD)
- 🛒 Shopping cart management
- 📋 Order processing
- ❤️ Wishlist management
- 📊 Admin analytics
- 📤 File upload for product images

## Tech Stack

### Frontend
- React 18
- JavaScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui components
- Axios
- React Hook Form
- Zod validation

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt for password hashing
- Multer for file uploads
- express-validator

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WEB3FORMS_ACCESS_KEY=your_web3forms_access_key_here
```

   **Note:** To get your free Web3Forms access key:
   - Visit [https://web3forms.com](https://web3forms.com)
   - Sign up for a free account
   - Copy your access key and add it to the `.env` file

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
FRONTEND_URL=http://localhost:5173
```

   **Note:** Replace `your_mongodb_connection_string_here` with your MongoDB connection string.
   - For local MongoDB: `mongodb://localhost:27017/lexury-ecommerce`
   - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database-name`

4. Start MongoDB (if running locally)

5. (Optional) Seed the database:
```bash
npm run seed
```

6. Start the backend server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Default Test Accounts

After seeding the database, you can use these accounts:

- **Admin**: `admin@lexury.com` / `admin123`
- **Merchant**: `merchant@lexury.com` / `merchant123`
- **User**: `user@lexury.com` / `user123`

## Project Structure

```
lexury-ecommerce-website/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── context/            # React contexts
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   └── lib/                # Utility functions
├── backend/                # Backend source code
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/              # Utility functions
│   └── scripts/            # Database scripts
└── public/                 # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin/Merchant)
- `PUT /api/products/:id` - Update product (Admin/Merchant)
- `DELETE /api/products/:id` - Delete product (Admin/Merchant)

### Cart
- `GET /api/cart` - Get cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:itemId` - Update item quantity
- `DELETE /api/cart/items/:itemId` - Remove item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID

### Wishlist
- `GET /api/wishlist` - Get wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist

See `backend/README.md` for complete API documentation.

## Development

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Seed database
```

## Environment Variables

### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_WEB3FORMS_ACCESS_KEY` - Web3Forms access key for contact form

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRE` - JWT expiration time (default: 7d)
- `UPLOAD_PATH` - Path for uploaded files (default: ./uploads)
- `MAX_FILE_SIZE` - Maximum file size in bytes (default: 5242880)
- `FRONTEND_URL` - Frontend URL for CORS

## Deployment

### Deploying to Render (Backend) and Vercel (Frontend)

This guide will help you deploy the Lexury e-commerce website to production.

#### Prerequisites
- GitHub account
- Render account (free tier available)
- Vercel account (free tier available)
- MongoDB Atlas account (free tier available)

---

### Step 1: Deploy Backend to Render

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your project

3. **Configure the Web Service**
   - **Name**: `lexury-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose a paid plan)

4. **Set Environment Variables in Render**
   Go to "Environment" tab and add:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
   
   **Important**: 
   - Replace `your_mongodb_atlas_connection_string` with your MongoDB Atlas connection string
   - Replace `https://your-vercel-app.vercel.app` with your Vercel deployment URL (you'll update this after deploying frontend)

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your backend
   - Wait for deployment to complete
   - Copy your backend URL (e.g., `https://lexury-backend.onrender.com`)

---

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI** (optional, you can also use the web interface)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure the Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root of your project)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables in Vercel**
   Go to "Environment Variables" and add:
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com/api
   VITE_WEB3FORMS_ACCESS_KEY=your_web3forms_access_key
   ```
   
   **Important**: 
   - Replace `https://your-render-backend-url.onrender.com` with your actual Render backend URL
   - Replace `your_web3forms_access_key` with your Web3Forms access key

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Wait for deployment to complete
   - Copy your frontend URL (e.g., `https://lexury-ecommerce.vercel.app`)

---

### Step 3: Update Environment Variables

After both deployments are complete:

1. **Update Render Backend Environment Variable**
   - Go back to Render dashboard
   - Navigate to your backend service
   - Go to "Environment" tab
   - Update `FRONTEND_URL` to your Vercel frontend URL:
     ```
     FRONTEND_URL=https://your-vercel-app.vercel.app
     ```
   - Save and redeploy if needed

2. **Verify CORS Settings**
   - Your backend CORS is configured to accept requests from the `FRONTEND_URL`
   - Make sure the frontend URL in Render matches your Vercel deployment URL

---

### Step 4: MongoDB Atlas Setup

1. **Create MongoDB Atlas Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Wait for cluster to be created

2. **Configure Database Access**
   - Go to "Database Access"
   - Create a database user
   - Set username and password (save these securely)

3. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for production) or add specific IPs
   - Click "Confirm"

4. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `lexury-ecommerce`)
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/lexury-ecommerce?retryWrites=true&w=majority`

5. **Add to Render Environment Variables**
   - Use this connection string as `MONGODB_URI` in Render

---

### Step 5: File Uploads (Important for Production)

**Note**: Render's free tier has ephemeral file storage. Uploaded files will be lost on restart.

**Options for file storage:**
1. **Use MongoDB GridFS** (store files in MongoDB)
2. **Use Cloud Storage** (AWS S3, Cloudinary, etc.)
3. **Use Render Disk** (paid plans only)

For now, the uploads folder will work, but files may be lost on service restart.

---

### Step 6: Verify Deployment

1. **Test Backend**
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"status":"OK","message":"Server is running"}`

2. **Test Frontend**
   - Visit your Vercel URL
   - Try logging in with test accounts
   - Test product browsing
   - Test cart functionality

3. **Check Console for Errors**
   - Open browser DevTools
   - Check Console and Network tabs for any errors
   - Verify API calls are going to the correct backend URL

---

### Troubleshooting

#### Backend Issues

**Problem**: Backend not starting
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is valid

**Problem**: CORS errors
- Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
- Check that the URL includes `https://` protocol

**Problem**: Database connection fails
- Verify MongoDB Atlas network access allows all IPs (0.0.0.0/0)
- Check database user credentials
- Ensure connection string is correct

#### Frontend Issues

**Problem**: API calls failing
- Verify `VITE_API_URL` in Vercel matches your Render backend URL
- Check that the URL includes `/api` at the end
- Ensure backend is running and accessible

**Problem**: Environment variables not working
- Rebuild the project after adding environment variables
- Vite requires rebuild for environment variable changes
- Check that variables start with `VITE_` prefix

**Problem**: Build fails
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

---

### Production Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] MongoDB Atlas cluster created and configured
- [ ] All environment variables set correctly
- [ ] CORS configured properly
- [ ] Database seeded (optional)
- [ ] File upload storage configured (if needed)
- [ ] SSL certificates active (automatic on Render/Vercel)
- [ ] Test all major features
- [ ] Update any hardcoded URLs in code

---

### Custom Domain (Optional)

**Vercel:**
- Go to your project settings
- Navigate to "Domains"
- Add your custom domain
- Follow DNS configuration instructions

**Render:**
- Go to your service settings
- Navigate to "Custom Domains"
- Add your custom domain
- Update DNS records as instructed

---

### Monitoring and Maintenance

- **Render**: Monitor service health in dashboard
- **Vercel**: Check deployment logs and analytics
- **MongoDB Atlas**: Monitor database usage and performance
- Set up error tracking (e.g., Sentry) for production

---

## License

ISC
