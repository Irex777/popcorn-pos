# 🍿 Popcorn POS
## Czech-First Restaurant Management System

*Modern, EU-compliant point-of-sale system designed specifically for Czech Republic restaurants*

---

## 🌟 **Overview**

Popcorn POS is a comprehensive restaurant management system built with modern web technologies and designed from the ground up for the Czech Republic market. It combines the power of a traditional POS system with advanced restaurant workflow management, EU compliance, and Czech-first localization.

### **Key Features**
- 🇨🇿 **Czech-First Design**: Default Czech language and CZK currency
- 🍽️ **Restaurant-Specific**: Table management, kitchen displays, menu modifiers
- 📊 **AI-Enhanced Analytics**: ML-based forecasting and business intelligence
- 💳 **Multi-Payment Support**: Stripe, cash, and local EU payment methods
- 🔒 **EU Compliant**: GDPR, VAT management, and local tax integration
- 📱 **Modern UI/UX**: Responsive design with React + TypeScript

---

## 🚀 **Quick Start**

### **Development Setup**
```bash
# Clone the repository
git clone <repository-url>
cd popcorn-pos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or use the provided deployment scripts
./start-debug.sh
```

### **Production Deployment**
See [`docs/DOCKER_DEPLOYMENT.md`](./docs/DOCKER_DEPLOYMENT.md) for complete deployment instructions using Coolify.

---

## 📚 **Documentation**

All comprehensive documentation is located in the [`docs/`](./docs/) folder:

- **[📊 Executive Summary](./docs/EXECUTIVE_SUMMARY.md)** - Business overview and market opportunity
- **[🇨🇿 Market Analysis](./docs/CZECH_RESTAURANT_MARKET_ANALYSIS.md)** - Czech restaurant market strategy  
- **[🚀 Features & Roadmap](./docs/FEATURES_AND_ROADMAP.md)** - Complete feature list and implementation plan
- **[🍽️ Restaurant Implementation](./docs/RESTAURANT_IMPLEMENTATION_GUIDE.md)** - 30-day enhancement guide
- **[🐳 Deployment Guide](./docs/DOCKER_DEPLOYMENT.md)** - Production deployment instructions

---

## 🏗️ **Architecture**

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with migrations
- **Authentication**: Passport.js sessions
- **Payments**: Stripe integration
- **Real-time**: WebSocket connections
- **Deployment**: Docker + Coolify

### **Project Structure**
```
popcorn-pos/
├── client/          # React frontend application
├── server/          # Node.js backend API
├── shared/          # Shared types and utilities
├── docs/           # Comprehensive documentation
├── migrations/     # Database schema migrations
├── scripts/        # Utility scripts
└── archive/        # Legacy/troubleshooting files
```

---

## 🎯 **Market Focus**

### **Target Markets**
- **Primary**: Czech Republic (45,000 restaurants)
- **Secondary**: Slovakia, Poland, Austria, Germany
- **Segments**: Fast casual, full service, cafés, pubs, food trucks

### **Competitive Advantages**
- ✅ Only POS system designed specifically for Czech restaurants
- ✅ Modern technology stack vs. legacy competitors
- ✅ 25% lower cost than premium alternatives
- ✅ Built-in EU compliance (VAT, GDPR, local regulations)
- ✅ Restaurant-specific workflows, not retrofitted retail POS

---

## 💰 **Business Opportunity**

- **Market Size**: €32M annual opportunity in Czech Republic
- **Revenue Target**: €4.9M ARR by Year 3
- **Customer Target**: 3,000 restaurants (7% market share)
- **Pricing**: 999-2,499 CZK/month per location

---

## 🛠️ **Development Status**

### **Current Features** ✅
- Complete restaurant POS interface
- Czech localization (200+ translation keys)
- Multi-location support
- Real-time analytics with ML forecasting
- Stripe payment processing
- Inventory and menu management
- User authentication and role management

### **30-Day Enhancement Plan** 🚧
- Table management system
- Kitchen display system
- EU compliance features
- Advanced restaurant analytics
- Staff management tools
- Mobile applications

---

## 🤝 **Contributing**

This project is currently in active development for the Czech restaurant market. For questions or collaboration opportunities, please refer to the documentation in [`docs/`](./docs/).

---

## 📄 **License**

Proprietary software designed for Czech Republic restaurant market.

---

*Popcorn POS - Transforming Czech restaurants through modern technology* 🇨🇿🍽️
