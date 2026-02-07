# 🎮 GangBro - Features Documentation

> 📖 **สรุป Features ทั้งหมดของ Project พร้อมอธิบายการทำงานของโค้ดอย่างเป็นกันเอง**

---

## 📋 สารบัญ (Table of Contents)

1. [🔐 ระบบ Authentication (Login/Register)](#-ระบบ-authentication-loginregister)
2. [🏠 หน้า Home - Command Center](#-หน้า-home---command-center)
3. [📜 ระบบ Missions - Mission Hub](#-ระบบ-missions---mission-hub)
4. [💬 ระบบ Real-time Chat](#-ระบบ-real-time-chat)
5. [🔔 ระบบ Notifications](#-ระบบ-notifications)
6. [👤 หน้า Profile](#-หน้า-profile)
7. [🧭 Navbar และ Navigation](#-navbar-และ-navigation)
8. [🛠️ Services สำคัญ](#️-services-สำคัญ)

---

## 🔐 ระบบ Authentication (Login/Register)

### 📍 ไฟล์ที่เกี่ยวข้อง
- `src/app/login/login.ts` - Component หลัก
- `src/app/_service/passport-service.ts` - จัดการ Authentication

### 🎯 Features หลัก

#### **1. Login (เข้าสู่ระบบ)**
```typescript
// หลังจาก User กรอก username + password แล้วกด Submit
async onSubmit(): Promise<void> {
  // เช็คว่า form valid ไหม ถ้าไม่ก็ mark ทุก field เป็น touched (แสดง error)
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  // เรียก PassportService เพื่อ Login
  const error = await this._passportService.login(this.form.value);
  
  // ถ้าไม่มี error ก็ redirect ไปหน้า profile เลย
  if (!this.errorFromServer()) {
    this._routerService.navigate(['/profile']);
  }
}
```



#### **2. Register (สมัครสมาชิก)**
```typescript
toggleMode(): void {
  this.mode = this.mode === 'login' ? 'register' : 'login'
  this.updateFormState()
}
```

เมื่อ toggle ไป register mode ระบบจะเพิ่ม field ดังนี้:
- `confirm_password` - ยืนยันรหัสผ่าน
- `display_name` - ชื่อที่แสดง
- **Password Validation ที่เข้มงวดขึ้น** (ต้องมีตัวใหญ่, ตัวเล็ก, ตัวเลข, อักขระพิเศษ)

#### **3. PassportService - จัดการ Session**
```typescript
// เก็บข้อมูล User ไว้ใน Local Storage
private savePassportToLocalStorage() {
  const passport = this.data()
  if (!passport) return
  const jsonString = JSON.stringify(passport)
  localStorage.setItem(this._key, jsonString)
  this.isSignin.set(true)
}

// โหลด session กลับมาเมื่อเปิด app ใหม่
private loadPassportFormLocalStorage(): string | null {
  const jsonString = localStorage.getItem(this._key)
  // ... parse และ set data
}
```

**💡 อธิบายแบบง่ายๆ:** เหมือนเราเก็บบัตรสมาชิกไว้ในกระเป๋า (localStorage) พอกลับมาร้านอีกครั้ง ก็หยิบบัตรมาให้พนักงานดู ไม่ต้อง login ใหม่!

---

## 🏠 หน้า Home - Command Center

### 📍 ไฟล์ที่เกี่ยวข้อง
- `src/app/home/home.ts` - Component หลัก
- `src/app/_service/system-service.ts` - ดึง Statistics

### 🎯 Features หลัก

#### **1. Real-time Clock**
```typescript
private updateTime(): void {
  const date = new Date();
  let h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  
  // แปลงเป็น 12-hour format พร้อม AM/PM
  if (h >= 12) {
    am = "PM";
    if (h > 12) h = h - 12;
  }
  
  // Update signals ทุกวินาที
  this.hours.set(h < 10 ? "0" + h : "" + h);
  this.minutes.set(m < 10 ? "0" + m : "" + m);
  this.seconds.set(s < 10 ? "0" + s : "" + s);
}
```

**💡 อธิบาย:** นาฬิกาจะ update ทุก 1 วินาที ด้วย `setInterval` ทำให้หน้า Home ดูมีชีวิตชีวา

#### **2. Site Statistics**
```typescript
async loadStats() {
  const stats = await this._system.getStats();
  this.activeMembers.set(stats.active_members);      // จำนวนสมาชิก
  this.missionsCompleted.set(stats.missions_completed);  // missions ที่เสร็จ
  this.opsSuccessRate.set(Number(stats.success_rate.toFixed(1)));  // อัตราความสำเร็จ
}
```

#### **3. Reveal Animation (Intersection Observer)**
```typescript
private setupRevealObserver() {
  this.observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');  // เพิ่ม animation class
      }
    });
  }, { threshold: 0.05 });
  
  // observe ทุก element ที่มี class .reveal
  const revealElements = this.el.nativeElement.querySelectorAll('.reveal');
  revealElements.forEach((el: HTMLElement) => this.observer?.observe(el));
}
```

**💡 อธิบาย:** ใช้ Intersection Observer ตรวจจับว่า element เข้ามาใน viewport หรือยัง ถ้าเข้ามาแล้วก็เพิ่ม animation ทำให้ scroll แล้ว elements ค่อยๆ โผล่มา สวยงาม! ✨

---

## 📜 ระบบ Missions - Mission Hub

### 📍 ไฟล์ที่เกี่ยวข้อง
- `src/app/missions/missions.ts` - หน้า Mission Lobby
- `src/app/about-mission/about-mission.ts` - หน้ารายละเอียด Mission
- `src/app/_service/mission-service.ts` - API calls

### 🎯 Features หลัก

#### **1. ดูรายการ Missions (Mission Lobby)**
```typescript
async loadMyMission(silent = false) {
  // ดึง missions ทั้งหมดจาก API
  const allMissions = await this._mission.getByFilter(this.filter)

  // ดึง missions ที่เราเข้าร่วมอยู่
  let myJoinedMissionIds: number[] = []
  if (this.isSignin()) {
    const myJoined = await this._mission.getMyMissions()
    myJoinedMissionIds = myJoined.map(m => m.id)
  }

  // Filter: แสดงเฉพาะ missions ที่เราไม่ได้เข้าร่วม + missions ที่ Completed/Failed
  const filtered = allMissions.filter(m => {
    if (m.status === 'Completed' || m.status === 'Failed') return true;
    return !myJoinedMissionIds.includes(m.id)
  })
  
  this._missionsSubject.next(filtered)
}
```

**💡 อธิบาย:** Mission Lobby จะแสดงเฉพาะ missions ที่เรายังไม่ได้เข้าร่วม ป้องกันไม่ให้เข้าร่วมซ้ำ!

#### **2. สร้าง Mission ใหม่**
```typescript
onAdd() {
  // เปิด Dialog สำหรับสร้าง Mission
  const dialogRef = this._dialog.open(NewMission)
  
  dialogRef.afterClosed().subscribe(async (result: AddMission) => {
    if (result) {
      // เรียก API สร้าง Mission
      const missionId = await this._mission.add(result)
      
      // Redirect ไปหน้า Mission Details
      this._router.navigate(['/about-mission', missionId]);
    }
  })
}
```

#### **3. เข้าร่วม Mission (Join)**
```typescript
async onJoin(missionId: number) {
  // เปิด Confirm Dialog ก่อน
  const ref = this._dialog.open(ConfirmDialog, {
    data: {
      title: 'JOIN OPERATION',
      message: 'Do you want to enlist in this mission?',
      confirmText: 'ENLIST',
      type: 'info'
    }
  });

  ref.afterClosed().subscribe(async (res) => {
    if (res) {
      await this._mission.join(missionId)  // เรียก API join
      this._router.navigate(['/about-mission', missionId]);  // ไปหน้า details
    }
  });
}
```

#### **4. Auto-Polling (อัพเดทอัตโนมัติ)**
```typescript
private startPolling() {
  this._ngZone.runOutsideAngular(() => {
    this._pollingHandle = setInterval(() => {
      this.loadMyMission(true)  // silent load ทุก 10 วินาที
    }, 10000)
  })
}
```

**💡 อธิบาย:** Mission list จะ refresh ทุก 10 วินาที แบบเงียบๆ (ไม่แสดง loading) ทำให้เห็น missions ใหม่ทันที!

#### **5. Mission Status Lifecycle**
```
Open → InProgress → Completed/Failed
  ↑        ↓
  └── (only Chief can change status)
```

- `Open` - Mission เปิดรับสมาชิก
- `InProgress` - กำลังดำเนินการ
- `Completed` - สำเร็จ ✅
- `Failed` - ล้มเหลว ❌

---

## 💬 ระบบ Real-time Chat

### 📍 ไฟล์ที่เกี่ยวข้อง
- `src/app/about-mission/about-mission.ts` - Chat UI + WebSocket

### 🎯 Features หลัก

#### **1. WebSocket Connection**
```typescript
startWebSocket() {
  // สร้าง URL สำหรับ WebSocket
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${window.location.host}/ws/chat/${missionId}`;
  
  this.ws = new WebSocket(wsUrl);
  
  this.ws.onmessage = (event) => {
    // เมื่อได้รับข้อความใหม่
    const data = JSON.parse(event.data);
    this._ngZone.run(() => {
      this.updateMessages([...this.chatMessages(), data]);
      this.scrollToBottom();
    });
  };
  
  this.ws.onclose = () => {
    // Fallback: ถ้า WS หลุด ใช้ polling แทน
    this.addSystemMessage('Real-time connection lost. Falling back to polling.');
    this.startPolling();
  };
}
```

**💡 อธิบาย:** Chat ใช้ WebSocket เป็นหลัก ทำให้ได้รับข้อความแบบ instant! ถ้า WS หลุด ระบบจะ fallback ไปใช้ polling (ดึงข้อมูลทุก 5 วินาที)

#### **2. ส่งข้อความ**
```typescript
async sendMessage() {
  const msg = this.newMessage().trim();
  if (!msg || !this.isCrewMember()) return;

  // ส่งผ่าน API
  await this._missionService.sendChatMessage(this.missionId, msg);
  
  // Clear input
  this.newMessage.set('');
}
```

#### **3. Duplicate Message Prevention**
```typescript
updateMessages(messages: any[]) {
  // ใช้ Map เพื่อ deduplicate ตาม message id
  const msgMap = new Map();
  [...this.chatMessages(), ...messages].forEach(m => {
    if (m.id) msgMap.set(m.id, m);
  });
  
  // Sort by timestamp
  const sorted = Array.from(msgMap.values())
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
  this.chatMessages.set(sorted);
}
```

**💡 อธิบาย:** ป้องกันข้อความซ้ำ! โดยใช้ Map เก็บ messages ด้วย id เป็น key ถ้า id ซ้ำก็จะ overwrite ไม่เพิ่มใหม่

---

## 🔔 ระบบ Notifications

### 📍 ไฟล์ที่เกี่ยวข้อง
- `src/app/_service/notification-service.ts` - Logic หลัก
- `src/app/navbar/navbar.ts` - แสดง notification badge

### 🎯 Features หลัก

#### **1. Auto-Polling for Updates**
```typescript
private startPolling() {
  this._ngZone.runOutsideAngular(() => {
    this._pollingHandle = setInterval(() => {
      this.checkForUpdates();
    }, 15000);  // เช็คทุก 15 วินาที
  });
}
```

#### **2. ตรวจจับ Missions ใหม่**
```typescript
// เปรียบเทียบ missions ปัจจุบันกับ snapshot ก่อนหน้า
if (this._lastMissions.length > 0) {
  const newMissions = allMissions.filter(m =>
    m.status === 'Open' &&
    !this._lastMissions.some(lm => lm.id === m.id) &&
    m.chief_id !== passport.user_id  // ไม่แจ้งเตือน missions ที่เราสร้างเอง
  );

  newMissions.forEach(m => {
    this.addNotification({
      title: 'NEW MISSION AVAILABLE',
      message: `Operation ${m.name} is now open for enlisting.`,
      type: 'info'
    });
  });
}
```

#### **3. ตรวจจับ Status Changes**
```typescript
myMissions.forEach(m => {
  const prev = this._lastMyMissions.find(pm => pm.id === m.id);
  
  if (prev && prev.status !== m.status) {
    let title = 'MISSION UPDATE';
    let type = 'info';

    if (m.status === 'InProgress') {
      title = 'MISSION STARTED';
      type = 'warning';
    } else if (m.status === 'Completed') {
      title = 'MISSION ACCOMPLISHED';
      type = 'success';
    } else if (m.status === 'Failed') {
      title = 'MISSION FAILED';
      type = 'error';
    }

    this.addNotification({ title, message: `Operation ${m.name} is now ${m.status}.`, type });
  }
});
```

#### **4. Browser Notifications**
```typescript
addNotification(notif: Partial<Notification>) {
  // ... add to list
  
  // ส่ง Browser Notification ด้วย (ถ้า user อนุญาต)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(newNotif.title, { body: newNotif.message });
  }
}
```

**💡 อธิบาย:** ระบบจะแจ้งเตือนทั้งใน app และ browser notification (popup เด้งมาที่ desktop) สุดเท่!

---

## 👤 หน้า Profile

### 📍 ไฟล์ที่เกี่ยวข้อง
- `src/app/profile/profile.ts` - Component หลัก
- `src/app/_dialogs/upload-img/upload-img.ts` - Upload Avatar

### 🎯 Features หลัก

#### **1. Mission Statistics**
```typescript
// แบ่ง missions ตาม status
historyMissions = computed(() => 
  this.missions().filter(m => m.status === 'Completed' || m.status === 'Failed')
)

historyCount = computed(() => this.historyMissions().length)
completedCount = computed(() => this.missions().filter(m => m.status === 'Completed').length)
failedCount = computed(() => this.missions().filter(m => m.status === 'Failed').length)
openCount = computed(() => this.missions().filter(m => m.status === 'Open').length)
inProgressCount = computed(() => this.missions().filter(m => m.status === 'InProgress').length)
```

**💡 อธิบาย:** ใช้ `computed()` signal ทำให้ statistics อัพเดทอัตโนมัติเมื่อ missions เปลี่ยน!

#### **2. Avatar Upload**
```typescript
openDialog() {
  const ref = this._dialog.open(UploadImg)
  
  ref.afterClosed().subscribe(async file => {
    if (file) {
      const error = await this._user.uploadAvatarImg(file)
      // Avatar จะถูก upload ไป Cloudinary แล้วเก็บ URL กลับมา
    }
  })
}
```

---

## 🧭 Navbar และ Navigation

### 📍 ไฟล์ที่เกี่ยวข้อง
- `src/app/navbar/navbar.ts` - Component หลัก
- `src/app/app.routes.ts` - Route definitions

### 🎯 Features หลัก

#### **1. แสดง Notification Badge**
```typescript
notifications = this._notification.notifications  // รายการ notifications
unreadCount = this._notification.unreadCount       // จำนวนที่ยังไม่ได้อ่าน
```

#### **2. Logout**
```typescript
logout() {
  this._passport.destroy()  // ลบ session จาก localStorage
  this._router.navigate(['/login'])
}
```

#### **3. Routes Structure**
```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'missions', component: Missions, canActivate: [AuthGuard] },
  { path: 'about-mission/:id', component: AboutMission, canActivate: [AuthGuard] },
  { path: 'profile', component: Profile, canActivate: [AuthGuard] },
  { path: 'about-us', component: AboutUs },
  { path: '**', component: NotFound }  // 404
];
```

**💡 อธิบาย:** หน้าที่ต้อง login (missions, profile, about-mission) จะมี `AuthGuard` คอยตรวจสอบ ถ้าไม่ได้ login จะถูก redirect ไปหน้า login

---

## 🛠️ Services สำคัญ

### **1. MissionService** (`mission-service.ts`)
| Method | Description |
|--------|-------------|
| `getByFilter()` | ดึง missions ตาม filter (search, category, status) |
| `getById()` | ดึง mission เดียวตาม id |
| `getRoster()` | ดึงรายชื่อ crew ของ mission |
| `getChatMessages()` | ดึงข้อความ chat ทั้งหมด |
| `sendChatMessage()` | ส่งข้อความ chat |
| `add()` | สร้าง mission ใหม่ |
| `join()` | เข้าร่วม mission |
| `leave()` | ออกจาก mission |
| `start()` | เริ่ม mission (Open → InProgress) |
| `complete()` | Mission สำเร็จ (InProgress → Completed) |
| `fail()` | Mission ล้มเหลว (InProgress → Failed) |
| `delete()` | ลบ mission |

### **2. PassportService** (`passport-service.ts`)
| Method | Description |
|--------|-------------|
| `login()` | เข้าสู่ระบบ |
| `register()` | สมัครสมาชิก |
| `destroy()` | ออกจากระบบ |
| `saveAvatarImgUrl()` | บันทึก Avatar URL ใหม่ |

### **3. NotificationService** (`notification-service.ts`)
| Method | Description |
|--------|-------------|
| `addNotification()` | เพิ่ม notification ใหม่ |
| `markAsRead()` | อ่าน notification แล้ว |
| `markAllAsRead()` | อ่านทั้งหมดแล้ว |
| `clearAll()` | ล้าง notifications ทั้งหมด |

---

## 🚀 Backend (Rust Server)

## 🛠️ Project Tech Stack & Gear

### 🏗️ CORE_STACK
- **Frontend:** Angular 21 (v19/v20+)
- **Backend:** Rust (Axum Web Framework)
- **Database:** PostgreSQL (via Supabase)
- **Real-time:** WebSockets & Polling fallback

### 🔧 DEV_ENVIRONMENT
- **VS Code:** IDE หลักที่ใช้พัฒนา
- **Antigravity AI:** ตัวช่วยจัดการ Codebase และพัฒนาระบบ
- **Infrastructure:** Docker + Render Deployment

### 🧠 AI_INTELLIGENCE
- **Gemini 3 Pro:** พลังสมองหลักในการวิเคราะห์และแก้ปัญหา
- **Claude (Sonnet 4.5):** ตัวช่วยขัดเกลา Logic และสถาปัตยกรรมโค้ด

### API Structure
```
/api
├── /authentication
│   └── POST /login
├── /brawler
│   ├── POST /register
│   └── GET /my-missions
├── /view
│   ├── GET /gets          (list missions)
│   ├── GET /:id           (mission detail)
│   └── GET /roster/:id    (crew list)
├── /mission-management
│   ├── POST /             (create mission)
│   ├── PATCH /:id         (update mission)
│   └── DELETE /:id        (delete mission)
├── /mission
│   ├── PATCH /in-progress/:id
│   ├── PATCH /to-completed/:id
│   └── PATCH /to-failed/:id
├── /crew
│   ├── POST /join/:id
│   └── DELETE /leave/:id
└── /mission-chats
    ├── GET /:missionId
    └── POST /:missionId
```

---

## 🎨 UI/UX Highlights

### **Gang Theme**
- สีหลัก: Cyber-punk style (สีม่วง, สีฟ้า, สีเขียว neon)
- Glitch effects บนข้อความ
- Dark mode เป็นหลัก
- Micro-animations ทั่วทั้ง app

### **Responsive Design**
- รองรับ Mobile, Tablet, Desktop
- Breakpoints ที่ 768px และ 1200px

### **Error Handling**
- Custom 404 Page (Gang-themed)
- Custom 500 Page (Gang-themed)
- Graceful fallbacks (เช่น WS → Polling)

---

## 📝 สรุป Flow หลักของ App

```
User เปิด App
    ↓
[ไม่ได้ Login] → หน้า Home → กด Login → กรอก form → Login สำเร็จ
    ↓
[Login แล้ว] → หน้า Profile / Missions
    ↓
หน้า Missions → Browse missions → Join mission
    ↓
หน้า About Mission → ดูรายละเอียด → Chat กับ crew → Chief สามารถ Start/Complete/Fail
    ↓
ระบบ Notifications → แจ้งเตือนเมื่อมี missions ใหม่ / status เปลี่ยน
```

---

**Made with ❤️ by GangBro Team**

*Last Updated: 2026-02-08*
