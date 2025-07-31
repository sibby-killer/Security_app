# Community Security Alert App (CSAA)

A comprehensive security incident management system for communities, featuring role-based access control, real-time notifications, and automated workflow management.

## 🚀 Features

### Core Functionality
- **Incident Reporting**: Residents can report security incidents with photos and location data
- **Real-time Notifications**: Instant alerts for new incidents and status updates
- **Interactive Map**: Visual representation of incidents across the community
- **Role-based Access**: Different interfaces for residents, security personnel, and administrators

### Enhanced Incident Management Workflow

#### 1. Incident Lifecycle
- **Reported**: Initial incident submission by residents
- **Assigned**: Admin/Super Admin assigns to security personnel
- **In Progress**: Security personnel actively handling the incident
- **Feedback Pending**: Security submits feedback, awaiting approval
- **Feedback Submitted**: Feedback submitted, pending reporter and admin approval
- **Feedback Approved**: Both reporter and admin have approved the feedback
- **Resolved**: Incident marked as completed
- **Closed**: Final status after resolution

#### 2. Role-based Permissions

**Residents:**
- Report new incidents
- View all incidents
- Receive notifications about their reports
- Approve security feedback for their incidents

**Security Personnel:**
- View assigned incidents
- Update incident status
- Submit feedback after handling incidents
- Track feedback approval status

**Admins & Super Admins:**
- Assign incidents to security personnel
- Approve security feedback
- Manage user roles and permissions
- View comprehensive analytics
- Manage all incidents and users

### Notification System
- **Real-time alerts** for new incidents
- **Status update notifications** for incident progress
- **Feedback approval requests** for reporters and admins
- **Assignment notifications** for security personnel

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Maps**: Leaflet.js

## 📋 Database Schema

### Core Tables
- `profiles`: User accounts with role-based access
- `incidents`: Security incident reports
- `incident_assignments`: Assignment history and tracking
- `incident_feedback`: Security personnel feedback system
- `incident_photos`: Photo attachments for incidents
- `comments`: Discussion and updates on incidents
- `notifications`: System-wide notification management
- `audit_logs`: Complete audit trail for all actions

### User Roles
- `resident`: Community members who can report incidents
- `security`: Security personnel who handle assigned incidents
- `admin`: Administrators who can assign incidents and approve feedback
- `super_admin`: Super administrators with full system access

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd community-safe-zone-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Configure storage buckets for incident photos

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📱 Usage Guide

### For Residents
1. **Report an Incident**
   - Navigate to "Report" in the main menu
   - Fill in incident details, location, and upload photos
   - Submit the report

2. **Track Your Reports**
   - View all incidents in the "Incidents" section
   - Receive notifications about status updates
   - Approve security feedback when notified

### For Security Personnel
1. **View Assigned Incidents**
   - Access the "Security Dashboard"
   - See all incidents assigned to you
   - Update status as you handle incidents

2. **Submit Feedback**
   - After handling an incident, submit detailed feedback
   - Wait for reporter and admin approval
   - Track approval status

### For Administrators
1. **Assign Incidents**
   - Access the "Admin Panel"
   - View unassigned incidents
   - Assign incidents to available security personnel

2. **Approve Feedback**
   - Review security personnel feedback
   - Approve or reject feedback submissions
   - Manage user roles and permissions

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the complete schema from `supabase/schema.sql`
3. Configure Row Level Security (RLS) policies
4. Set up storage buckets for file uploads
5. Configure authentication providers

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Features in Detail

### Incident Management Workflow
1. **Reporting**: Residents report incidents with details and photos
2. **Notification**: Admins and security receive instant notifications
3. **Assignment**: Admins assign incidents to security personnel
4. **Handling**: Security personnel update status and handle incidents
5. **Feedback**: Security submit detailed feedback after resolution
6. **Approval**: Reporter and admin approve the feedback
7. **Resolution**: Incident marked as resolved and closed

### Notification System
- **Real-time updates** via Supabase subscriptions
- **Role-based notifications** for different user types
- **Action-required notifications** for approvals
- **Email and push notification** support

### Security Features
- **Row Level Security (RLS)** on all database tables
- **Role-based access control** throughout the application
- **Audit logging** for all system actions
- **Secure file uploads** with proper validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Integration with external security systems
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] API for third-party integrations
