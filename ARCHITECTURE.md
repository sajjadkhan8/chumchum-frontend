# ChumChum Frontend - Role-Based System Architecture

## 📋 Complete Feature List

### Authentication & Authorization
- [x] Role-based registration (CREATOR, BRAND)
- [x] Role-specific form fields during registration
- [x] Automatic profile creation after registration
- [x] Role stored in user state (Recoil)
- [x] Role-based access control in navigation

### User Roles & Data

#### CREATOR Profile Fields
```javascript
{
  user_id: UUID,
  bio: String,
  category: String,
  tiktok_url: String,
  instagram_url: String,
  youtube_url: String,
  followers: Number,
  avg_views: Number,
  engagement_rate: Number,
  rating: Number,
  total_reviews: Number
}
```

#### BRAND Profile Fields
```javascript
{
  user_id: UUID,
  company_name: String,
  website: String,
  industry: String,
  description: String
}
```

### Pages & Routes

#### Public Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Landing page |
| `/login` | Login | User authentication |
| `/register` | Register | Role-based registration |
| `/gig/:_id` | Gig | Service details |
| `/gigs` | Gigs | Service listing |
| `/creators` | Creators | Discover creators with search/filter |
| `/creator/:creatorId` | CreatorProfile | View creator profile |
| `/brand/:brandId` | BrandProfile | View brand profile |

#### Private Routes (Authenticated)
| Route | Component | Audience | Purpose |
|-------|-----------|----------|---------|
| `/dashboard` | Dashboard | Both | Role-specific dashboard |
| `/my-gigs` | MyGigs | Creator | My services |
| `/organize` | Add | Creator | Add new service |
| `/orders` | Orders | Both | View orders |
| `/messages` | Messages | Both | Messaging hub |
| `/message/:conversationID` | Message | Both | Chat interface |
| `/pay/:_id` | Pay | Buyer | Payment page |
| `/success` | Success | Buyer | Payment confirmation |

---

## 🎨 UI Components Overview

### Dashboards (Private)

#### CreatorDashboard Features
```
┌─────────────────────────────────────┐
│  Creator Dashboard                  │
├─────────────────────────────────────┤
│ Profile Section:                    │
│  ├─ Profile image (120x120px)      │
│  ├─ Username                        │
│  ├─ Category                        │
│  ├─ City                            │
│  └─ Stats Grid (2x2)                │
│      ├─ Followers                   │
│      ├─ Avg Views                   │
│      ├─ Engagement Rate             │
│      └─ Rating                      │
├─────────────────────────────────────┤
│ Bio Section:                        │
│  └─ Creator bio text                │
├─────────────────────────────────────┤
│ Social Links:                       │
│  ├─ TikTok (if available)          │
│  ├─ Instagram (if available)        │
│  └─ YouTube (if available)          │
├─────────────────────────────────────┤
│ Action Buttons:                     │
│  ├─ Edit Profile (green)            │
│  └─ View My Services (outlined)     │
└─────────────────────────────────────┘
```

#### BrandDashboard Features
```
┌─────────────────────────────────────┐
│  Brand Dashboard                    │
├─────────────────────────────────────┤
│ Profile Section:                    │
│  ├─ Logo/Image (120x120px)         │
│  ├─ Company Name                    │
│  ├─ Industry                        │
│  ├─ City                            │
│  └─ Website Link                    │
├─────────────────────────────────────┤
│ Description Section:                │
│  └─ Company description text        │
├─────────────────────────────────────┤
│ Contact Information:                │
│  ├─ Email                           │
│  ├─ Phone                           │
│  └─ City                            │
├─────────────────────────────────────┤
│ Action Buttons:                     │
│  ├─ Edit Profile (green)            │
│  └─ Find Creators (outlined)        │
└─────────────────────────────────────┘
```

### Profile Pages (Public)

#### CreatorProfile
- Large profile image (200x200px with green border)
- Creator name, category, city
- Statistics: followers, avg views, rating, reviews
- Bio section
- Social media links (clickable)
- Contact Creator button

#### BrandProfile
- Company logo (200x200px with green border)
- Company name, industry, city
- Website link
- About section
- Contact information
- Contact Brand button

### Discovery Page

#### Creators Directory (`/creators`)
```
┌─────────────────────────────────────┐
│  Discover Creators                  │
├─────────────────────────────────────┤
│ Header (gradient background)        │
├─────────────────────────────────────┤
│ Filters:                            │
│  ├─ Search Box (by name/category)  │
│  └─ Category Dropdown               │
├─────────────────────────────────────┤
│ Creator Cards Grid (auto-fill):     │
│  ┌──────────┐ ┌──────────┐          │
│  │ Image    │ │ Image    │          │
│  │ Username │ │ Username │          │
│  │ Category │ │ Category │          │
│  │ City     │ │ City     │          │
│  │ Stats    │ │ Stats    │          │
│  │ Bio      │ │ Bio      │          │
│  └──────────┘ └──────────┘          │
└─────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Registration Flow
```
User selects Role (CREATOR/BRAND)
        ↓
Fills Basic Info
    - username, email, password, phone, city, image
        ↓
Fills Role-Specific Info
    - Creator: bio, category, social URLs
    - Brand: company name, website, industry, description
        ↓
API: POST /api/auth/register
        ↓
Backend creates user + creates role-specific profile
        ↓
Success → Redirect to /login
```

### Login & Dashboard Flow
```
User logs in
        ↓
API: POST /api/auth/login
        ↓
User data + role stored in Recoil userState
        ↓
Navigate to /dashboard
        ↓
Dashboard component checks role
        ↓
Render Creator or Brand Dashboard
```

### Creator Discovery Flow
```
Brand user navigates to /creators
        ↓
API: GET /api/creators (list all)
        ↓
Display creators in grid
        ↓
User can:
    - Search by name/category
    - Filter by category
    - Click card to view profile
        ↓
View creator profile with contact option
```

---

## 🎨 Design System

### Colors
```
Primary Green: #1dbf73
Dark Green: #16a86f
Background: #f5f5f5
Text Dark: #333
Text Light: gray
Border: #ddd
```

### Typography
- Headings (h1): 32px, #1dbf73, bold
- Headings (h2): 24px, #333, bold
- Headings (h3): 18-20px, #333, bold
- Body: 16px, gray, regular
- Small: 13-14px, gray

### Spacing
- Sections: 30px padding
- Components: 20px gap
- Cards: 15px internal padding
- Elements: 10px gap

### Responsive Breakpoints
- Desktop: 1200px max-width
- Tablet: 768px breakpoint
- Mobile: < 480px, 600px breakpoints

---

## 📡 API Integration Points

### Required Endpoints

#### Auth Endpoints
```javascript
POST /api/auth/register
  Body: {
    username, email, password, role,
    phone, city, image,
    // For CREATOR:
    bio, category, tiktok_url, instagram_url, youtube_url
    // For BRAND:
    company_name, website, industry, description
  }
  Returns: { user: { id, username, email, role, ... } }

POST /api/auth/login
  Body: { username, password }
  Returns: { user: { id, username, email, role, ... } }

GET /api/auth/me
  Returns: { user: { ... } }

POST /api/auth/logout
  Returns: { message: "Logged out" }
```

#### Creator Endpoints
```javascript
GET /api/creators
  Returns: [ { id, user, bio, category, ... }, ... ]

GET /api/creators/:id
  Returns: { id, user, bio, category, followers, ... }

GET /api/creators/user/:userId
  Returns: { id, user, bio, category, ... }

POST /api/creators
  Body: { user_id, bio, category, tiktok_url, ... }
  Returns: { id, user_id, ... }

PUT /api/creators/:id
  Body: { bio, category, tiktok_url, ... }
  Returns: { id, ... }
```

#### Brand Endpoints
```javascript
GET /api/brands
  Returns: [ { id, user, company_name, industry, ... }, ... ]

GET /api/brands/:id
  Returns: { id, user, company_name, website, ... }

GET /api/brands/user/:userId
  Returns: { id, user, company_name, ... }

POST /api/brands
  Body: { user_id, company_name, website, industry, description }
  Returns: { id, user_id, ... }

PUT /api/brands/:id
  Body: { company_name, website, industry, description }
  Returns: { id, ... }
```

---

## 🛡️ Access Control

### Navbar Menu Items (Based on Role)

#### All Users (Logged In)
- Dashboard link
- Orders
- Messages
- Logout

#### CREATOR Users
- My Services (instead of My Gigs)
- Add New Service (instead of Add New Gig)

#### BRAND Users
- Find Creators

#### Public Menu
- ChumChum Business
- Explore Creators (new)
- English

---

## 📦 Component Structure

```
src/
├── pages/
│   ├── Auth/
│   │   └── Register/ (updated with role selection)
│   ├── Dashboard/
│   │   ├── Dashboard.jsx (router)
│   │   ├── CreatorDashboard/
│   │   └── BrandDashboard/
│   ├── Profile/
│   │   ├── CreatorProfile/
│   │   └── BrandProfile/
│   ├── Creators/
│   │   └── Creators.jsx (discovery)
│   └── index.js (exports all)
├── api/
│   ├── creatorApi.js (new)
│   ├── brandApi.js (new)
│   ├── authApi.js (updated)
│   └── index.js (updated exports)
├── components/
│   └── Navbar/ (updated with role-based menu)
└── App.jsx (updated routes)
```

---

## 🧪 Testing Scenarios

### Creator Registration
1. Click Register
2. Select "Creator" role
3. Fill in: username, email, password, phone, city, picture
4. Fill in: bio, category, social URLs
5. Submit
6. Verify user created with role='CREATOR'
7. Verify creator profile created
8. Login and verify dashboard shows CreatorDashboard

### Brand Registration
1. Click Register
2. Select "Brand" role
3. Fill in: username, email, password, phone, city, picture
4. Fill in: company name, website, industry, description
5. Submit
6. Verify user created with role='BRAND'
7. Verify brand profile created
8. Login and verify dashboard shows BrandDashboard

### Creator Discovery
1. Login as Brand
2. Click "Explore Creators"
3. Verify creators list loads
4. Search by name
5. Search by category
6. Filter by category
7. Click creator card
8. View full creator profile

### Profile Viewing
1. Visit /creator/:id (public)
2. Verify all creator data displays
3. Visit /brand/:id (public)
4. Verify all brand data displays

---

## ✨ Key Improvements

| Feature | Before | After |
|---------|--------|-------|
| User Types | Seller/Buyer toggle | Creator/Brand roles |
| Registration | Generic form | Role-specific forms |
| Dashboard | Single generic view | Role-specific dashboards |
| Profile | Basic profile | Rich role-specific profiles |
| Discovery | Just gigs | Creator directory |
| Navigation | Generic menu | Role-aware menu |
| Terminology | Gigs/Seller | Services/Creator/Brand |

---

## 🚀 Deployment Checklist

- [x] All routes configured
- [x] API endpoints ready for integration
- [x] Role-based access control implemented
- [x] Responsive design tested
- [x] Error handling in place
- [x] Loading states implemented
- [x] Form validation added
- [x] Navigation updated
- [x] Documentation complete
- [x] No hardcoded URLs
- [x] Proper state management

---

## 📝 Notes

- All "Fiverr" references replaced with "ChumChum"
- All "Gig" terminology changed to "Service"
- Consistent green theme (#1dbf73) throughout
- Mobile-first responsive design
- Accessibility improvements (alt text, buttons for interactions)
- Toast notifications for user feedback
- Loading states for better UX

---

**Status: ✅ PRODUCTION READY**

All components are functional and ready to integrate with Spring Boot backend.

