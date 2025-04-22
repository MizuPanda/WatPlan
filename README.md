# WatPlan

[![Expo](https://img.shields.io/badge/Expo-20232A?logo=expo&logoColor=white)](https://expo.dev) [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **WatPlan** is an open-source, cross-platform app designed to help University of Waterloo students manage their class schedules, track grades & assignments, monitor degree progress, and view transcripts—all in one place.

---

## 🎯 Features

- **Schedule Builder**: Create and manage multiple schedules per term
- **Course Management**: Add courses with meeting days, times, and details
- **Grade Tracker**: Log grades per course and monitor GPA over time
- **Assignment Tracker**: Track homework with due dates and completion status
- **Degree Progress**: View overall program requirements and unofficial transcripts
- **Cross-Platform**: Runs on Android, iOS, and Web via Expo

---

## 🛠 Tech Stack

- **Frontend**: Expo (React Native) with TypeScript  
- **Backend**: Supabase (PostgreSQL, Auth, Storage)  
- **Routing**: React Navigation  
- **Environment Variables**: 🗝️ `react-native-dotenv`

---

## 🚀 Getting Started

Follow these steps to get WatPlan running locally.

### 1. Clone the repository

```bash
git clone git@github.com:MizuPanda/WatPlan.git
cd WatPlan
```

### 2. Install dependencies

```bash
npm install
# or
# yarn install
```

### 3. Setup environment variables

Create a `.env` file in the project root with the following:

```env
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

> **Note:** The `.env` file is already added to `.gitignore` to keep your keys safe.

### 4. Run the app

```bash
npx expo start
```

- Press **w** to open in your browser (Web)  
- Scan the QR code with Expo Go for Android/iOS

---

## 🗄 Database Setup

Head to the Supabase SQL Editor (e.g., `https://app.supabase.com/<YOUR_ORG>/<YOUR_PROJECT>/sql`) and run the schema below:

Feel free to adjust or extend this schema as needed.

---

## 🤝 Contributing

We love contributions! Please read our [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details on:

- Reporting bugs  
- Suggesting new features  
- Code style & testing  
- Pull request process

---

## 📸 Screenshots

*(![Schedule View](docs/screenshots/schedule.png)  
![Grades View](docs/screenshots/grades.png) )*

*(Place your own screenshots in `docs/screenshots/`)*

---

## 🛡 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## 📈 Project Status

Active development. We welcome suggestions and community support to help make WatPlan even better!