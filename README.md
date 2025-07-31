# Community Safe Zone 🛡️

> **A comprehensive security incident management system for communities**

**Developed by Group Six** | React + TypeScript + Supabase

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.53.0-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## Overview

Community Safe Zone is a modern, role-based security incident management system designed to enhance community safety through real-time incident reporting, automated workflow management, and comprehensive analytics.

### 🎯 Key Objectives
- **Enhance Community Safety**: Provide residents with easy incident reporting
- **Streamline Security Operations**: Automate incident assignment and tracking
- **Improve Response Times**: Real-time notifications and status updates
- **Ensure Accountability**: Comprehensive audit trail and feedback system

---

## ✨ Features

### 🔐 Role-Based Access Control
- **Residents**: Report incidents, track status, approve feedback
- **Security Personnel**: Handle assigned incidents, submit feedback
- **Administrators**: Manage assignments, approve feedback, user management
- **Super Admins**: Full system access and analytics

### 📱 Core Functionality
- **Incident Reporting**: Photo uploads, location tracking, detailed descriptions
- **Real-time Notifications**: Instant alerts for all stakeholders
- **Interactive Map**: Visual incident tracking across the community
- **Workflow Management**: Automated incident lifecycle from report to resolution
- **Feedback System**: Multi-level approval process for incident resolution

### 🔄 Incident Lifecycle
```
Reported → Assigned → In Progress → Feedback Pending → 
Feedback Submitted → Feedback Approved → Resolved → Closed
```

### 📊 Advanced Features
- **Real-time Updates**: Live status changes and notifications
- **File Management**: Secure photo uploads and storage
- **Audit Logging**: Complete action history for compliance
- **Analytics Dashboard**: Comprehensive reporting and insights

---

## 🛠️ Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** | React + TypeScript | 18.3.1 |
| **Build Tool** | Vite | 5.4.1 |
| **UI Framework** | Shadcn/ui + Tailwind CSS | Latest |
| **Backend** | Supabase (PostgreSQL) | 2.53.0 |
| **Authentication** | Supabase Auth | Built-in |
| **Real-time** | Supabase Subscriptions | Built-in |
| **Maps** | Leaflet.js | Latest |
| **State Management** | TanStack Query | 5.56.2 |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sibby-killer/Security_app.git
   cd community-safe-zone-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create environment file
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   vite_supabase_url=your_supabase_project_url
   vite_supabase_anon_key=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql`
3. Configure Row Level Security (RLS) policies
4. Set up storage buckets for file uploads
5. Configure authentication providers

---

## 📁 Project Structure

```
community-safe-zone-main/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Application pages
│   ├── integrations/       # External service integrations
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── supabase/               # Database schema and migrations
├── docs/                   # Documentation
└── scripts/                # Build and deployment scripts
```

---

## 🎨 UI Components

Built with **Shadcn/ui** and **Tailwind CSS** for a modern, accessible design:

- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Theme switching capability
- **Accessibility**: WCAG compliant components
- **Custom Components**: Tailored for security workflows

---

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Permissions**: Granular user access control
- **Audit Logging**: Complete action history
- **Secure File Uploads**: Validated and sanitized uploads
- **Environment Variables**: Secure credential management

---

## 📊 Database Schema

### Core Tables
- `profiles` - User accounts and roles
- `incidents` - Security incident reports
- `incident_assignments` - Assignment tracking
- `incident_feedback` - Security feedback system
- `incident_photos` - Photo attachments
- `comments` - Incident discussions
- `notifications` - System notifications
- `audit_logs` - Complete audit trail

---

## 🤝 Contributing

We welcome contributions from the community! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation as needed
- Follow the existing code style

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/sibby-killer/Security_app/issues)
- **Documentation**: Check the `/docs` folder
- **Team**: Contact Group Six development team

---

## 🔮 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with external security systems
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] API for third-party integrations
- [ ] Machine learning for incident prediction

---

## 👥 Group Six Team

**Developed by Group Six** - A collaborative effort to create safer communities through innovative technology.

---

<div align="center">

**Made with ❤️ by Group Six**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/sibby-killer/Security_app)

</div>
