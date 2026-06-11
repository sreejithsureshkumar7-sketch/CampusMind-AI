# CampusMind AI Firebase Dashboard

AI + Data Analytics + Firebase combined college project.

## Features

- Dashboard first page la direct open aagum
- Student data website-la add / edit / delete panna mudiyum
- Code change panna thevai illa
- Firebase Firestore cloud database support
- LocalStorage fallback support
- Auto dashboard metrics
- Auto risk detection
- Placement readiness score
- Department analytics chart
- Top performance chart
- AI smart suggestions
- Search student data
- Export data as JSON
- Mobile responsive design

## GitHub Pages Upload

1. ZIP extract pannunga.
2. GitHub la new repository create pannunga: `CampusMind-AI`
3. Extract panna folder-la irukkura files upload pannunga:
   - index.html
   - style.css
   - app.js
   - README.md
   - firebase-rules-demo.txt
4. Settings -> Pages -> Deploy from branch -> main -> /(root) -> Save.
5. Link open pannunga:
   `https://YOUR_USERNAME.github.io/CampusMind-AI/`

## Firebase Setup

1. Go to Firebase Console.
2. Create Project.
3. Add Web App.
4. Copy Firebase config.
5. Firestore Database create pannunga.
6. Start in test mode for demo.
7. Website-la `Firebase Connect` click panni config paste pannunga.
8. Save & Connect click pannunga.

## Firestore Rules For Demo

Use `firebase-rules-demo.txt` content.

Important: Demo rules public-a irukkum. Real student details add panna koodathu. Real project ku Firebase Authentication add pannanum.

## Collection Name

Firestore collection name:

```txt
students
```

## Student Fields

- name
- regNo
- department
- year
- attendance
- marks
- skills
- communication
- projects
- updatedAt

## Next Upgrade Ideas

- Admin login using Firebase Authentication
- Role based access: admin / staff / student
- PDF report generator
- Excel import
- Attendance CSV upload
- AI chatbot with predefined project answers
- Email alerts for low attendance students
- Student profile page
