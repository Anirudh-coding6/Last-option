# ServiceLead Pro - AI-Powered Lead Management Platform

A comprehensive lead management platform for service-based businesses with AI-powered automation, smart scheduling, and analytics.

## 🚀 Features

### Core Features
- **Lead Capture & Management** - Capture leads from web forms with automatic storage
- **AI Lead Scoring** - Intelligent scoring system based on multiple factors
- **Appointment Scheduling** - Smart calendar integration with availability management
- **Analytics Dashboard** - Real-time insights and performance metrics
- **Review Automation** - Automated feedback collection and management
- **Dual User Interface** - Separate portals for customers and business owners

### AI-Powered Automation
- **Smart Lead Scoring** - Automatic lead prioritization (Hot/Warm/Cold)
- **Conversion Prediction** - AI algorithms predict lead conversion probability
- **Automated Follow-ups** - Intelligent reminder and follow-up systems
- **Performance Analytics** - Advanced reporting and insights

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling
- **Bootstrap 5** - UI Framework
- **JavaScript** - Client-side logic
- **Chart.js** - Data visualization
- **Font Awesome** - Icons

### Security & Performance
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Input Validation** - Joi validation
- **Morgan** - Request logging

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd servicelead-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp backend/.env.example .env
```

Edit `.env` file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/servicelead-pro
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas cloud service
```

5. **Start the application**
```bash
# Development mode
npm run server:dev

# Production mode
npm run server
```

6. **Access the application**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health

## 🏗 Project Structure

```
servicelead-pro/
├── backend/
│   ├── models/           # Database models
│   │   ├── Lead.js
│   │   ├── Customer.js
│   │   ├── Provider.js
│   │   └── Appointment.js
│   ├── routes/           # API routes
│   │   ├── leads.js
│   │   ├── auth.js
│   │   ├── appointments.js
│   │   ├── analytics.js
│   │   └── automation.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.js
│   └── server.js         # Main server file
├── public/               # Static files
│   ├── index.html        # Landing page
│   ├── dashboard.html    # Provider dashboard
│   ├── customer-portal.html # Customer portal
│   └── js/
│       └── dashboard.js  # Dashboard logic
├── package.json
├── .env
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/customer/register` - Customer registration
- `POST /api/auth/customer/login` - Customer login
- `POST /api/auth/provider/register` - Provider registration
- `POST /api/auth/provider/login` - Provider login
- `GET /api/auth/profile` - Get user profile

### Leads Management
- `POST /api/leads` - Create new lead (public)
- `GET /api/leads` - Get all leads (protected)
- `GET /api/leads/:id` - Get single lead
- `PATCH /api/leads/:id/status` - Update lead status
- `POST /api/leads/:id/interactions` - Add interaction
- `GET /api/leads/stats/overview` - Get lead statistics

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get appointments
- `GET /api/appointments/:id` - Get single appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `GET /api/appointments/slots/available` - Get available time slots

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/leads` - Lead analytics

### Automation
- `POST /api/automation/score-leads` - Trigger lead scoring
- `GET /api/automation/insights` - Get automation insights

## 🤖 AI Lead Scoring System

The platform includes an intelligent lead scoring system that evaluates leads based on:

### Scoring Factors
- **Form Submission Speed** (+3 points) - Quick form completion
- **Message Length** (+2 points) - Detailed project descriptions (>20 words)
- **Service Type** (+2 points) - High-value services (plumbing, electrical, HVAC, renovation)
- **Lead Source** (+1 point) - Referrals and Instagram leads
- **Instant Booking** (+1 point) - Immediate appointment scheduling
- **Follow-up Engagement** (+1 point) - Opening follow-up communications
- **Response Delay** (-2 points) - No response within 3 days
- **Invalid Contact** (-1 point) - Invalid email or phone format

### Score Categories
- **🔥 Hot (8-10 points)** - High conversion probability
- **🌤 Warm (5-7 points)** - Moderate conversion probability
- **❄ Cold (0-4 points)** - Low conversion probability

## 👥 User Roles

### Customers
- Submit service requests
- Track request status
- Schedule appointments
- View service history
- Provide reviews and feedback

### Service Providers
- Manage leads and conversions
- Schedule appointments
- Track business analytics
- Access AI insights
- Manage business profile

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt encryption
- **Rate Limiting** - API abuse prevention
- **Input Validation** - Joi schema validation
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - HTTP security headers

## 📊 Analytics & Reporting

### Dashboard Metrics
- Total leads and conversion rates
- Revenue tracking and forecasting
- Lead source analysis
- Service type performance
- Customer satisfaction ratings

### AI Insights
- Lead scoring distribution
- Conversion probability predictions
- Automated recommendations
- Performance optimization suggestions

## 🚀 Deployment

### Local Development
```bash
npm run server:dev
```

### Production Deployment
1. Set environment variables
2. Configure MongoDB connection
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Start application:
```bash
npm start
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/servicelead-pro
JWT_SECRET=your-production-secret
PORT=3000
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Email: support@serviceleadpro.com
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- AI lead scoring system
- Dual user interfaces
- Complete CRUD operations
- Analytics dashboard
- Appointment scheduling

---

Built with ❤️ for service professionals