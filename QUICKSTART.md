# ChumChum Frontend - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- npm or yarn
- Backend running on http://localhost:8080

### Installation

```bash
# 1. Navigate to project directory
cd /Users/sajjadkhan/Documents/chamcham/chumchum-frontend

# 2. Install dependencies
npm install

# 3. Create/update .env file
echo "VITE_API_BASE_URL=http://localhost:8080" > .env

# 4. Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in terminal)

---

## 🎯 Key Features to Test

### 1. Registration (Role-Based)
```
URL: http://localhost:5173/register

Creator Registration:
- Select "Creator" role
- Fill: username, email, password, phone, city, picture
- Creator fields: bio, category, social URLs
- Submit

Brand Registration:
- Select "Brand" role
- Fill: username, email, password, phone, city, picture
- Brand fields: company name, website, industry, description
- Submit
```

### 2. Dashboard (After Login)
```
CREATOR: http://localhost:5173/dashboard
- Shows: profile stats, bio, social links
- Actions: Edit Profile, View Services

BRAND: http://localhost:5173/dashboard
- Shows: company info, description
- Actions: Edit Profile, Find Creators
```

### 3. Creator Discovery
```
URL: http://localhost:5173/creators

Features:
- Search creators by name
- Filter by category
- Click card to view profile
```

### 4. Public Profiles
```
Creator Profile: /creator/:creatorId
Brand Profile: /brand/:brandId

View:
- User stats
- Bio/Company info
- Social links
- Contact button
```

---

## 📁 Important Files

### New API Layer
- `src/api/creatorApi.js` - Creator endpoints
- `src/api/brandApi.js` - Brand endpoints

### New Pages
- `src/pages/Dashboard/Dashboard.jsx` - Role router
- `src/pages/Dashboard/CreatorDashboard/`
- `src/pages/Dashboard/BrandDashboard/`
- `src/pages/Profile/CreatorProfile/`
- `src/pages/Profile/BrandProfile/`
- `src/pages/Creators/` - Discovery page

### Modified Files
- `src/pages/Auth/Register/Register.jsx` - Role selection UI
- `src/components/Navbar/Navbar.jsx` - Role-based menu
- `src/App.jsx` - New routes

---

## 🔗 All Routes

### Public Routes
| Route | Purpose |
|-------|---------|
| `/` | Home |
| `/login` | Login |
| `/register` | Registration |
| `/gigs` | Browse services |
| `/creators` | Discover creators |
| `/creator/:id` | Creator profile |
| `/brand/:id` | Brand profile |

### Private Routes (Logged In)
| Route | Role | Purpose |
|-------|------|---------|
| `/dashboard` | Both | Dashboard |
| `/my-gigs` | Creator | My services |
| `/organize` | Creator | Add service |
| `/orders` | Both | Orders |
| `/messages` | Both | Messages |

---

## 🎨 UI Customization

### Colors (in SCSS)
```scss
$primary-green: #1dbf73;
$dark-green: #16a86f;
$background: #f5f5f5;
$text-dark: #333;
$text-light: gray;
```

### Fonts (CSS)
```css
--font-family: system fonts
--heading-size: 32px (h1)
--body-size: 16px
```

---

## 🐛 Troubleshooting

### Routes Not Working
- Ensure App.jsx imports are correct
- Check browser console for errors
- Verify routes in App.jsx path array

### API Calls Failing
- Check backend is running on http://localhost:8080
- Verify .env file has correct VITE_API_BASE_URL
- Check network tab in browser dev tools

### Styles Not Loading
- Clear browser cache (Ctrl+Shift+Delete)
- Ensure SCSS files exist in component folders
- Check import statements in components

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Data Structure

### User Object (Recoil State)
```javascript
{
  id: "uuid",
  username: "john_doe",
  email: "john@example.com",
  role: "CREATOR", // or "BRAND"
  image: "url_to_image",
  city: "Karachi",
  phone: "+92300123456",
  is_active: true,
  created_at: "2024-01-01",
  updated_at: "2024-01-01"
}
```

### Creator Profile Object
```javascript
{
  id: "uuid",
  user_id: "uuid",
  bio: "Creator bio...",
  category: "Fashion",
  tiktok_url: "https://tiktok.com/@...",
  instagram_url: "https://instagram.com/@...",
  youtube_url: "https://youtube.com/@...",
  followers: 10000,
  avg_views: 50000,
  engagement_rate: 5.5,
  rating: 4.8,
  total_reviews: 23
}
```

### Brand Profile Object
```javascript
{
  id: "uuid",
  user_id: "uuid",
  company_name: "Brand Inc",
  website: "https://brand.com",
  industry: "Fashion",
  description: "We are a fashion brand..."
}
```

---

## 🧪 Testing Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📚 Documentation Files

1. **IMPLEMENTATION_SUMMARY.md** - What was implemented
2. **ROLE_BASED_SYSTEM_README.md** - Detailed documentation
3. **ARCHITECTURE.md** - Technical architecture
4. **QUICKSTART.md** - This file

---

## 🎯 Next Steps

1. **Update Backend Endpoints** (if needed)
   - Ensure `/api/auth/register` accepts role field
   - Ensure `/api/creators` and `/api/brands` endpoints exist
   - Implement automatic profile creation on registration

2. **Test Integration**
   - Register as Creator
   - Register as Brand
   - Login and view dashboards
   - Browse creator discovery

3. **Styling Adjustments**
   - Customize colors in component SCSS files
   - Adjust spacing/sizing as needed
   - Test responsive design

4. **Additional Features** (Optional)
   - Edit profile pages
   - More detailed analytics
   - Portfolio/work samples
   - Messaging system

---

## 💡 Tips

- Use React DevTools to inspect component state
- Use Redux DevTools to inspect Recoil atoms
- Use Network tab to monitor API calls
- Check browser console for errors
- Use `console.log()` for debugging

---

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review component code comments
3. Check console for error messages
4. Verify backend API endpoints are implemented

---

## ✅ Success Checklist

- [x] Installation successful
- [ ] Backend running at :8080
- [ ] .env file configured
- [ ] Dev server running at localhost:5173
- [ ] Can register as Creator
- [ ] Can register as Brand
- [ ] Can login with created account
- [ ] Dashboard shows correct role
- [ ] Can view creator discovery
- [ ] Can view public profiles
- [ ] Navigation works correctly

---

**Happy coding! 🚀**

