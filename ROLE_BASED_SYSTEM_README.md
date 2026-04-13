# ChumChum Role-Based System Implementation

## Overview
The frontend has been successfully updated to support a role-based user system with two main roles:
- **CREATOR**: Users who provide services/content for brands
- **BRAND**: Users who hire creators for collaborations

This implementation follows the Collabstr model and integrates with the Spring Boot backend database structure.

---

## New Files Created

### API Layer (`src/api/`)
1. **creatorApi.js** - Creator profile endpoints
2. **brandApi.js** - Brand profile endpoints

### Pages & Dashboards (`src/pages/`)

#### Dashboard System
- **Dashboard/Dashboard.jsx** - Role-based dashboard router
- **Dashboard/CreatorDashboard/CreatorDashboard.jsx** - Creator-specific dashboard with stats
- **Dashboard/CreatorDashboard/CreatorDashboard.scss** - Creator dashboard styles
- **Dashboard/BrandDashboard/BrandDashboard.jsx** - Brand-specific dashboard
- **Dashboard/BrandDashboard/BrandDashboard.scss** - Brand dashboard styles

#### Profile Pages
- **Profile/CreatorProfile/CreatorProfile.jsx** - Public creator profile view
- **Profile/CreatorProfile/CreatorProfile.scss** - Creator profile styles
- **Profile/BrandProfile/BrandProfile.jsx** - Public brand profile view
- **Profile/BrandProfile/BrandProfile.scss** - Brand profile styles

#### Discovery
- **Creators/Creators.jsx** - Creators discovery/search page
- **Creators/Creators.scss** - Creators listing styles

---

## Modified Files

### Updated Components
1. **src/components/Navbar/Navbar.jsx**
   - Added role-based menu items in user dropdown
   - Added "Explore Creators" link
   - Updated navigation links for CREATOR vs BRAND roles
   - Changed "My Gigs" → "My Services"
   - Changed "Add New Gig" → "Add New Service"

### Updated Auth Pages
1. **src/pages/Auth/Register/Register.jsx**
   - Added role selection (CREATOR or BRAND radio buttons)
   - Creator-specific fields:
     - Bio
     - Category
     - TikTok URL
     - Instagram URL
     - YouTube URL
   - Brand-specific fields:
     - Company Name
     - Website
     - Industry
     - Description
   - Automatic profile creation after registration

2. **src/pages/Auth/Register/Register.scss**
   - New role selector button styles
   - Role-specific form section styles
   - Improved responsive design

### API Exports
1. **src/api/index.js**
   - Exported new creator API functions
   - Exported new brand API functions

### Pages Index
1. **src/pages/index.js**
   - Added Dashboard export
   - Added CreatorProfile export
   - Added BrandProfile export
   - Added Creators export

### Router Configuration
1. **src/App.jsx**
   - Added `/dashboard` route (private)
   - Added `/creator/:creatorId` route (public)
   - Added `/brand/:brandId` route (public)
   - Added `/creators` route (public)
   - Imported new page components

---

## New Routes

| Path | Component | Auth Required | Description |
|------|-----------|---------------|-------------|
| `/register` | Register | No | Updated registration with role selection |
| `/dashboard` | Dashboard | Yes | Role-based dashboard |
| `/creators` | Creators | No | Discover creators (search/filter) |
| `/creator/:creatorId` | CreatorProfile | No | View creator profile |
| `/brand/:brandId` | BrandProfile | No | View brand profile |
| `/my-gigs` | MyGigs | Yes | Creator services (renamed) |
| `/organize` | Add | Yes | Add new service (renamed) |

---

## Backend Integration

### Database Tables Used
1. **users** - Main user table with role field
2. **creators** - Creator-specific profile data
3. **brands** - Brand-specific profile data

### API Endpoints Expected (Spring Boot)

#### Auth
- `POST /api/auth/register` - Register new user (with role)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

#### Creators
- `GET /api/creators` - List all creators
- `GET /api/creators/:id` - Get creator by ID
- `GET /api/creators/user/:userId` - Get creator by user ID
- `POST /api/creators` - Create creator profile
- `PUT /api/creators/:id` - Update creator profile

#### Brands
- `GET /api/brands` - List all brands
- `GET /api/brands/:id` - Get brand by ID
- `GET /api/brands/user/:userId` - Get brand by user ID
- `POST /api/brands` - Create brand profile
- `PUT /api/brands/:id` - Update brand profile

---

## User Flow

### Creator Registration Flow
1. User clicks "Register"
2. Selects "Creator" role
3. Fills in basic info (username, email, password, phone, city, profile picture)
4. Fills in creator-specific info (bio, category, social URLs)
5. Submits registration
6. System creates user with role='CREATOR' and creates creator profile
7. Redirects to login
8. After login, user can access Creator Dashboard

### Brand Registration Flow
1. User clicks "Register"
2. Selects "Brand" role
3. Fills in basic info (username, email, password, phone, city, profile picture)
4. Fills in brand-specific info (company name, website, industry, description)
5. Submits registration
6. System creates user with role='BRAND' and creates brand profile
7. Redirects to login
8. After login, user can access Brand Dashboard

### Creator Discovery (Brand View)
1. Brand user navigates to "/creators"
2. Can search creators by username or category
3. Can filter by category
4. Clicks on creator card to view full profile
5. Can contact creator or view social links

---

## Styling & Theme

### Color Scheme (Maintained)
- Primary Green: `#1dbf73`
- Dark Green: `#16a86f`
- Background: `#f5f5f5`
- Text: `#333` (dark), `gray` (secondary)
- Border: `#ddd`, `rgb(216, 214, 214)`

### Responsive Design
- Mobile: Adjusted grid layouts for screens < 768px
- Tablet: Optimized spacing and font sizes
- Desktop: Full-featured layouts

---

## State Management

### Recoil Atoms
- **userState** - Updated to store role field
- User object now includes:
  - `id` - UUID
  - `username` - Username
  - `email` - Email
  - `role` - 'CREATOR', 'BRAND', or 'ADMIN'
  - `image` - Profile picture URL
  - `city` - User's city
  - `phone` - Phone number
  - `is_active` - Account status

---

## Key Features

### Creator Dashboard
- Profile image and stats (followers, avg views, engagement, rating)
- Bio section
- Social media links display
- Edit profile button
- View my services button

### Brand Dashboard
- Company logo/image
- Company info (name, industry, website)
- Contact information
- About brand section
- Edit profile button
- Find creators button

### Creator Profile (Public View)
- Profile image, stats, rating
- Bio and social presence
- Contact creator button
- View engagement metrics

### Brand Profile (Public View)
- Company image, info, website
- Company description
- Contact information
- Contact brand button

### Creators Discovery Page
- Search by username/category
- Filter by category
- Creator cards with preview info
- Responsive grid layout

---

## Future Enhancements

1. **Edit Profile Pages** - Allow users to edit their profiles
2. **Messaging System** - Direct messaging between creators and brands
3. **Portfolio/Work Samples** - Showcase creator past work
4. **Pricing & Packages** - Creator pricing tiers
5. **Review/Rating System** - Brands can review creators
6. **Collaboration Requests** - Brands can send collaboration proposals
7. **Analytics** - View campaign performance
8. **Admin Dashboard** - Moderate creators and brands

---

## Testing Checklist

- [ ] Register as Creator role
- [ ] Register as Brand role
- [ ] Creator Dashboard displays correctly
- [ ] Brand Dashboard displays correctly
- [ ] View creator profile
- [ ] View brand profile
- [ ] Search creators on creators page
- [ ] Filter creators by category
- [ ] Navbar shows role-based menu items
- [ ] Links work correctly
- [ ] Mobile responsiveness
- [ ] Form validation (phone number, required fields)
- [ ] Image upload functionality
- [ ] City dropdown works
- [ ] Social media URL validation

---

## Notes

- All hardcoded "Fiverr" references have been replaced with "ChumChum"
- "Freelancer/Seller" terminology updated to "Creator"
- "Gigs" terminology updated to "Services"
- Maintained consistent green theme (#1dbf73) throughout
- All forms include proper validation
- API error handling via toast notifications
- Loading states implemented
- Proper role-based access control in Navbar

---

## Environment Variables Required

Ensure `.env` file contains:
```
VITE_API_BASE_URL=http://localhost:8080
```

---

## Installation & Setup

1. Install dependencies: `npm install`
2. Ensure `.env` file is configured
3. Start dev server: `npm run dev`
4. Backend should be running on http://localhost:8080

---

