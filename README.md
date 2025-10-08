# 📱 BeautyBook - Customer Booking App

A modern, production-ready booking platform for beauty services built with Next.js 15 and Supabase.

## ✨ Features

- 🔍 **Smart Search** - Find salons by location, services, and availability
- � **Complete Booking Flow** - Date, time, and staff selection
- 🛡️ **Production Security** - Rate limiting, input validation, XSS protection
- 📱 **Mobile Responsive** - Optimized for all devices
- ⚡ **High Performance** - Image optimization, caching, lazy loading
- 🔔 **Error Handling** - Comprehensive error states and user feedback
- 📊 **Booking Management** - Status tracking and updates

## 🚀 Quick Deployment

### Deploy to Vercel (Recommended)

1. **Connect Repository** to Vercel
2. **Add Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
   ```
3. **Deploy!** 🎉

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Supabase account

### Setup
```bash
# Install dependencies  
npm install

# Create environment file
# Add your Supabase credentials to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Deployment**: Vercel

### Security Features ✅
- Rate limiting (10-100 req/min)
- Input validation & sanitization  
- XSS & CSRF protection
- SQL injection prevention
- Security headers (HSTS, CSP, etc.)

### Performance Features ✅
- Image optimization with lazy loading
- API response caching (5min TTL)
- Bundle optimization
- Performance monitoring
- Web Vitals tracking

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/shops` | GET | List salons with filters |
| `/api/services` | GET | List services by shop |
| `/api/availability` | GET | Check appointment slots |
| `/api/bookings` | POST | Create new booking |
| `/api/bookings` | PUT | Update booking status |

## 🎯 Production Ready

This app includes:
- ✅ Security middleware
- ✅ Error boundaries & states
- ✅ Loading animations
- ✅ Input validation
- ✅ Performance monitoring
- ✅ SEO optimization

**🚀 Ready for production deployment!**
